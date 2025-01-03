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

# Debug: Print environment variables (excluding sensitive data)
print("SUPABASE_URL exists:", bool(os.getenv('SUPABASE_URL')))
print("SUPABASE_KEY exists:", bool(os.getenv('SUPABASE_KEY')))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

file_processor = FileProcessor()
supabase_service = SupabaseService()

@app.get("/sessions")
async def get_sessions():
    try:
        print("Attempting to fetch sessions...")
        sessions = await supabase_service.get_sessions()
        print(f"Successfully fetched {len(sessions)} sessions")
        return sessions
    except Exception as e:
        print(f"Error in get_sessions: {str(e)}")
        return {"status": "error", "message": str(e)}

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