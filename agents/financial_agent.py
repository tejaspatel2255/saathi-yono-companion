import os
import sys
from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain_classic.agents import AgentExecutor, create_openai_tools_agent

# Fix Windows console encoding issues for emojis/Rupee symbol
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
        sys.stderr.reconfigure(encoding='utf-8', errors='backslashreplace')
    except Exception:
        pass

# Local config import - since backend is running it can import or we can retrieve from env
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# 1. Initialize OpenRouter LLM
def get_llm():
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not set. Please check your environment variables.")
    
    return ChatOpenAI(
        model="google/gemini-2.5-flash",
        openai_api_key=OPENROUTER_API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "SAATHI"
        },
        temperature=0.3,
        max_tokens=1500
    )

# 2. Define Financial Tools
@tool
def get_account_balances(account_id: str = "primary") -> str:
    """Retrieves current balances for all linked SBI accounts including savings, current, and deposits."""
    # Mocking SBI YONO integration. In production, this would call SBI API or read from Supabase.
    return (
        "Here are your linked SBI account balances:\n"
        "- Savings Account (xxxx1234): ₹45,230.50\n"
        "- Fixed Deposit (xxxx8901): ₹1,50,000.00\n"
        "- YONO Smart Wallet: ₹2,500.00"
    )

@tool
def get_recent_transactions(limit: int = 5) -> str:
    """Retrieves recent transaction logs for analysis, including descriptions, categories, and amounts."""
    # Mock transaction data for YONO users
    transactions = [
        {"date": "2026-06-24", "desc": "AMAZON INDIA", "amount": -1499.00, "category": "Shopping"},
        {"date": "2026-06-23", "desc": "SBI DIRECT DEBIT - SIP", "amount": -5000.00, "category": "Investment"},
        {"date": "2026-06-22", "desc": "INTEREST CREDIT", "amount": 450.00, "category": "Income"},
        {"date": "2026-06-20", "desc": "ZOMATO ONLINE", "amount": -650.00, "category": "Dining"},
        {"date": "2026-06-18", "desc": "CREDIT INTEREST SBI", "amount": 120.00, "category": "Income"}
    ]
    
    formatted_txs = []
    for tx in transactions[:limit]:
        formatted_txs.append(f"{tx['date']} | {tx['desc']} | {'+' if tx['amount'] > 0 else ''}₹{tx['amount']} | [{tx['category']}]")
    
    return "\n".join(formatted_txs)

@tool
def search_financial_kb(query: str) -> str:
    """Searches the ChromaDB Vector database for SBI schemes, policies, loan interest rates, and investment guidelines."""
    # Vector DB mock search result
    query_lower = query.lower()
    if "loan" in query_lower:
        return "SBI Personal Loan interest rates range from 11.15% to 14.30% p.a. SBI Car Loan starts at 8.75% p.a. for selected models. Source: SBI Official Portal (June 2026)."
    elif "scheme" in query_lower or "saving" in query_lower or "deposit" in query_lower:
        return "SBI Amrit Kalash Deposit Scheme offers 7.10% interest for 400 days. Senior citizens get an extra 0.50% (7.60%). Source: SBI Circular (June 2026)."
    else:
        return "General SBI YONO guideline: Ensure you never share your MPIN, OTP, or passwords with anyone. Use YONO Safe features to block/unblock cards instantly."

# Assemble Tools List
tools = [get_account_balances, get_recent_transactions, search_financial_kb]

# 3. Create the Financial Companion Agent
def create_saathi_agent():
    llm = get_llm()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are SAATHI, an intelligent, empathetic, and premium Agentic AI Financial Companion for SBI YONO users. "
            "Your goal is to help users manage their money, explain complex banking terms simply, suggest savings options, "
            "and assist in navigating their SBI products.\n\n"
            "Guidelines:\n"
            "- Always use tools to fetch accurate real-time information regarding balances, transactions, and SBI policies.\n"
            "- Be proactive: if a user spent heavily on dining, suggest budget control.\n"
            "- Keep responses friendly, professional, clear, and highly focused on the Indian financial context (Rupees ₹).\n"
            "- Never hallucinate balance amounts. If no info is available, explicitly state so."
        )),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    # Create OpenRouter/OpenAI-compatible Agent
    agent = create_openai_tools_agent(llm, tools, prompt)
    
    # Return Agent Executor
    return AgentExecutor(agent=agent, tools=tools, verbose=True)

if __name__ == "__main__":
    # Test block
    print("Initializing SAATHI Agent...")
    try:
        agent_executor = create_saathi_agent()
        response = agent_executor.invoke({
            "input": "What is my savings balance, and can you check if there are any good SBI savings schemes right now?",
            "chat_history": []
        })
        print("\nAgent Response:")
        print(response["output"])
    except Exception as e:
        print(f"Error initializing or running agent: {e}")
        print("Note: Ensure you have set the OPENROUTER_API_KEY environment variable.")
