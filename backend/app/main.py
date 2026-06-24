import os
import re
import json
import logging
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

# Add parent directory of 'backend' to sys.path to access 'agents' folder
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

# Load Environment Variables first
from dotenv import load_dotenv
load_dotenv()

from app.config import settings
from app.supabase_client import supabase_client

# Import the new LangChain Agent classes
from agents.nudge_agent import NudgeAgent
from agents.recommendation_agent import RecommendationAgent
from agents.conversation_agent import ConversationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("saathi_main")

app = FastAPI(
    title="SAATHI API Backend",
    description="Agentic AI Financial Companion for SBI YONO Users",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LangChain agents
nudge_agent = NudgeAgent(api_key=settings.OPENROUTER_API_KEY)
recommendation_agent = RecommendationAgent(api_key=settings.OPENROUTER_API_KEY)
conversation_agent = ConversationAgent(api_key=settings.OPENROUTER_API_KEY)

# -------------------------------------------------------------------------
# Request/Response Schemas
# -------------------------------------------------------------------------
class ChatRequest(BaseModel):
    user_id: str
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    reply: str

class Nudge(BaseModel):
    id: Optional[str] = None
    user_id: str
    type: str
    message: str
    sent_at: str
    is_read: bool
    channel: str

class NudgeListResponse(BaseModel):
    nudges: List[Nudge]

class Recommendation(BaseModel):
    id: Optional[str] = None
    user_id: str
    product_type: str
    reason: str
    score: float
    shown_at: str

class RecommendationListResponse(BaseModel):
    recommendations: List[Recommendation]

# -------------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "SAATHI API Backend",
        "version": "1.0.0",
        "api_prefix": "/api/v1"
    }

# 1. POST /api/v1/chat
@app.post("/api/v1/chat", response_model=ChatResponse)
async def post_chat(request: ChatRequest):
    """
    Retrieves previous chat history from Supabase, delegates the banking query to the
    ConversationAgent (LangChain + OpenRouter), saves logs in the database, and returns the response.
    """
    # 1. Save the User conversation message first
    if supabase_client:
        try:
            supabase_client.table("conversations").insert({
                "user_id": request.user_id,
                "role": "user",
                "message": request.message,
                "language": request.language
            }).execute()
        except Exception as e:
            logger.error(f"Error saving user message to database: {str(e)}")

    # 2. Fetch past conversation history (last 10 messages)
    history = []
    if supabase_client:
        try:
            response = supabase_client.table("conversations")\
                .select("role", "message")\
                .eq("user_id", request.user_id)\
                .order("timestamp", desc=True)\
                .limit(10)\
                .execute()
            if response.data:
                # Reverse to keep chronological order
                history = list(reversed(response.data))
        except Exception as e:
            logger.error(f"Error fetching conversation history: {str(e)}")

    # 3. Call LangChain ConversationAgent
    ai_reply = conversation_agent.chat(
        user_message=request.message,
        history_list=history,
        language=request.language
    )

    # 4. Save the Assistant conversation message
    if supabase_client:
        try:
            supabase_client.table("conversations").insert({
                "user_id": request.user_id,
                "role": "assistant",
                "message": ai_reply,
                "language": request.language
            }).execute()
        except Exception as e:
            logger.error(f"Error saving assistant reply to database: {str(e)}")

    return ChatResponse(reply=ai_reply)


# 2. GET /api/v1/nudges/{user_id}
@app.get("/api/v1/nudges/{user_id}", response_model=NudgeListResponse)
def get_nudges(user_id: str):
    """
    Fetch pending (unread) nudges for the user from Supabase. Fallbacks to mock data if empty.
    """
    if supabase_client:
        try:
            response = supabase_client.table("nudges")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("is_read", False)\
                .order("sent_at", desc=True)\
                .execute()
            
            if response.data:
                nudges = []
                for item in response.data:
                    nudges.append(Nudge(
                        id=str(item.get("id")),
                        user_id=str(item.get("user_id")),
                        type=item.get("type"),
                        message=item.get("message"),
                        sent_at=str(item.get("sent_at")),
                        is_read=item.get("is_read"),
                        channel=item.get("channel")
                    ))
                return NudgeListResponse(nudges=nudges)
        except Exception as e:
            logger.error(f"Error fetching nudges: {str(e)}")
            
    # Mock fallback nudges
    mock_nudges = [
        Nudge(
            id="mock-1",
            user_id=user_id,
            type="budget_alert",
            message="You spent ₹8,000 on dining this month. Start a recurring deposit to save more!",
            sent_at=datetime.utcnow().isoformat(),
            is_read=False,
            channel="in-app"
        ),
        Nudge(
            id="mock-2",
            user_id=user_id,
            type="savings_tip",
            message="Your salary was credited. Park ₹5,000 in SBI FD for 7% returns.",
            sent_at=datetime.utcnow().isoformat(),
            is_read=False,
            channel="in-app"
        )
    ]
    return NudgeListResponse(nudges=mock_nudges)


