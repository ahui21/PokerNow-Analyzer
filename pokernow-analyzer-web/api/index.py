from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
async def root():
    return {"message": "API root is working"}

@app.get("/api/test")
async def test():
    return {"message": "Test endpoint working!"}

@app.get("/api/healthcheck")
async def healthcheck():
    return {
        "status": "ok",
        "message": "Backend is running",
        "timestamp": str(datetime.now())
    } 