import os
import logging
import json
from typing import List, Dict, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.tools import tool
from langchain_classic.agents import AgentExecutor, create_openai_tools_agent

logger = logging.getLogger("conversation_agent")

# Define tools
@tool
def get_user_balance(user_id: str) -> str:
    """Retrieves the user's current account balance and savings."""
    try:
        # Try fetching from Supabase first
        from backend.app.supabase_client import supabase_client
        if supabase_client:
            try:
                res = supabase_client.table("users").select("financial_profile").eq("id", user_id).single().execute()
                if res.data:
                    fp = res.data.get("financial_profile", {})
                    return f"Your savings balance is ₹{fp.get('savings', 0):,} (Monthly Income: ₹{fp.get('income', 0):,})."
            except Exception as e:
                logger.warning(f"Error fetching balance from Supabase: {e}")
                
        # Fallback to mock DB
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "app", "mock_db_store.json")
        if os.path.exists(db_path):
            with open(db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            user = data.get("users", {}).get(user_id, {})
            fp = user.get("financial_profile", {})
            if fp:
                return f"Your savings balance is ₹{fp.get('savings', 0):,} (Monthly Income: ₹{fp.get('income', 0):,})."
    except Exception as e:
        logger.error(f"Error in get_user_balance tool: {e}")
    
    return "Could not retrieve account balance. Please configure your profile first."

@tool
def get_user_transactions(user_id: str) -> str:
    """Retrieves the last 5 transactions simulated by the user in their ledger."""
    try:
        from backend.app.supabase_client import supabase_client
        txs = []
        if supabase_client:
            try:
                res = supabase_client.table("transactions").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(5).execute()
                if res.data:
                    txs = res.data
            except Exception as e:
                logger.warning(f"Error fetching txs from Supabase: {e}")
                
        if not txs:
            db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "app", "mock_db_store.json")
            if os.path.exists(db_path):
                with open(db_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                txs = data.get("transactions", {}).get(user_id, [])[:5]
                
        if not txs:
            return "No recent transactions found in your ledger. Go to the YONO Health Profile tab to simulate some spends."
            
        formatted = []
        for tx in txs:
            amt = tx.get("amount", 0)
            sign = "+" if amt > 0 else ""
            formatted.append(f"{tx.get('timestamp', '')[:10]} | {tx.get('merchant', 'Merchant')} | {sign}₹{amt:,} | [{tx.get('category', 'General')}]")
            
        return "Recent transactions:\n" + "\n".join(formatted)
    except Exception as e:
        logger.error(f"Error in get_user_transactions tool: {e}")
        return "Could not retrieve transaction logs."

@tool
def get_sbi_schemes_kb(query: str) -> str:
    """Searches details about SBI products, loan interest rates, deposit schemes, and safety tips."""
    query_lower = query.lower()
    if "loan" in query_lower:
        return (
            "SBI Personal Loan: Interest rates from 11.15% to 14.30% p.a.\n"
            "SBI Car Loan: Starts at 8.75% p.a.\n"
            "SBI Home Loan: Starts at 8.50% p.a. depending on credit score."
        )
    elif "scheme" in query_lower or "saving" in query_lower or "deposit" in query_lower or "fd" in query_lower:
        return (
            "SBI Amrit Kalash Deposit: 7.10% interest rate for 400 days (7.60% for senior citizens).\n"
            "SBI Sarvottam Term Deposit: Non-callable deposit offering premium interest rates (up to 7.4% p.a.).\n"
            "SBI Multi Option Deposit Scheme (MODS): Linked to savings account, automatically sweeps surplus funds into FDs."
        )
    else:
        return (
            "General SBI safety: Never share your MPIN, OTP, or passwords. "
            "Use YONO Safe to instantly freeze or unfreeze credit/debit cards."
        )

class ConversationAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "")
        self.model_name = "google/gemini-2.5-flash"
        self.api_base = "https://openrouter.ai/api/v1"
        
        if not self.api_key:
            logger.warning("ConversationAgent: OPENROUTER_API_KEY is not set.")
            
        self.llm = ChatOpenAI(
            model=self.model_name,
            api_key=self.api_key,
            base_url=self.api_base,
            default_headers={
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "SAATHI"
            },
            temperature=0.3,
            max_tokens=2048
        )
        
        self.tools = [get_user_balance, get_user_transactions, get_sbi_schemes_kb]
        
        # System prompt for agentic execution
        self.agent_prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are SAATHI, an intelligent, empathetic, and premium Agentic AI Financial Companion for SBI YONO users. "
                "Your goal is to help the user manage their money, explain complex banking terms simply, suggest savings options, "
                "and assist in navigating their SBI products.\n\n"
                "Guidelines:\n"
                "- ALWAYS use your tools (`get_user_balance` or `get_user_transactions`) to check the user's actual finances, balance, or transaction history when they ask about their money, what they spent on, how much they have, or their accounts.\n"
                "- Use the user_id provided in the input context.\n"
                "- Keep responses friendly, professional, clear, and highly focused on the Indian financial context (Rupees ₹).\n"
                "- Never hallucinate balance amounts or transactions. If you cannot find them, explicitly state so.\n"
                "- Be concise and direct. Keep your response brief (under 150 words) and structured. Avoid long essays. If listing items, keep them to 2-3 short bullet points.\n"
                "- You must respond in the user's preferred language: {language_name}."
            )),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}\n\n[User ID: {user_id}]"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Simple chain prompt fallback
        self.fallback_prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are SAATHI, SBI's AI financial companion. "
                "Help users with banking queries, suggest SBI products "
                "(FD, loans, insurance, credit cards), and give "
                "personalized financial advice. Be friendly, highly concise, "
                "and respond in the same language the user writes in. "
                "Keep responses brief, direct, and under 150 words. If listing items, keep them to 2-3 short bullet points. "
                "Always mention specific SBI products with benefits. "
                "Please respond in the user's preferred language: {language_name}."
            )),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])
        
        self.fallback_chain = self.fallback_prompt | self.llm | StrOutputParser()
        
        try:
            self.agent = create_openai_tools_agent(self.llm, self.tools, self.agent_prompt)
            self.agent_executor = AgentExecutor(agent=self.agent, tools=self.tools, verbose=True)
        except Exception as e:
            logger.error(f"Failed to create agent executor: {e}")
            self.agent_executor = None

    def chat(self, user_message: str, history_list: List[Dict[str, str]], language: str = "en", user_id: str = "") -> str:
        """
        Processes chat message, formats history, and returns the response string.
        """
        if not self.api_key:
            fallback_responses = {
                "en": "Hello! I am SAATHI, your SBI companion. How can I help you today?",
                "hi": "नमस्ते! मैं सारथी हूँ, आपका एसबीआई साथी। आज मैं आपकी क्या मदद कर सकता हूँ?",
                "ta": "வணக்கம்! நான் சாரதி, உங்கள் எஸ்பிஐ தோழன். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
                "bn": "নমস্কার! আমি সারথী, আপনার এসবিআই সঙ্গী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?"
            }
            return fallback_responses.get(language, fallback_responses["en"])
            
        lang_map = {
            "en": "English",
            "hi": "Hindi",
            "ta": "Tamil",
            "bn": "Bengali",
            "te": "Telugu",
            "mr": "Marathi",
            "gu": "Gujarati",
            "kn": "Kannada",
            "ml": "Malayalam",
            "pa": "Punjabi"
        }
        language_name = lang_map.get(language.lower(), "English")
        
        # Convert history to LangChain messages format
        langchain_history = []
        for msg in history_list:
            role = msg.get("role", "user")
            content = msg.get("message", "")
            if role == "user":
                langchain_history.append(HumanMessage(content=content))
            else:
                langchain_history.append(AIMessage(content=content))

        # Attempt to run agentic workflow if executor is initialized and we have a user_id
        if self.agent_executor and user_id:
            try:
                response = self.agent_executor.invoke({
                    "input": user_message,
                    "history": langchain_history,
                    "language_name": language_name,
                    "user_id": user_id
                })
                return response["output"].strip()
            except Exception as e:
                logger.warning(f"AgentExecutor failed: {e}. Falling back to simple chain.")
                
        # Fallback to simple chain
        try:
            response = self.fallback_chain.invoke({
                "input": user_message,
                "history": langchain_history,
                "language_name": language_name
            })
            return response.strip()
        except Exception as e:
            logger.error(f"Error executing fallback chain: {str(e)}")
            return "I'm experiencing difficulty responding. Let me check my connections."
