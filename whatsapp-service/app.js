const { Client } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const qrcode = require('qrcode');
require("dotenv").config();
const app = express();
app.use(bodyParser.json());

process.on('uncaughtException', (err) => {
    console.error(`Uncaught Exception: ${err.stack || err}`);
});

const wwebVersion = '2.24.7.72';
const mongoUri = process.env.MONGODB_URL || "mongodb://localhost:27017";
const ragUrl= process.env.RAG_SERVICE_URL || ''
const mongo_client = new MongoClient(mongoUri);

mongo_client.connect().then(() => {
    const PORT = process.env.WHATSAPP_SERVICE_PORT || 6000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

let client
let health = false


app.get('/health', async(req, res) =>{
    if(health){
       return res.json({message:"Whatsapp Service Connected!"})
    }
    res.status(500).json({error:"Whatsapp service not connected yet"})
})



app.post('/api/v1/connect', async (req, res) => {
    try {
        await createNewClient(res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


const ndpaBackend = async (question) => {
  const url = `${ragUrl}/api/v1/ndpa/qa`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.message;
};


app.post('/api/v1/chat', async (req, res) => {
    const message = req.body.message
    const phone = req.body.phone
    const chatId = phone.substring(1) + "@c.us";

    if(client){
        client.sendMessage(chatId, message)
        res.json({message:'sent'})
    }else{
        res.status(500).json({error:'Whatsapp client down'})
    }

});


function removeListeners() {
    if (!client) return;
    try {
        client.removeAllListeners('qr');
        client.removeAllListeners('authenticated');
        client.removeAllListeners('disconnected');
        client.removeAllListeners('message');
        console.log(`Event listeners removed for`);
    } catch (error) {
        console.error(`Error removing listeners for`);
    }
}



async function createNewClient(res) {
    try {
        client = new Client({
            puppeteer: {
                args: ['--no-sandbox'],
            },
            webVersionCache: {
                type: 'remote',
                remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
            },
        });

        client.on('qr', (qr) => {
            if (res && !res.headersSent) {
                qrcode.toDataURL(qr, (err, url) => {
                    res.status(200).json({ data: url });
                });
            }
        });

        client.on('authenticated', async (se) => {
            health= true
            console.log(`Service authenticated and ready`)
        });

        client.on('ready', (m) => {
            console.log(`Client is ready for ${phoneNumber}!`);
        });

        client.on('message', async (msg) => {
            if (!msg.from.endsWith('@g.us') && !msg.from.endsWith('@broadcast') && !msg.from.endsWith('@newsletter')) {
                if (msg.hasMedia) {
                    await msg.reply("Sorry, I can't process media files at the moment.");
                } else {
                    const chat = await msg.getChat();
                    await chat.sendStateTyping()
                    let resp=await ndpaBackend(msg.body)
                    await msg.reply(resp)

                }
            }
        });

        client.on('disconnected', async (reason) => {
            try {
                console.log(`Client disconnected. Reason: ${reason}`);
                removeListeners()
            } catch (error) {
                console.error(`Error during disconnection handling ${error}`);
            }
        });

        client.initialize();
    } catch (error) {
        console.error(error);
    }
}

