from fastapi import FastAPI, UploadFile, File, Body, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from tempfile import NamedTemporaryFile
from typing import List, Union
from services.file_processor import FileProcessor
from services.supabase_service import SupabaseService
from pydantic import BaseModel, validator
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

file_processor = FileProcessor()
supabase_service = SupabaseService()

@app.get("/")
async def root():
    return {"message": "API root is working"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint working!"}

@app.get("/healthcheck")
async def healthcheck():
    return {
        "status": "ok",
        "message": "Backend is running",
        "timestamp": str(datetime.now())
    }

# This is required for Vercel
from mangum import Adapter
handler = Adapter(app) 