import axios from 'axios'
import nodemailer from 'nodemailer'

const whatsappUrl= process.env.WHATSAPP_SERVICE_URL as string

export class NotificationService {

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.SMTP_MAIL,
          pass: process.env.SMTP_PASS
      }
    })
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to,
      subject,
      html: body
    }
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error)
      }
      console.log('Email sent: ' + info.response)
    })
  }

  async sendWhatsApp(phone: string, message: string): Promise<void> {
    let data= {
      phone,
      message
    }
    try{
    const resp=await axios.post(`${whatsappUrl}/api/v1/chat`, data)
    if (resp.status == 200){
      console.log(`Sent WhatsApp message  to ${phone}: ${message}`)
    }
    console.log(`Failed to send WhatsApp to ${phone}: ${message}`)
  } catch(error){
    console.log(`Failed to send WhatsApp to ${phone}: ${message}\nError: ${error}`)
  }
  }

  async notifyAccessRequest(
    user: { email: string, phone: string, name: string },
    company: { companyName: string },
    requestedData: string[]
  ): Promise<void> {
    const emailBody = `
  <h2>Data Access Approval</h2>
  <p>Hi ${user.name},</p>
  <p>You have successfully approved a data access request for:</p>
  <ul>
    ${requestedData.map(d => `<li>${d}</li>`).join('')}
  </ul>
  <p>The approved company is: <strong>${company.companyName}</strong>.</p>
  <p>If you did not authorize this or want to review your permissions, please visit:</p>
  <p><a href="https://datavault.ng/authorize">Manage Access</a></p>
`


    await this.sendEmail(user.email, 'Data Access Request', emailBody)

   const whatsappMsg =
  `You have approved ${company.companyName} to access your data: ${requestedData.join(', ')}. ` +
  `Manage or review access at datavault.ng/authorize`

    await this.sendWhatsApp(user.phone, whatsappMsg)
  }

  async notifyDataAccess(
    user: { email: string, phone: string, name: string },
    company: { companyName: string },
    dataAccessed: string[]
  ): Promise<void> {
    const emailBody = `
  <h2>Data Access Notification</h2>
  <p>Hi ${user.name},</p>

  <p><strong>${company.companyName}</strong> has just accessed the following information from your DataVault profile:</p>

  <ul>
    ${dataAccessed.map(d => `<li>${d}</li>`).join('')}
  </ul>

  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>

  <p>
    You can review full access details in your logs:
    <br />
    <a href="https://datavault.ng/logs" style="color:#1a73e8 text-decoration:none">
      View Access Logs
    </a>
  </p>
`

    await this.sendEmail(user.email, `${company.companyName} accessed your Data`, emailBody)

    const whatsappMsg = `${company.companyName} just accessed your data: ${dataAccessed.join(', ')}. Review your access logs at https://datavault.ng/logs.`

    await this.sendWhatsApp(user.phone, whatsappMsg)
  }
}
