from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Adapter
import os
from services.supabase_service import SupabaseService

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

supabase_service = SupabaseService()

@app.get("/api/sessions")
async def get_sessions():
    try:
        print("Attempting to fetch sessions...")
        print("Environment check:")
        print("SUPABASE_URL exists:", bool(os.getenv('SUPABASE_URL')))
        print("SUPABASE_KEY exists:", bool(os.getenv('SUPABASE_KEY')))
        sessions = await supabase_service.get_sessions()
        print(f"Successfully fetched {len(sessions)} sessions")
        return sessions
    except Exception as e:
        print(f"Error in get_sessions: {str(e)}")
        return {"status": "error", "message": str(e)}

# Add other endpoints from your original app.py here...

handler = Adapter(app) 