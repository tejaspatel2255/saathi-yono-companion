-- =========================================================================
-- SAATHI Database Schema for Supabase (PostgreSQL)
-- AI-Powered Financial Companion for SBI YONO
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    language_preference TEXT DEFAULT 'en' NOT NULL,
    financial_profile JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can select their own record" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);


-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL, -- Negative for debit/expense, Positive for credit/income
    category TEXT DEFAULT 'Uncategorized' NOT NULL,
    merchant TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Transactions Table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions" 
ON public.transactions FOR ALL 
USING (auth.uid() = user_id);


-- 4. Nudges Table (Proactive spending alerts and tips)
CREATE TABLE IF NOT EXISTS public.nudges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- e.g., 'budget_alert', 'savings_tip', 'fd_promo'
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    channel TEXT DEFAULT 'in-app' NOT NULL -- e.g., 'in-app', 'sms', 'whatsapp'
);

-- Enable RLS for Nudges Table
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Nudges
CREATE POLICY "Users can view their own nudges" 
ON public.nudges FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update read status of their own nudges" 
ON public.nudges FOR UPDATE 
USING (auth.uid() = user_id);


-- 5. Recommendations Table (Custom SBI financial product matching)
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    product_type TEXT NOT NULL, -- e.g., 'mutual_fund', 'fixed_deposit', 'health_insurance'
    reason TEXT NOT NULL,
    score NUMERIC(5, 4) NOT NULL, -- Recommender confidence score between 0.0000 and 1.0000
    shown_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Recommendations Table
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.recommendations FOR SELECT 
USING (auth.uid() = user_id);


-- 6. Conversations Table (Agent Session History)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    language TEXT DEFAULT 'en' NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Conversations Table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Conversations
CREATE POLICY "Users can view their own chat history" 
ON public.conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can write to their own chat history" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 7. Indexes for Query Performance Optimization
CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp ON public.transactions (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_nudges_user_read ON public.nudges (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_score ON public.recommendations (user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_timestamp ON public.conversations (user_id, timestamp ASC);
