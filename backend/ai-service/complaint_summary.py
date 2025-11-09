"""
Complaint summarization with clustering using Gemini Flash
"""

import json
from typing import Dict, Any, List
from datetime import datetime, timedelta
import google.generativeai as genai

flash_model = genai.GenerativeModel('gemini-2.0-flash-exp')

async def generate_complaint_summary(company_id: str, time_range: str, supabase) -> Dict[str, Any]:
    """
    Generate clustered complaint summary
    """

    # Parse time range
    range_map = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
    }

    hours = range_map.get(time_range, 24)
    since = (datetime.now() - timedelta(hours=hours)).isoformat()

    # Fetch complaints
    response = supabase.table('complaints')\
        .select('*')\
        .eq('company_id', company_id)\
        .gte('timestamp', since)\
        .order('timestamp', desc=True)\
        .execute()

    complaints = response.data

    if not complaints or len(complaints) == 0:
        return {
            "clusters": [],
            "total_complaints": 0,
            "time_range": time_range
        }

    # Group complaints by category if available
    categorized = {}
    for c in complaints:
        category = c.get('category', 'uncategorized')
        if category not in categorized:
            categorized[category] = []
        categorized[category].append(c['text'])

    # Generate summary for each category
    clusters = []

    for category, texts in categorized.items():
        if len(texts) > 0:
            # Use Gemini to summarize
            summary_text = await summarize_category(category, texts)

            clusters.append({
                "category": category,
                "count": len(texts),
                "percentage": round(len(texts) / len(complaints) * 100, 1),
                "summary": summary_text,
                "sample_complaints": texts[:3]  # Include 3 samples
            })

    # Sort by count
    clusters.sort(key=lambda x: x['count'], reverse=True)

    return {
        "clusters": clusters,
        "total_complaints": len(complaints),
        "time_range": time_range
    }

async def summarize_category(category: str, complaints: List[str]) -> str:
    """
    Use Gemini Flash to summarize complaints in a category
    """

    # Take max 20 complaints for summarization to stay within token limits
    sample = complaints[:20]

    prompt = f"""
    Summarize the following {category} complaints in 2-3 concise sentences.
    Focus on the main issues and user pain points.

    Complaints:
    {json.dumps(sample, indent=2)}

    Provide a brief summary that captures the essence of these complaints.
    """

    response = flash_model.generate_content(prompt)
    summary = response.text.strip()

    return summary
