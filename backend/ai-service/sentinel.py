"""
MINERVA Sentinel - Predictive Outage Detection Algorithm
Uses statistical analysis + AI to predict outages 15-30 minutes before they're visible
"""

import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List
import google.generativeai as genai

# Initialize Gemini Pro for predictions
pro_model = genai.GenerativeModel('gemini-2.0-flash-exp')

async def detect_outage_risk(company_id: str, supabase) -> Dict[str, Any]:
    """
    Main Sentinel detection algorithm
    Returns prediction with risk level, confidence, and action plan
    """

    # Step 1: Fetch recent metrics (last 10 minutes)
    ten_min_ago = (datetime.now() - timedelta(minutes=10)).isoformat()

    recent_metrics_response = supabase.table('metrics_timeseries')\
        .select('*')\
        .eq('company_id', company_id)\
        .gte('timestamp', ten_min_ago)\
        .execute()

    recent_metrics = recent_metrics_response.data

    # Step 2: Fetch historical patterns (last 30 days for baseline)
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()

    historical_metrics_response = supabase.table('metrics_timeseries')\
        .select('*')\
        .eq('company_id', company_id)\
        .gte('timestamp', thirty_days_ago)\
        .execute()

    historical_metrics = historical_metrics_response.data

    # Step 3: Fetch recent complaints for context
    recent_complaints_response = supabase.table('complaints')\
        .select('*')\
        .eq('company_id', company_id)\
        .gte('timestamp', ten_min_ago)\
        .execute()

    recent_complaints = recent_complaints_response.data

    # Step 4: Calculate velocities and Z-scores
    anomaly_detected, metrics_summary = calculate_anomaly_scores(
        recent_metrics,
        historical_metrics,
        recent_complaints
    )

    if not anomaly_detected:
        return {
            "risk_level": "low",
            "confidence": 0,
            "message": "No anomalies detected"
        }

    # Step 5: Extract keywords from recent complaints
    keywords = extract_top_keywords([c['text'] for c in recent_complaints])

    # Step 6: Fetch similar historical incidents
    similar_incidents = await fetch_similar_incidents(keywords, company_id, supabase)

    # Step 7: Use Gemini Pro to generate prediction
    prediction = await generate_ai_prediction(
        metrics_summary,
        keywords,
        similar_incidents
    )

    # Step 8: Store prediction in database
    stored_prediction = supabase.table('outage_predictions').insert({
        'company_id': company_id,
        'risk_level': prediction['risk_level'],
        'confidence': prediction['confidence'],
        'predicted_service': prediction.get('predicted_service'),
        'estimated_impact': prediction.get('estimated_impact'),
        'time_to_critical': prediction.get('time_to_critical'),
        'action_plan': prediction.get('action_plan'),
        'similar_incident_id': prediction.get('similar_incident_id'),
    }).execute()

    return prediction

def calculate_anomaly_scores(recent_metrics: List[Dict], historical_metrics: List[Dict], recent_complaints: List[Dict]) -> tuple:
    """
    Calculate Z-scores for key metrics to detect anomalies
    """

    # Group metrics by type
    happiness_recent = [float(m['value']) for m in recent_metrics if m['metric_type'] == 'happiness']
    happiness_historical = [float(m['value']) for m in historical_metrics if m['metric_type'] == 'happiness']

    # Calculate complaint velocity
    complaint_velocity = len(recent_complaints) / 10.0 * 60  # Complaints per hour

    # Historical complaint rate
    historical_complaints_response = [c for c in recent_complaints]
    historical_complaint_rate = len(historical_complaints_response) / (30 * 24)  # Per hour over 30 days

    # Calculate happiness drop
    happiness_drop = 0
    if len(happiness_recent) >= 2:
        happiness_drop = happiness_recent[0] - happiness_recent[-1]

    # Calculate sentiment velocity (if available)
    sentiment_scores = [float(c.get('sentiment_score', 0)) for c in recent_complaints if c.get('sentiment_score')]
    avg_sentiment = np.mean(sentiment_scores) if sentiment_scores else 0

    # Calculate Z-scores
    z_scores = {}

    # Happiness drop Z-score
    if len(happiness_historical) > 1:
        historical_drops = []
        for i in range(len(happiness_historical) - 10):
            drop = happiness_historical[i] - happiness_historical[i + 10]
            historical_drops.append(drop)

        if len(historical_drops) > 0:
            mean_drop = np.mean(historical_drops)
            std_drop = np.std(historical_drops) if np.std(historical_drops) > 0 else 1
            z_scores['happiness_drop'] = (happiness_drop - mean_drop) / std_drop

    # Complaint velocity Z-score
    z_scores['complaint_velocity'] = (complaint_velocity - historical_complaint_rate) / max(historical_complaint_rate, 1)

    # Sentiment Z-score
    z_scores['sentiment'] = avg_sentiment * -10  # Negative sentiment should increase Z-score

    # Detect anomaly if 2+ metrics have |Z| > 2
    anomalous_metrics = sum([abs(z) > 2 for z in z_scores.values()])
    anomaly_detected = anomalous_metrics >= 2

    metrics_summary = {
        'complaint_velocity': complaint_velocity,
        'complaint_velocity_z': z_scores.get('complaint_velocity', 0),
        'happiness_drop': happiness_drop,
        'happiness_drop_z': z_scores.get('happiness_drop', 0),
        'avg_sentiment': avg_sentiment,
        'sentiment_z': z_scores.get('sentiment', 0),
        'anomalous_metrics_count': anomalous_metrics,
    }

    return anomaly_detected, metrics_summary

