from fastapi import FastAPI
from mangum import Adapter
import os

app = FastAPI()

@app.get("/api/debug")
async def debug():
    return {
        "supabase_url_exists": bool(os.getenv('SUPABASE_URL')),
        "supabase_key_exists": bool(os.getenv('SUPABASE_KEY')),
        "supabase_url": os.getenv('SUPABASE_URL')
    }

handler = Adapter(app) 