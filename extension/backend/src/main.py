from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from .schemas import URLSchema, QASchema
from .agents import  web_chunker_node, ndpa_rag
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
import logging


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


app=FastAPI(title="DataVault ClauseGuard API", version="0.0.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def is_valid_url(url: str) -> bool:
    try:
        result = urlparse(url)
        return all([result.scheme in ("https", "http"), result.netloc])
    except Exception:
        return False

@app.get("/")
async def home():
    return {"status": "DataVault ClauseGuard"}




@app.post("/api/v1/analyze/link")
async def privacy_analyze(data: URLSchema):
    if not is_valid_url(data.url):
        raise HTTPException(status_code=400, detail="Invalid url")
    result = await web_chunker_node(data.url)
    return JSONResponse(result)


@app.post("/api/v1/ndpa/qa")
async def ndpa_qa(data: QASchema):
    result = await ndpa_rag(data.question)
    return JSONResponse({"message":result})