# 3. POST /api/v1/nudges/generate/{user_id}
@app.post("/api/v1/nudges/generate/{user_id}", response_model=Nudge)
async def generate_nudge(user_id: str):
    """
    Analyzes transaction patterns using LangChain NudgeAgent,
    saves the generated nudge to the database, and returns it.
    """
    transactions = []
    
    # 1. Fetch transactions from Supabase
    if supabase_client:
        try:
            response = supabase_client.table("transactions")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("timestamp", desc=True)\
                .limit(10)\
                .execute()
            if response.data:
                transactions = response.data
        except Exception as e:
            logger.error(f"Error retrieving transactions: {str(e)}")
            
    # If no transactions exist, use typical mock transactions to analyze
    if not transactions:
        transactions = [
            {"amount": -2500, "category": "Dining", "merchant": "Zomato", "timestamp": "2026-06-24"},
            {"amount": -4000, "category": "Shopping", "merchant": "Amazon", "timestamp": "2026-06-23"},
            {"amount": -1200, "category": "Transport", "merchant": "Uber", "timestamp": "2026-06-22"},
            {"amount": 50000, "category": "Salary", "merchant": "SBI Corp Payroll", "timestamp": "2026-06-01"},
            {"amount": -3000, "category": "Dining", "merchant": "Starbucks", "timestamp": "2026-06-21"}
        ]
        
    # 2. Call LangChain NudgeAgent
    nudge_data = nudge_agent.generate_nudge(transactions)
    
    # 3. Save generated nudge to Supabase
    nudge_record = {
        "user_id": user_id,
        "type": nudge_data.get("type", "savings_tip"),
        "message": nudge_data.get("message", "Park your idle funds with SBI Smart Deposits."),
        "channel": "in-app",
        "is_read": False
    }
    
    inserted_id = "temp-nudge-id"
    if supabase_client:
        try:
            db_res = supabase_client.table("nudges").insert(nudge_record).execute()
            if db_res.data:
                inserted_id = db_res.data[0].get("id")
        except Exception as e:
            logger.error(f"Error saving generated nudge to DB: {str(e)}")
            
    return Nudge(
        id=inserted_id,
        user_id=user_id,
        type=nudge_record["type"],
        message=nudge_record["message"],
        sent_at=datetime.utcnow().isoformat(),
        is_read=False,
        channel=nudge_record["channel"]
    )


# 4. GET /api/v1/recommendations/{user_id}
@app.get("/api/v1/recommendations/{user_id}", response_model=RecommendationListResponse)
def get_recommendations(user_id: str):
    """
    Fetch existing bank recommendations for the user. Fallbacks to mock data if empty.
    """
    if supabase_client:
        try:
            response = supabase_client.table("recommendations")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("score", desc=True)\
                .execute()
            
            if response.data:
                recs = []
                for item in response.data:
                    recs.append(Recommendation(
                        id=str(item.get("id")),
                        user_id=str(item.get("user_id")),
                        product_type=item.get("product_type"),
                        reason=item.get("reason"),
                        score=float(item.get("score", 0.0)),
                        shown_at=str(item.get("shown_at"))
                    ))
                return RecommendationListResponse(recommendations=recs)
        except Exception as e:
            logger.error(f"Error fetching recommendations: {str(e)}")
            
    # Mock fallback recommendations
    mock_recs = [
        Recommendation(
            id="rec-1",
            user_id=user_id,
            product_type="SBI FD",
            reason="Based on your surplus cash balance of ₹45,230, investing in SBI Amrit Kalash FD yields a secure 7.1% p.a.",
            score=0.92,
            shown_at=datetime.utcnow().isoformat()
        ),
        Recommendation(
            id="rec-2",
            user_id=user_id,
            product_type="SBI Mutual Fund",
            reason="Your regular savings habits suggest you are ready to start a monthly SIP in SBI Bluechip Fund for long-term wealth growth.",
            score=0.85,
            shown_at=datetime.utcnow().isoformat()
        )
    ]
    return RecommendationListResponse(recommendations=mock_recs)


