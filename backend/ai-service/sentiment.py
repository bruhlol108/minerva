"""
Sentiment analysis using Gemini Flash (fast and cheap)
"""

import json
from typing import List, Dict
import google.generativeai as genai

flash_model = genai.GenerativeModel('gemini-2.0-flash-exp')

async def analyze_sentiment_batch(complaints: List[str]) -> List[Dict]:
    """
    Analyze sentiment of multiple complaints in batch
    Returns: [{ sentiment: 'positive|negative|neutral', score: -1 to 1, category: str }]
    """

    prompt = f"""
    Analyze the sentiment and categorize the following customer complaints.

    Complaints:
    {json.dumps(complaints, indent=2)}

    For each complaint, return JSON with:
    {{
      "sentiment": "positive|negative|neutral",
      "score": <-1.0 to 1.0>,
      "category": "auth|billing|performance|support|ui|network|other"
    }}

    Return as array of objects, one per complaint.
    """

    generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.2
    )

    response = flash_model.generate_content(prompt, generation_config=generation_config)
    results = json.loads(response.text)

    return results
