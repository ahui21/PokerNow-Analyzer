from fastapi import FastAPI, UploadFile, File, Body, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from tempfile import NamedTemporaryFile
from typing import List, Union
from services.file_processor import FileProcessor
from services.supabase_service import SupabaseService
from pydantic import BaseModel, validator
from fastapi.responses import JSONResponse
from datetime import datetime

app = FastAPI()

# Update CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://www.pokernowanalyzer.com",
        "https://pokernowanalyzer.com",
        "https://pokernow-analyzer-pswnfq4ur-alwins-projects-7d50617f.vercel.app"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

file_processor = FileProcessor()
supabase_service = SupabaseService()

class ActiveUpdate(BaseModel):
    active: bool

class TagUpdate(BaseModel):
    tag: str

class BulkTagUpdate(BaseModel):
    session_ids: List[Union[int, str]]  # Allow both int and str
    tag: str

    @validator('session_ids', pre=True)
    def validate_session_ids(cls, v):
        if not v:
            raise ValueError("session_ids cannot be empty")
        return [int(id) for id in v]  # Convert all to int

    @validator('tag')
    def validate_tag(cls, v):
        if not v or not v.strip():
            raise ValueError("tag cannot be empty")
        return v.strip()

@app.get("/test")
async def test_endpoint():
    return {"message": "Backend is working!"}

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    results = {
        "processed": [],
        "failed": [],
        "skipped": []
    }

    for file in files:
        try:
            with NamedTemporaryFile(delete=False) as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_file.flush()

                file_data = file_processor.process_file(temp_file.name)
                file_data['file_id'] = file_processor.extract_file_id(file.filename)

                # Check if file already exists
                if await supabase_service.check_file_exists(file_data['file_id']):
                    results["skipped"].append(file.filename)
                    continue

                await supabase_service.create_session(file_data)
                results["processed"].append(file.filename)

            os.unlink(temp_file.name)

        except Exception as e:
            results["failed"].append({
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "status": "success" if results["processed"] else "error",
        **results
    }

@app.get("/sessions")
async def get_sessions():
    try:
        sessions = await supabase_service.get_sessions()
        return sessions
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/sessions/bulk/tags")
async def bulk_add_tag(update: BulkTagUpdate):
    try:
        print("\n=== Bulk Tag Update Request ===")
        print(f"Raw update data: {update}")
        print(f"Session IDs (type: {type(update.session_ids)}): {update.session_ids}")
        print(f"Tag (type: {type(update.tag)}): {update.tag}")
        
        results = await supabase_service.bulk_add_tag(update.session_ids, update.tag)
        print("Operation successful")
        print(f"Results: {results}")
        return {"status": "success", "data": results}
    except Exception as e:
        print("\n=== Error in bulk_add_tag ===")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        return {"status": "error", "message": str(e), "detail": [{"msg": str(e)}]}

@app.post("/sessions/{session_id}/tags")
async def add_tag(session_id: int, update: TagUpdate):
    try:
        result = await supabase_service.add_tag(session_id, update.tag)
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/sessions/{session_id}/tags/{tag}")
async def remove_tag(session_id: int, tag: str):
    try:
        result = await supabase_service.remove_tag(session_id, tag)
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/sessions/{session_id}/toggle-active")
async def toggle_session_active(session_id: int, update: ActiveUpdate):
    try:
        print(f"Backend received toggle request for session {session_id} to active={update.active}")
        result = await supabase_service.toggle_session_active(session_id, update.active)
        print(f"Toggle result: {result}")
        return {"status": "success", "data": result}
    except Exception as e:
        print(f"Error in toggle endpoint: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/healthcheck")
async def healthcheck():
    try:
        # Test Supabase connection
        await supabase_service.get_sessions()
        return JSONResponse(
            content={
                "status": "ok",
                "message": "Backend is running and Supabase connection is working",
                "timestamp": str(datetime.now()),
                "environment": os.getenv('VERCEL_ENV', 'development')
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Backend is running but Supabase connection failed",
                "error": str(e),
                "timestamp": str(datetime.now()),
                "environment": os.getenv('VERCEL_ENV', 'development')
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )