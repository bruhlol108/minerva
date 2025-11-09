import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MINERVA AI Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Import services
from sentinel import detect_outage_risk
from sentiment import analyze_sentiment_batch
from swot import generate_swot_analysis
from complaint_summary import generate_complaint_summary

# Request models
class SentinelAnalyzeRequest(BaseModel):
    company_id: str

class SentimentAnalyzeRequest(BaseModel):
    complaints: List[str]
    company_id: str

class SwotRequest(BaseModel):
    company_id: str

class ComplaintSummaryRequest(BaseModel):
    company_id: str
    time_range: str = "24h"

# Routes
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "MINERVA AI Service"}

@app.post("/sentinel/analyze")
async def analyze_sentinel(request: SentinelAnalyzeRequest):
    """
    Analyze metrics for potential outage prediction using Sentinel algorithm
    """
    try:
        prediction = await detect_outage_risk(request.company_id, supabase)
        return {"success": True, "prediction": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/sentiment")
async def analyze_sentiment(request: SentimentAnalyzeRequest):
    """
    Analyze sentiment of complaints using Gemini Flash
    """
    try:
        results = await analyze_sentiment_batch(request.complaints)
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/swot")
async def generate_swot(request: SwotRequest):
    """
    Generate SWOT analysis using Gemini Pro
    """
    try:
        swot = await generate_swot_analysis(request.company_id, supabase)
        return {"success": True, "swot": swot}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/complaint-summary")
async def summarize_complaints(request: ComplaintSummaryRequest):
    """
    Generate complaint summary with clustering using Gemini Flash
    """
    try:
        summary = await generate_complaint_summary(
            request.company_id,
            request.time_range,
            supabase
        )
        return {"success": True, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
