"""
SWOT Analysis generation using Gemini Pro
"""

import json
from typing import Dict, Any
import google.generativeai as genai

pro_model = genai.GenerativeModel('gemini-2.0-flash-exp')

async def generate_swot_analysis(company_id: str, supabase) -> Dict[str, Any]:
    """
    Generate SWOT analysis based on company metrics and competitor data
    """

    # Fetch company metrics
    company_response = supabase.table('brand_profiles')\
        .select('*')\
        .eq('company_name', company_id)\
        .single()\
        .execute()

    company_data = company_response.data if company_response.data else {}

    # Fetch competitor data
    competitors_response = supabase.table('brand_profiles')\
        .select('*')\
        .neq('company_name', company_id)\
        .limit(3)\
        .execute()

    competitors = competitors_response.data

    # Fetch recent metrics
    recent_metrics_response = supabase.table('metrics_timeseries')\
        .select('*')\
        .eq('company_id', company_id)\
        .order('timestamp', desc=True)\
        .limit(100)\
        .execute()

    recent_metrics = recent_metrics_response.data

    # Calculate summary stats
    happiness_values = [float(m['value']) for m in recent_metrics if m['metric_type'] == 'happiness']
    avg_happiness = sum(happiness_values) / len(happiness_values) if happiness_values else 0

    # Fetch recent complaints for weaknesses
    recent_complaints_response = supabase.table('complaints')\
        .select('*')\
        .eq('company_id', company_id)\
        .order('timestamp', desc=True)\
        .limit(50)\
        .execute()

    complaints = recent_complaints_response.data

    prompt = f"""
    Generate a comprehensive SWOT analysis for company: {company_id}

    **Current Metrics:**
    - Average Happiness Index: {avg_happiness:.1f}%
    - Recent Complaints: {len(complaints)}

    **Competitor Data:**
    {json.dumps([c.get('company_name') for c in competitors], indent=2)}

    **Recent Complaint Themes:**
    {json.dumps([c.get('text', '')[:100] for c in complaints[:5]], indent=2)}

    Generate a SWOT analysis in JSON format:
    {{
      "strengths": ["strength1", "strength2", "strength3", "strength4"],
      "weaknesses": ["weakness1", "weakness2", "weakness3", "weakness4"],
      "opportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4"],
      "threats": ["threat1", "threat2", "threat3", "threat4"]
    }}

    Make each point specific, actionable, and based on the data provided.
    """

    generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.4
    )

    response = pro_model.generate_content(prompt, generation_config=generation_config)
    swot = json.loads(response.text)

    # Store in database
    supabase.table('swot_analyses').insert({
        'company_id': company_id,
        'content': swot
    }).execute()

    return swot
