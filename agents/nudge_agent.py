import os
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

logger = logging.getLogger("nudge_agent")

class NudgeOutput(BaseModel):
    message: str = Field(description="Proactive nudge message to display to the user, under 150 characters")
    type: str = Field(description="Category of the nudge: e.g., budget_alert, savings_tip, salary_credited, investment_advise")
    priority: int = Field(description="Priority score from 1 (lowest) to 5 (highest)")

class NudgeAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "")
        self.model_name = "google/gemini-2.5-flash"
        self.api_base = "https://openrouter.ai/api/v1"
        
        if not self.api_key:
            logger.warning("NudgeAgent: OPENROUTER_API_KEY is not set.")
            
        self.llm = ChatOpenAI(
            model=self.model_name,
            api_key=self.api_key,
            base_url=self.api_base,
            default_headers={
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "SAATHI"
            },
            temperature=0.2,
            max_tokens=1000
        )
        
        # Define Pydantic Output Parser
        self.parser = PydanticOutputParser(pydantic_object=NudgeOutput)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are SAATHI NudgeAgent, an intelligent analyzer of banking transaction patterns. "
                "Your task is to analyze the user's recent transactions and generate exactly one proactive nudge "
                "to help them manage their money better or optimize their savings.\n\n"
                "Examples of Nudges:\n"
                "- 'You spent ₹8,000 on dining this month. Start a recurring deposit to save more!'\n"
                "- 'Your salary was credited. Park ₹5,000 in SBI FD for 7% returns.'\n\n"
                "Format Instructions:\n{format_instructions}"
            )),
            ("human", "Analyze these transactions and output the nudge: {transactions}")
        ])
        
        self.chain = self.prompt | self.llm | self.parser

    def generate_nudge(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze transaction list and return a dict matching the NudgeOutput format.
        """
        if not self.api_key:
            return {
                "message": "Start a recurring deposit in SBI to automate your savings!",
                "type": "savings_tip",
                "priority": 3
            }
            
        try:
            formatted_txs = json.dumps(transactions)
            response = self.chain.invoke({
                "transactions": formatted_txs,
                "format_instructions": self.parser.get_format_instructions()
            })
            return response.model_dump()
        except Exception as e:
            logger.error(f"Error executing NudgeAgent: {str(e)}")
            # Fallback nudge on LLM error
            return {
                "message": "Keep track of your monthly spending. Start a smart SIP today!",
                "type": "savings_tip",
                "priority": 2
            }

if __name__ == "__main__":
    # Test locally
    agent = NudgeAgent()
    sample_txs = [
        {"amount": -2000, "category": "Dining", "merchant": "Zomato", "timestamp": "2026-06-24"},
        {"amount": -3000, "category": "Dining", "merchant": "Swiggy", "timestamp": "2026-06-23"},
        {"amount": 60000, "category": "Salary", "merchant": "TechCorp Payroll", "timestamp": "2026-06-01"}
    ]
    print(agent.generate_nudge(sample_txs))
