from collections import defaultdict
from .database import scan_cache_table
from datetime import datetime, timezone, timedelta
import asyncio


def batch_list(lst, batch_size):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), batch_size):
        yield lst[i:i + batch_size]


async def link_cached(link):
    """Check if the link is already cached in the database."""
    cached = await scan_cache_table.find_one({"link": link, "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}})
    if cached:
        return True, cached.get("data")
    else:
        return False, None

async def cache_link(link, data):
    """Cache the analysis result for a link in the database."""
    await scan_cache_table.update_one(
        {"link": link},
        {
            "$set": {
                "data": data,
                "timestamp": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )