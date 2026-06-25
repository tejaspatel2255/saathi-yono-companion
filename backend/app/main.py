import os
import re
import json
import logging
import sys
import uuid
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

class UserRegisterRequest(BaseModel):
    name: str
    phone: str
    language_preference: str = "en"
    age: int
    income: float
    savings: float
    existing_products: List[str] = []

class TransactionCreateRequest(BaseModel):
    amount: float
    category: str
    merchant: str

class UserProfileResponse(BaseModel):
    id: str
    name: str
    phone: str
    language_preference: str
    financial_profile: Dict[str, Any]

class UserLoginRequest(BaseModel):
    phone: str

# In-memory sandboxed fallback cache for simulator runs
mock_users_db: Dict[str, Any] = {}
mock_transactions_db: Dict[str, List[Dict[str, Any]]] = {}
mock_nudges_db: Dict[str, List[Dict[str, Any]]] = {}
mock_recs_db: Dict[str, List[Dict[str, Any]]] = {}

MOCK_DB_FILE = os.path.join(os.path.dirname(__file__), "mock_db_store.json")

def load_mock_db():
    global mock_users_db, mock_transactions_db, mock_nudges_db, mock_recs_db
    if os.path.exists(MOCK_DB_FILE):
        try:
            with open(MOCK_DB_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                mock_users_db = data.get("users", {})
                mock_transactions_db = data.get("transactions", {})
                mock_nudges_db = data.get("nudges", {})
                mock_recs_db = data.get("recommendations", {})
                logger.info("Successfully loaded local persistent mock database.")
        except Exception as e:
            logger.error(f"Error loading mock database file: {str(e)}")

def save_mock_db():
    try:
        with open(MOCK_DB_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "users": mock_users_db,
                "transactions": mock_transactions_db,
                "nudges": mock_nudges_db,
                "recommendations": mock_recs_db
            }, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error saving mock database file: {str(e)}")

# Load persistent mock data immediately on startup/reload
load_mock_db()

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

# User Registration & Sandbox Endpoints
@app.post("/api/v1/users/register", response_model=UserProfileResponse)
async def register_user(request: UserRegisterRequest):
    user_id = str(uuid.uuid4())
    user_record = {
        "id": user_id,
        "name": request.name,
        "phone": request.phone,
        "language_preference": request.language_preference,
        "financial_profile": {
            "age": request.age,
            "income": request.income,
            "savings": request.savings,
            "existing_products": request.existing_products
        }
    }
    
    if supabase_client:
        try:
            supabase_client.table("users").insert(user_record).execute()
        except Exception as e:
            logger.error(f"Error registering user in Supabase: {str(e)}")
            
    mock_users_db[user_id] = user_record
    
    mock_transactions_db[user_id] = []
    
    # AGENT IGNITION: Pre-generate custom nudges & recommendations immediately
    # 1. Pre-generate recommendations
    try:
        rec_data_list = recommendation_agent.get_recommendations(user_record["financial_profile"])
        recs = []
        for i, rec in enumerate(rec_data_list[:3]):
            rec_record = {
                "user_id": user_id,
                "product_type": rec.get("product_type", "SBI Product"),
                "reason": rec.get("reason", "Highly suitable for your profile."),
                "score": float(rec.get("score", 0.85))
            }
            if supabase_client:
                try:
                    db_res = supabase_client.table("recommendations").insert(rec_record).execute()
                    if db_res.data:
                        rec_record["id"] = db_res.data[0].get("id")
                except Exception as e:
                    logger.error(f"Error saving recommendation to Supabase: {str(e)}")
            if "id" not in rec_record:
                rec_record["id"] = f"gen-rec-{i}"
            rec_record["shown_at"] = datetime.utcnow().isoformat()
            recs.append(rec_record)
        mock_recs_db[user_id] = recs
    except Exception as e:
        logger.error(f"Error pre-generating recommendations: {str(e)}")

    # 2. Pre-generate nudge
    try:
        nudge_data = nudge_agent.generate_nudge([])
        nudge_record = {
            "user_id": user_id,
            "type": nudge_data.get("type", "savings_tip"),
            "message": nudge_data.get("message", "Welcome to SAATHI! Start tracking your savings today."),
            "channel": "in-app",
            "is_read": False
        }
        if supabase_client:
            try:
                db_res = supabase_client.table("nudges").insert(nudge_record).execute()
                if db_res.data:
                    nudge_record["id"] = db_res.data[0].get("id")
            except Exception as e:
                logger.error(f"Error saving nudge to Supabase: {str(e)}")
        if "id" not in nudge_record:
            nudge_record["id"] = "gen-nudge-1"
        nudge_record["sent_at"] = datetime.utcnow().isoformat()
        mock_nudges_db[user_id] = [nudge_record]
    except Exception as e:
        logger.error(f"Error pre-generating nudges: {str(e)}")
    
    # Persist mock database to JSON file
    save_mock_db()
    
    return UserProfileResponse(
        id=user_id,
        name=request.name,
        phone=request.phone,
        language_preference=request.language_preference,
        financial_profile=user_record["financial_profile"]
    )

def normalize_phone(phone: str) -> str:
    # Remove all non-digit characters
    digits = re.sub(r"\D", "", phone)
    # If it is a 12-digit number starting with 91, strip it to get the 10-digit number
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    return digits

@app.post("/api/v1/users/login", response_model=UserProfileResponse)
async def login_user(request: UserLoginRequest):
    req_phone_norm = normalize_phone(request.phone)
    
    # 1. Search in Supabase
    if supabase_client:
        try:
            res = supabase_client.table("users").select("*").execute()
            if res.data:
                for item in res.data:
                    if normalize_phone(item.get("phone", "")) == req_phone_norm:
                        return UserProfileResponse(
                            id=str(item.get("id")),
                            name=item.get("name"),
                            phone=item.get("phone"),
                            language_preference=item.get("language_preference", "en"),
                            financial_profile=item.get("financial_profile", {})
                        )
        except Exception as e:
            logger.error(f"Error checking user login in Supabase: {str(e)}")
            
    # 2. Search in local mock cache
    for uid, u in mock_users_db.items():
        if normalize_phone(u["phone"]) == req_phone_norm:
            return UserProfileResponse(
                id=u["id"],
                name=u["name"],
                phone=u["phone"],
                language_preference=u["language_preference"],
                financial_profile=u["financial_profile"]
            )
            
    # Fallback checks (e.g. Amit Kumar)
    if req_phone_norm == "9876543210":
        return UserProfileResponse(
            id="00000000-0000-0000-0000-000000000001",
            name="Amit Kumar",
            phone="+91 98765 43210",
            language_preference="en",
            financial_profile={
                "age": 28,
                "income": 80000,
                "savings": 250000,
                "existing_products": ["Savings Account"]
            }
        )
        
    raise HTTPException(status_code=404, detail="No registered companion profile found with this mobile number. Please onboarding first.")

@app.get("/api/v1/profile/{user_id}", response_model=UserProfileResponse)
def get_profile(user_id: str):
    if supabase_client:
        try:
            res = supabase_client.table("users").select("*").eq("id", user_id).execute()
            if res.data:
                item = res.data[0]
                return UserProfileResponse(
                    id=str(item.get("id")),
                    name=item.get("name"),
                    phone=item.get("phone"),
                    language_preference=item.get("language_preference", "en"),
                    financial_profile=item.get("financial_profile", {})
                )
        except Exception as e:
            logger.error(f"Error fetching profile from Supabase: {str(e)}")
            
    if user_id in mock_users_db:
        u = mock_users_db[user_id]
        return UserProfileResponse(
            id=u["id"],
            name=u["name"],
            phone=u["phone"],
            language_preference=u["language_preference"],
            financial_profile=u["financial_profile"]
        )
        
    return UserProfileResponse(
        id=user_id,
        name="Amit Kumar",
        phone="+91 98765 43210",
        language_preference="en",
        financial_profile={
            "age": 28,
            "income": 80000,
            "savings": 250000,
            "existing_products": ["Savings Account"]
        }
    )

@app.put("/api/v1/profile/{user_id}", response_model=UserProfileResponse)
def update_profile(user_id: str, request: UserRegisterRequest):
    update_data = {
        "name": request.name,
        "phone": request.phone,
        "language_preference": request.language_preference,
        "financial_profile": {
            "age": request.age,
            "income": request.income,
            "savings": request.savings,
            "existing_products": request.existing_products
        }
    }
    
    if supabase_client:
        try:
            supabase_client.table("users").update(update_data).eq("id", user_id).execute()
        except Exception as e:
            logger.error(f"Error updating profile in Supabase: {str(e)}")
            
    update_data["id"] = user_id
    mock_users_db[user_id] = update_data
    save_mock_db()
    
    return UserProfileResponse(
        id=user_id,
        name=request.name,
        phone=request.phone,
        language_preference=request.language_preference,
        financial_profile=update_data["financial_profile"]
    )

@app.post("/api/v1/transactions/{user_id}")
async def create_transaction(user_id: str, request: TransactionCreateRequest):
    tx_record = {
        "user_id": user_id,
        "amount": request.amount,
        "category": request.category,
        "merchant": request.merchant
    }
    
    inserted_tx = {**tx_record, "timestamp": datetime.utcnow().isoformat(), "id": str(uuid.uuid4()) if 'uuid' in sys.modules else "tx-temp"}
    
    if supabase_client:
        try:
            db_res = supabase_client.table("transactions").insert(tx_record).execute()
            if db_res.data:
                inserted_tx = db_res.data[0]
        except Exception as e:
            logger.error(f"Error inserting transaction in Supabase: {str(e)}")
            
    if user_id not in mock_transactions_db:
        mock_transactions_db[user_id] = []
    mock_transactions_db[user_id].insert(0, inserted_tx)
    
    # Automatically trigger nudge regeneration based on the updated transactions list
    try:
        # Fetch updated list of transactions
        all_txs = mock_transactions_db[user_id]
        if supabase_client:
            try:
                db_res = supabase_client.table("transactions").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(10).execute()
                if db_res.data:
                    all_txs = db_res.data
            except Exception as e:
                logger.error(f"Error fetching latest transactions: {str(e)}")
        
        # Call NudgeAgent to analyze updated ledger
        nudge_data = nudge_agent.generate_nudge(all_txs)
        nudge_record = {
            "user_id": user_id,
            "type": nudge_data.get("type", "savings_tip"),
            "message": nudge_data.get("message", "Keep monitoring your spends with SAATHI."),
            "channel": "in-app",
            "is_read": False
        }
        if supabase_client:
            try:
                supabase_client.table("nudges").insert(nudge_record).execute()
            except Exception as e:
                logger.error(f"Error saving updated nudge: {str(e)}")
        
        # Save to mock nudges database
        nudge_record["sent_at"] = datetime.utcnow().isoformat()
        mock_nudges_db[user_id] = [nudge_record]
    except Exception as e:
        logger.error(f"Error auto-updating nudge after transaction: {str(e)}")
        
    save_mock_db()
    return {"status": "success", "transaction": inserted_tx}

@app.get("/api/v1/transactions/{user_id}")
def get_transactions(user_id: str):
    transactions = []
    if supabase_client:
        try:
            response = supabase_client.table("transactions")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("timestamp", desc=True)\
                .execute()
            if response.data:
                transactions = response.data
        except Exception as e:
            logger.error(f"Error fetching transactions: {str(e)}")
            
    if not transactions and user_id in mock_transactions_db:
        transactions = mock_transactions_db[user_id]
        
    return {"transactions": transactions}

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
            
    # Return pre-generated nudges if present in mock cache
    if user_id in mock_nudges_db:
        return NudgeListResponse(nudges=[
            Nudge(
                id=n.get("id"),
                user_id=n.get("user_id"),
                type=n.get("type"),
                message=n.get("message"),
                sent_at=n.get("sent_at", datetime.utcnow().isoformat()),
                is_read=n.get("is_read", False),
                channel=n.get("channel", "in-app")
            )
            for n in mock_nudges_db[user_id]
        ])

    # Dynamic Agent Ignition Fallback: Generate real-time budget nudge using NudgeAgent
    try:
        # Retrieve ledger
        txs = []
        if supabase_client:
            try:
                db_res = supabase_client.table("transactions").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(10).execute()
                if db_res.data:
                    txs = db_res.data
            except Exception:
                pass
        if not txs:
            txs = mock_transactions_db.get(user_id, [])
        if not txs:
            txs = [
                {"amount": 75000.0, "category": "Salary", "merchant": "SBI Corp Payroll"},
                {"amount": -1499.0, "category": "Dining", "merchant": "Zomato"},
                {"amount": -4500.0, "category": "Shopping", "merchant": "Amazon India"}
            ]
        
        nudge_data = nudge_agent.generate_nudge(txs)
        nudge_record = {
            "id": "gen-nudge-1",
            "user_id": user_id,
            "type": nudge_data.get("type", "savings_tip"),
            "message": nudge_data.get("message", "Keep monitoring your spends with SAATHI."),
            "sent_at": datetime.utcnow().isoformat(),
            "is_read": False,
            "channel": "in-app"
        }
        mock_nudges_db[user_id] = [nudge_record]
        save_mock_db()
        return NudgeListResponse(nudges=[Nudge(**nudge_record)])
    except Exception as e:
        logger.error(f"Error auto-generating fallback nudge: {str(e)}")

    # Hardcoded safety fallback nudges
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
        if user_id in mock_transactions_db:
            transactions = mock_transactions_db[user_id]
        else:
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
            
    nudge_record["id"] = inserted_id
    nudge_record["sent_at"] = datetime.utcnow().isoformat()
    mock_nudges_db[user_id] = [nudge_record]
    save_mock_db()

    return Nudge(
        id=inserted_id,
        user_id=user_id,
        type=nudge_record["type"],
        message=nudge_record["message"],
        sent_at=nudge_record["sent_at"],
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
            
    # Return pre-generated recommendations if present in mock cache
    if user_id in mock_recs_db:
        return RecommendationListResponse(recommendations=[
            Recommendation(
                id=r.get("id"),
                user_id=r.get("user_id"),
                product_type=r.get("product_type"),
                reason=r.get("reason"),
                score=float(r.get("score", 0.85)),
                shown_at=r.get("shown_at", datetime.utcnow().isoformat())
            )
            for r in mock_recs_db[user_id]
        ])

    # Dynamic Agent Ignition Fallback: Generate real-time recommendations using RecommendationAgent
    try:
        # Retrieve financial profile
        fp = {}
        if supabase_client:
            try:
                db_res = supabase_client.table("users").select("financial_profile").eq("id", user_id).single().execute()
                if db_res.data:
                    fp = db_res.data.get("financial_profile", {})
            except Exception:
                pass
        if not fp:
            u = mock_users_db.get(user_id, {})
            fp = u.get("financial_profile", {})
        if not fp:
            fp = {
                "age": 28,
                "income": 80000,
                "savings": 250000,
                "existing_products": ["Savings Account"]
            }
        
        rec_data_list = recommendation_agent.get_recommendations(fp)
        recs = []
        for i, rec in enumerate(rec_data_list[:3]):
            rec_record = {
                "id": f"gen-rec-{i}",
                "user_id": user_id,
                "product_type": rec.get("product_type", "SBI Product"),
                "reason": rec.get("reason", "Highly suitable for your profile."),
                "score": float(rec.get("score", 0.85)),
                "shown_at": datetime.utcnow().isoformat()
            }
            recs.append(rec_record)
        mock_recs_db[user_id] = recs
        save_mock_db()
        return RecommendationListResponse(recommendations=[Recommendation(**r) for r in recs])
    except Exception as e:
        logger.error(f"Error auto-generating fallback recommendations: {str(e)}")

    # Hardcoded safety fallback recommendations
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
        if user_id in mock_users_db:
            financial_profile = mock_users_db[user_id].get("financial_profile", {})
        else:
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
                
    # Save to mock cache and file database
    mock_recs_db[user_id] = [
        {
            "id": r.id,
            "user_id": r.user_id,
            "product_type": r.product_type,
            "reason": r.reason,
            "score": r.score,
            "shown_at": r.shown_at
        }
        for r in final_recommendations
    ]
    save_mock_db()
        
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