# 5. POST /api/v1/recommendations/generate/{user_id}
@app.post("/api/v1/recommendations/generate/{user_id}", response_model=RecommendationListResponse)
async def generate_recommendations(user_id: str):
    """
    Retrieves user financial profile, queries LangChain RecommendationAgent,
    stores recommendations in the database, and returns the top 3 recommendations.
    """
    financial_profile = {}
    
    # 1. Fetch user financial profile from Supabase
    if supabase_client:
        try:
            response = supabase_client.table("users")\
                .select("financial_profile")\
                .eq("id", user_id)\
                .single()\
                .execute()
            if response.data:
                financial_profile = response.data.get("financial_profile", {})
        except Exception as e:
            logger.error(f"Error retrieving user profile: {str(e)}")
            
    # Fallback profile for mockup/testing
    if not financial_profile:
        financial_profile = {
            "age": 28,
            "income": 75000,
            "savings": 120000,
            "existing_products": ["Savings Account"]
        }
        
    # 2. Call LangChain RecommendationAgent
    rec_data_list = recommendation_agent.get_recommendations(financial_profile)
        
    # 3. Store and format recommendations (Take top 3)
    final_recommendations = []
    
    for item in rec_data_list[:3]:
        # Adapt keys returned by LLM (product vs product_type, reason vs reason, benefit vs benefit)
        prod_name = item.get("product", "SBI Financial Product")
        reason_text = f"{item.get('reason', '')} Benefit: {item.get('benefit', '')}"
        
        rec_record = {
            "user_id": user_id,
            "product_type": prod_name,
            "reason": reason_text,
            "score": 0.90 # Defaults to 0.90 relevance score for agent selection
        }
        
        inserted_id = "temp-rec-id"
        if supabase_client:
            try:
                db_res = supabase_client.table("recommendations").insert(rec_record).execute()
                if db_res.data:
                    inserted_id = db_res.data[0].get("id")
            except Exception as e:
                logger.error(f"Error saving recommendation to database: {str(e)}")
                
        final_recommendations.append(Recommendation(
            id=inserted_id,
            user_id=user_id,
            product_type=rec_record["product_type"],
            reason=rec_record["reason"],
            score=rec_record["score"],
            shown_at=datetime.utcnow().isoformat()
        ))
        
    return RecommendationListResponse(recommendations=final_recommendations)

# Startup event to register demo user and seed mock transactions
@app.on_event("startup")
async def startup_event():
    if supabase_client:
        demo_user_id = "00000000-0000-0000-0000-000000000001"
        try:
            # 1. Seed demo user if not exists
            user_check = supabase_client.table("users").select("id").eq("id", demo_user_id).execute()
            if not user_check.data:
                logger.info(f"Seeding demo user {demo_user_id} in Supabase...")
                supabase_client.table("users").insert({
                    "id": demo_user_id,
                    "name": "Amit Kumar",
                    "phone": "+91 98765 43210",
                    "language_preference": "en",
                    "financial_profile": {
                        "age": 28,
                        "income": 80000,
                        "savings": 250000,
                        "existing_products": ["Savings Account"]
                    }
                }).execute()
                logger.info("Demo user successfully seeded.")
            
            # 2. Seed mock transactions if none exist for demo user
            tx_check = supabase_client.table("transactions").select("id").eq("user_id", demo_user_id).execute()
            if not tx_check.data:
                logger.info(f"Seeding mock transactions for {demo_user_id}...")
                mock_txs = [
                    {
                        "user_id": demo_user_id,
                        "amount": -1499.00,
                        "category": "Dining",
                        "merchant": "Zomato"
                    },
                    {
                        "user_id": demo_user_id,
                        "amount": -5000.00,
                        "category": "Investment",
                        "merchant": "SBI Mutual Fund"
                    },
                    {
                        "user_id": demo_user_id,
                        "amount": 75000.00,
                        "category": "Salary",
                        "merchant": "TechCorp Payroll"
                    },
                    {
                        "user_id": demo_user_id,
                        "amount": -4500.00,
                        "category": "Shopping",
                        "merchant": "Amazon India"
                    }
                ]
                supabase_client.table("transactions").insert(mock_txs).execute()
                logger.info("Mock transactions successfully seeded.")
        except Exception as e:
            logger.error(f"Error seeding data on startup: {str(e)}")

# -------------------------------------------------------------------------
# Execution (Local testing entrypoint)
# -------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    # Use port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