def extract_top_keywords(complaints: List[str], top_n: int = 10) -> List[str]:
    """
    Extract most common keywords from complaints (simple frequency-based)
    """
    from collections import Counter
    import re

    # Simple tokenization
    words = []
    for complaint in complaints:
        # Remove punctuation and convert to lowercase
        cleaned = re.sub(r'[^\w\s]', '', complaint.lower())
        words.extend(cleaned.split())

    # Filter out common stop words
    stop_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'to', 'from', 'in', 'out', 'up', 'down', 'of', 'for', 'with', 'and', 'or', 'but', 'not', 'so', 'than', 'too', 'very', 'can', 'just', 'dont', 'im', 'ive'}

    filtered_words = [w for w in words if w not in stop_words and len(w) > 2]

    # Get top keywords
    counter = Counter(filtered_words)
    return [word for word, count in counter.most_common(top_n)]

async def fetch_similar_incidents(keywords: List[str], company_id: str, supabase) -> List[Dict]:
    """
    Fetch similar historical incidents based on keywords
    """
    # For simplicity, just fetch recent historical incidents
    # In production, you'd use vector similarity search
    response = supabase.table('historical_incidents')\
        .select('*')\
        .eq('company_id', company_id)\
        .order('occurred_at', desc=True)\
        .limit(5)\
        .execute()

    return response.data

async def generate_ai_prediction(metrics_summary: Dict, keywords: List[str], similar_incidents: List[Dict]) -> Dict:
    """
    Use Gemini Pro to generate intelligent prediction
    """

    prompt = f"""
    You are MINERVA Sentinel, an AI system that predicts service outages before they become critical.

    Analyze the following data and predict if an outage is imminent:

    **Current Metrics:**
    - Complaint velocity: {metrics_summary['complaint_velocity']:.1f} complaints/hour (Z-score: {metrics_summary['complaint_velocity_z']:.2f})
    - Happiness drop: {metrics_summary['happiness_drop']:.1f}% in last 10 minutes (Z-score: {metrics_summary['happiness_drop_z']:.2f})
    - Average sentiment: {metrics_summary['avg_sentiment']:.2f} (Z-score: {metrics_summary['sentiment_z']:.2f})
    - Anomalous metrics: {metrics_summary['anomalous_metrics_count']} out of 3

    **Top complaint keywords:** {', '.join(keywords[:5])}

    **Similar past incidents:** {len(similar_incidents)} found

    Based on this data, provide a prediction in the following JSON format:
    {{
      "risk_level": "low|medium|high|critical",
      "confidence": <0-100>,
      "predicted_service": "auth|payment|network|app|database|api",
      "estimated_impact": <number_of_users>,
      "time_to_critical": <minutes_until_major_impact>,
      "action_plan": ["action1", "action2", "action3"],
      "similar_incident_id": <id_or_null>,
      "reasoning": "Brief explanation"
    }}

    Guidelines:
    - risk_level: critical if Z-scores > 3, high if > 2.5, medium if > 2
    - confidence: Higher if multiple metrics anomalous and keywords match known issues
    - predicted_service: Infer from keywords (e.g., "login" → "auth", "payment" → "payment")
    - estimated_impact: Scale based on complaint velocity and historical data
    - time_to_critical: Estimate based on rate of degradation
    - action_plan: 3-5 specific actions to take immediately
    """

    generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.3
    )

    response = pro_model.generate_content(prompt, generation_config=generation_config)
    prediction = json.loads(response.text)

    return prediction
