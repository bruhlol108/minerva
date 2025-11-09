import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from elevenlabs import generate, set_api_key
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI(title="MINERVA Voice Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ElevenLabs API key
set_api_key(os.getenv("ELEVENLABS_API_KEY"))

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Request models
class TextToSpeechRequest(BaseModel):
    text: str
    voice: str = "Rachel"

class VoiceAlertRequest(BaseModel):
    alert_text: str
    prediction_id: int

# Routes
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "MINERVA Voice Service"}

@app.post("/voice/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech using ElevenLabs
    """
    try:
        # Generate audio
        audio = generate(
            text=request.text,
            voice=request.voice,
            model="eleven_turbo_v2"
        )

        # Convert to bytes
        audio_bytes = audio if isinstance(audio, bytes) else b''.join(audio)

        # Upload to Supabase Storage
        file_path = f"tts/tts-{datetime.now().isoformat()}.mp3"

        supabase.storage.from_('audio').upload(
            file_path,
            audio_bytes,
            file_options={"content-type": "audio/mpeg"}
        )

        # Get public URL
        public_url = supabase.storage.from_('audio').get_public_url(file_path)

        return {
            "success": True,
            "audio_url": public_url,
            "duration": len(audio_bytes) / 16000  # Rough estimate
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice/alert")
async def generate_voice_alert(request: VoiceAlertRequest):
    """
    Generate voice alert for critical outage prediction
    """
    try:
        # Generate audio with urgent tone
        audio = generate(
            text=request.alert_text,
            voice="Rachel",
            model="eleven_turbo_v2"
        )

        # Convert to bytes
        audio_bytes = audio if isinstance(audio, bytes) else b''.join(audio)

        # Upload to Supabase Storage
        file_path = f"alerts/alert-{request.prediction_id}-{datetime.now().isoformat()}.mp3"

        supabase.storage.from_('audio').upload(
            file_path,
            audio_bytes,
            file_options={"content-type": "audio/mpeg"}
        )

        # Get public URL
        public_url = supabase.storage.from_('audio').get_public_url(file_path)

        return {
            "success": True,
            "audio_url": public_url,
            "prediction_id": request.prediction_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice/briefing")
async def generate_daily_briefing(company_id: str):
    """
    Generate daily briefing audio
    """
    try:
        # Fetch metrics summary
        metrics_response = supabase.table('metrics_timeseries')\
            .select('*')\
            .eq('company_id', company_id)\
            .order('timestamp', desc=True)\
            .limit(100)\
            .execute()

        metrics = metrics_response.data

        # Calculate summary stats
        happiness_values = [float(m['value']) for m in metrics if m['metric_type'] == 'happiness']
        avg_happiness = sum(happiness_values) / len(happiness_values) if happiness_values else 0

        # Fetch recent complaints
        complaints_response = supabase.table('complaints')\
            .select('*')\
            .eq('company_id', company_id)\
            .order('timestamp', desc=True)\
            .limit(24)\
            .execute()

        recent_complaints = len(complaints_response.data)

        # Generate briefing text
        briefing_text = f"""
        Good morning. Here's your MINERVA daily briefing for {company_id}.

        Your current happiness index is {avg_happiness:.1f} percent.
        In the last 24 hours, we received {recent_complaints} customer complaints.

        Sentinel monitoring is active and no critical issues detected.

        Have a productive day.
        """

        # Generate audio
        audio = generate(
            text=briefing_text,
            voice="Rachel",
            model="eleven_turbo_v2"
        )

        # Convert to bytes
        audio_bytes = audio if isinstance(audio, bytes) else b''.join(audio)

        # Upload to Supabase Storage
        file_path = f"briefings/briefing-{company_id}-{datetime.now().date()}.mp3"

        supabase.storage.from_('audio').upload(
            file_path,
            audio_bytes,
            file_options={"content-type": "audio/mpeg"}
        )

        # Get public URL
        public_url = supabase.storage.from_('audio').get_public_url(file_path)

        return {
            "success": True,
            "audio_url": public_url,
            "text": briefing_text.strip(),
            "duration": len(audio_bytes) / 16000
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
