# SAATHI 🤝 (साथी)
### Agentic AI Financial Companion for SBI YONO Users

SAATHI is a premium agentic AI financial companion designed for SBI YONO users. It offers real-time financial chat queries, transaction-based nudging, and personalized SBI product recommendations (FDs, mutual funds, insurance, loans) tailored to the user's financial profile.

---

## 🏗️ Project Architecture & Layout

```
SAATHI-SBI Hackathon/
├── frontend/             # React.js + Vite + TypeScript Frontend
├── backend/              # FastAPI Python Web Server
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py            # Environment configuration
│   │   ├── main.py              # API routes & startup seeding logic
│   │   ├── openrouter_client.py # Client for OpenRouter Gemini API
│   │   └── supabase_client.py   # Client for Supabase
│   └── requirements.txt  # Python requirements
├── agents/               # LangChain Agent logic & Custom Tools
│   ├── conversation_agent.py    # Companion Chat agent
│   ├── nudge_agent.py           # Spending pattern analyzer agent
│   └── recommendation_agent.py  # Product recommendation agent
├── database/             # Supabase schema definitions (SQL)
│   └── schema.sql        # Database tables & RLS policies
├── .gitignore            # Blocks local environment secrets from Git
├── .env.example          # Template for project environment keys
└── README.md             # Setup and running instructions (this file)
```

---

## 🛠️ API Routes (Base URL: `/api/v1`)

1. **`POST /chat`**:
   - Sends a query to OpenRouter using `google/gemini-2.5-flash` with the SAATHI persona.
   - Logs conversations asynchronously inside the database.
   - Returns responses translated/written in the user's input language.

2. **`GET /nudges/{user_id}`**:
   - Fetches pending/unread nudges for the user from Supabase.

3. **`POST /nudges/generate/{user_id}`**:
   - Analyzes transactions and uses the OpenRouter Gemini API to generate personalized financial warnings/tips under 150 characters.
   - Saves generated nudges into the database.

4. **`GET /recommendations/{user_id}`**:
   - Returns personalized product recommendations from the database.

5. **`POST /recommendations/generate/{user_id}`**:
   - Analyzes the user's financial profile (income, saving goals, assets) and calls OpenRouter to match the user with appropriate SBI banking and investment products, outputting the top 3 suggestions.

---

## ⚙️ Setup and Installation Instructions

Follow these steps to run the SAATHI application locally:

### Step 1: Clone and Configure Environment
1. In the project root, copy `.env.example` to `.env`:
   ```bash
   # In Windows Command Prompt / PowerShell:
   copy .env.example .env
   ```
2. Populate the `.env` file with your credentials:
   - **`OPENROUTER_API_KEY`**: Obtain from https://openrouter.ai/ (free/paid keys available).
   - **`SUPABASE_URL`** & **`SUPABASE_ANON_KEY`**: Create a database project on https://supabase.com/ and fetch these from API Settings.

> [!WARNING]
> Do NOT commit your `.env` files to GitHub. The root `.gitignore` is configured to block these files automatically.

---

### Step 2: Supabase Database Setup
1. Open the SQL Editor in your Supabase Dashboard.
2. Open the file `database/schema.sql` from this repository.
3. Copy-paste the entire contents of `database/schema.sql` into the Supabase SQL editor and execute it. This will build:
   - Tables (`users`, `transactions`, `nudges`, `recommendations`, `conversations`).
   - Performance indexes.
   - Row Level Security (RLS) policies.

---

### Step 3: Run the FastAPI Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Windows:
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn pydantic pydantic-settings python-dotenv supabase langchain langchain-community langchain-openai httpx
   ```
4. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *Your backend API will be available at http://localhost:8000. Interactive Swagger documentation is at http://localhost:8000/docs.*

> [!NOTE]
> On startup, the backend automatically registers a demo user `00000000-0000-0000-0000-000000000001` in your Supabase `users` table and seeds mock transactions for spending analysis.

---

### Step 4: Run the React + Vite Frontend
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will boot at http://localhost:5173/.*
