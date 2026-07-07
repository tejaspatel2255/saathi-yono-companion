# SAATHI 🤝 (साथी)
### Premium Agentic AI Financial Companion for SBI YONO

SAATHI is a state-of-the-art Agentic AI financial companion designed to elevate the digital banking experience for SBI YONO users. Built using FastAPI (Python), LangChain, OpenRouter (Gemini 2.5 Flash), and React (TypeScript), SAATHI provides real-time multi-lingual financial chat, native speech synthesis, voice transcription input, proactive budget nudges, and personalized SBI product recommendations.

---

## ✨ Core Sandbox & AI Agent Features

1. **Fully Agentic Tool-Calling Chat (`agents/conversation_agent.py`)** [**NEW**] 🧠:
   - Upgraded the chat assistant from a simple LLM text-responder to a dynamic LangChain `AgentExecutor`.
   - Equipped the agent with custom tools:
     * **`get_user_balance`**: Dynamically reads the user's real balance from the active profile (works with both Supabase and the mock DB fallback).
     * **`get_user_transactions`**: Accesses the user's real ledger transactions in real-time.
     * **`get_sbi_schemes_kb`**: Answers SBI interest rate policies, loan criteria, FD schemes (like Amrit Kalash), and safety protocols.
   - The agent automatically determines when to query user data to answer financial questions accurately without hallucinating.

2. **Multilingual Speech Synthesis (TTS) Voice Companion (`frontend/src/pages/Chat.tsx`)** [**NEW**] 🔊:
   - Adds a speaker icon to assistant message bubbles.
   - Leverages browser-native `SpeechSynthesis` to read responses aloud.
   - Automatically maps selected language code to local Indian locales (`hi-IN` for Hindi, `ta-IN` for Tamil, `gu-IN` for Gujarati, `en-IN` for English, etc.) for authentic local accents.
   - Clean synthesis control stops speaking on toggle clicks and automatically strips markdown characters.

3. **Multilingual Speech-to-Text (STT) Input (`frontend/src/pages/Chat.tsx`)** [**NEW**] 🎙️:
   - Adds a microphone icon to the chat input bar.
   - Allows users to speak their questions instead of typing, transcribing them directly in their selected language.
   - Runs 100% locally in compatible browsers (Chrome, Edge) with zero API charges.

4. **Onboarding & Session Management**:
   - Premium onboarding portal requesting basic demographics (Name, Mobile, Age, Income, Savings, Existing Accounts) and preferred language.
   - Interactive initials avatar dropdown menu displays registered user profile details and supports full session logout (`localStorage` session cleanup and login redirection).
   - **Try Demo Mode**: Instantly access a pre-configured sandbox session (Rahul Sharma, English, income 50K-1L) without entering details manually.

5. **Agent Ignition**:
   - Upon first registration, SAATHI immediately triggers the `RecommendationAgent` and `NudgeAgent` to analyze input demographics, pre-generating customized SBI offers and insights.

6. **Live Spend Simulation Sandbox**:
   - In the **Health Profile** tab, users can post simulated debit/credit transactions (e.g., ₹9,000 spend at Zomato under Dining).
   - The backend automatically re-runs the `NudgeAgent` on the updated ledger list, instantly regenerating the dashboard's AI Money Nudges.

7. **Dynamic Dashboard Summaries**:
   - High-fidelity summary cards displaying Monthly Income and Total Savings values directly from the user's active profile, giving real-time feedback as demographic configurations are updated.

8. **Dual Database Persistence Layer**:
   - Writes to Supabase cloud database automatically if configured.
   - Fallbacks to a local file database (`backend/app/mock_db_store.json`) when Supabase is unconfigured or blocked by security policies, securing sandbox data across backend reloads.

---

## 🏗️ Project Architecture & Layout

```
SAATHI-SBI Hackathon/
├── frontend/             # React.js + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/   # Layout headers, navigation bar, charts
│   │   ├── pages/        # Dashboard, Chat (TTS & STT Voice), Recommendations, Profile (Sandbox)
│   │   └── index.css     # Styling & premium glassmorphism theme
├── backend/              # FastAPI Python Web Server
│   ├── app/
│   │   ├── config.py            # Environment settings (Dotenv)
│   │   ├── main.py              # API routes, mock DB load/save, and startup seeding
│   │   ├── openrouter_client.py # Client for OpenRouter Gemini API
│   │   ├── supabase_client.py   # Client for Supabase
│   │   └── mock_db_store.json   # Local persistent file database backup (Git ignored)
│   └── requirements.txt  # Python requirements
├── agents/               # LangChain Agent logic & Custom Tools
│   ├── conversation_agent.py    # Tool-calling Chat agent
│   ├── nudge_agent.py           # Spending pattern analyzer agent
│   └── recommendation_agent.py  # Product recommendation agent
├── database/             # Supabase schema definitions (SQL)
│   └── schema.sql        # Database tables & RLS policies
└── README.md             # Project documentation (this file)
```

---

## 🛠️ API Routes (Base URL: `/api/v1`)

1. **`POST /users/register`**: Registers a new user, seeds transactions, triggers **Agent Ignition**, and returns the profile.
2. **`POST /users/login`**: Authenticates the user based on normalized phone matching.
3. **`POST /chat`**: Connects with LangChain Tool Agent to respond to user messages in their preferred language.
4. **`GET /nudges/{user_id}`**: Fetches pending nudges. Fallbacks to dynamic agent generation if empty.
5. **`POST /transactions/{user_id}`**: Simulates a transaction and triggers `NudgeAgent` budget analysis in real time.
6. **`GET /recommendations/{user_id}`**: Fetches product recommendations. Fallbacks to dynamic agent matches if empty.

---

## ⚙️ Setup and Installation Instructions

Follow these steps to run the SAATHI application locally:

### Step 1: Clone and Configure Environment
1. In the project root, copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
2. Populate the `.env` file with your credentials:
   - **`OPENROUTER_API_KEY`**: Obtain from https://openrouter.ai/ (Gemini-2.5-Flash backend).
   - **`SUPABASE_URL`** & **`SUPABASE_ANON_KEY`**: Get these credentials from your Supabase Project Settings.

---

### Step 2: Database RLS Configuration (Supabase)
By default, the table schema in `database/schema.sql` enables Row-Level Security (RLS). Since SAATHI bypasses Supabase Auth to enable quick sandbox registrations:
1. Go to your **Supabase Dashboard**.
2. Open the **SQL Editor** tab.
3. Click **New Query** and run the following commands to allow anonymous API writes:
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.nudges DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.recommendations DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
   ```
   *(If RLS is not disabled, SAATHI will automatically fall back to the local `mock_db_store.json` database backup so that data still persists locally.)*

---

### Step 3: Run the FastAPI Backend
1. Navigate to the backend directory:
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
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
   ```

---

### Step 4: Run the React + Vite Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will start at http://localhost:5173/.*
