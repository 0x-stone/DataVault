from motor import motor_asyncio
from dotenv import load_dotenv
import os
load_dotenv()
client=motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URL"))
db=client['datavault-extension']
scan_cache_table=db['scan_cache']
