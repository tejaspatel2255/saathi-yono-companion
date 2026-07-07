import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logger = logging.getLogger("saathi_supabase")

# Initialize client only if variables are provided
supabase_client: Client = None

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if SUPABASE_URL and SUPABASE_ANON_KEY:
    try:
        # Pre-test connection to Supabase to fail fast if offline/unreachable
        import httpx
        try:
            with httpx.Client(timeout=3.0) as client:
                client.head(SUPABASE_URL)
        except Exception as conn_err:
            logger.warning(f"Could not connect to Supabase host: {str(conn_err)}. Disabling Supabase client.")
            raise conn_err
            
        supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.warning(f"Supabase host unreachable or error initializing client: {str(e)}. Falling back to local mock database.")
        supabase_client = None
else:
    logger.warning("Supabase credentials missing. Supabase operations will fall back to mock data.")
