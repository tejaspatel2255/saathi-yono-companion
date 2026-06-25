import os
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

logger = logging.getLogger("recommendation_agent")

class ProductRecommendation(BaseModel):
    product: str = Field(description="Name of the SBI bank/investment product")
    reason: str = Field(description="Why this product matches the user's financial situation and demographic")
    benefit: str = Field(description="Key benefit (e.g. '7.1% interest', '₹5 Lakh tax-free coverage')")
    cta: str = Field(description="A brief action button text, e.g., 'Open FD on YONO', 'Calculate Loan EMI', 'Start SIP'")

class RecommendationList(BaseModel):
    recommendations: List[ProductRecommendation] = Field(description="Top 3 recommended products")

class RecommendationAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "")
        self.model_name = "google/gemini-flash-1.5"
        self.api_base = "https://openrouter.ai/api/v1"
        
        if not self.api_key:
            logger.warning("RecommendationAgent: OPENROUTER_API_KEY is not set.")
            
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
        
        self.parser = PydanticOutputParser(pydantic_object=RecommendationList)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are SAATHI RecommendationAgent, a financial product advisor specializing in State Bank of India products.\n"
                "Your objective is to analyze the user's financial profile and suggest the top 3 most relevant products "
                "from this catalogue:\n"
                "1. SBI FD (Fixed Deposit) - secure, guaranteed returns\n"
                "2. SBI Personal Loan - liquid credit for personal needs\n"
                "3. SBI Life Insurance - financial security for family\n"
                "4. SBI Credit Card - reward points, dining/shopping perks\n"
                "5. SBI Mutual Fund - long-term equity/debt investment\n\n"
                "Format Instructions:\n{format_instructions}"
            )),
            ("human", "Recommend products for this financial profile: {profile}")
        ])
        
        self.chain = self.prompt | self.llm | self.parser

    def get_recommendations(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze user profile and return a list of recommended products.
        """
        if not self.api_key:
            # Fallback recommendations if no api key
            return [
                {
                    "product": "SBI FD (Fixed Deposit)",
                    "reason": "Since you have idle funds in savings, moving them into an FD ensures better returns.",
                    "benefit": "7.10% guaranteed interest p.a.",
                    "cta": "Open FD on YONO"
                },
                {
                    "product": "SBI Mutual Fund",
                    "reason": "Your risk tolerance is moderate, making a diversified equity mutual fund a suitable pick.",
                    "benefit": "Wealth growth via compounding",
                    "cta": "Start SIP"
                },
                {
                    "product": "SBI Credit Card",
                    "reason": "Good match to earn rewards on your shopping and dining transactions.",
                    "benefit": "5% cashback on online spends",
                    "cta": "Apply Now"
                }
            ]
            
        try:
            formatted_profile = json.dumps(profile)
            response = self.chain.invoke({
                "profile": formatted_profile,
                "format_instructions": self.parser.get_format_instructions()
            })
            return [rec.model_dump() for rec in response.recommendations]
        except Exception as e:
            logger.error(f"Error executing RecommendationAgent: {str(e)}")
            return [
                {
                    "product": "SBI FD (Fixed Deposit)",
                    "reason": "Secure asset growth with guaranteed returns.",
                    "benefit": "7.10% interest rate",
                    "cta": "Open FD"
                }
            ]

if __name__ == "__main__":
    # Test locally
    agent = RecommendationAgent()
    sample_profile = {
        "age": 28,
        "income": 80000,
        "savings": 250000,
        "existing_products": ["Savings Account"]
    }
    print(agent.get_recommendations(sample_profile))
