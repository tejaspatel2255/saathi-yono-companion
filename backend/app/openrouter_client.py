import logging
import httpx
from typing import List, Dict
from app.config import settings

logger = logging.getLogger("saathi_openrouter")

async def call_openrouter_chat(messages: List[Dict[str, str]], system_prompt: str) -> str:
    """
    Calls the OpenRouter API using google/gemini-2.5-flash with the provided messages and system prompt.
    """
    if not settings.OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY is not set.")
        return "Error: OPENROUTER_API_KEY is not configured on the backend server."
    
    # Build complete message history, placing system prompt at the beginning
    payload_messages = [{"role": "system", "content": system_prompt}] + messages
    
    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": payload_messages,
        "temperature": 0.3
    }
    
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/saathi-sbi",
        "X-Title": "SAATHI YONO Companion"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.OPENROUTER_API_BASE}/chat/completions",
                json=payload,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"OpenRouter API error (status {response.status_code}): {response.text}")
                return "I'm sorry, I'm having trouble connecting to my AI module right now. Please try again shortly."
            
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            return reply.strip()
            
    except Exception as e:
        logger.error(f"Failed to communicate with OpenRouter: {str(e)}")
        return "An unexpected connection error occurred while generating a response. Please try again."
