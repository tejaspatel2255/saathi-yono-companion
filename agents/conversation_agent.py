import os
import logging
from typing import List, Dict, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage, HumanMessage

logger = logging.getLogger("conversation_agent")

class ConversationAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "")
        self.model_name = "google/gemini-flash-1.5"
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
            max_tokens=1200
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are SAATHI, SBI's AI financial companion. "
                "Help users with banking queries, suggest SBI products "
                "(FD, loans, insurance, credit cards), and give "
                "personalized financial advice. Be friendly, concise, "
                "and respond in the same language the user writes in. "
                "Always mention specific SBI products with benefits. "
                "Please respond in the user's preferred language: {language_name}."
            )),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])
        
        self.chain = self.prompt | self.llm | StrOutputParser()

    def chat(self, user_message: str, history_list: List[Dict[str, str]], language: str = "en") -> str:
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
            
        try:
            # Convert history to LangChain messages format
            langchain_history = []
            for msg in history_list:
                role = msg.get("role", "user")
                content = msg.get("message", "")
                if role == "user":
                    langchain_history.append(HumanMessage(content=content))
                else:
                    langchain_history.append(AIMessage(content=content))
            
            lang_map = {
                "en": "English",
                "hi": "Hindi",
                "ta": "Tamil",
                "bn": "Bengali"
            }
            language_name = lang_map.get(language.lower(), "English")

            response = self.chain.invoke({
                "input": user_message,
                "history": langchain_history,
                "language_name": language_name
            })
            return response.strip()
        except Exception as e:
            logger.error(f"Error executing ConversationAgent: {str(e)}")
            return "I'm experiencing difficulty responding. Let me check my connections."

if __name__ == "__main__":
    # Test locally
    agent = ConversationAgent()
    history = [
        {"role": "user", "message": "Hi, who are you?"},
        {"role": "assistant", "message": "I am SAATHI, your financial companion."}
    ]
    print(agent.chat("What are the current FD rates?", history, "en"))
