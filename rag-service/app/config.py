import os
from dotenv import load_dotenv

load_dotenv()

RAG_SERVICE_HOST = os.getenv("RAG_SERVICE_HOST", "0.0.0.0")
RAG_SERVICE_PORT = int(os.getenv("RAG_SERVICE_PORT", "8100"))
RAG_CHROMA_DIR = os.getenv("RAG_CHROMA_DIR", "./data/chroma")
RAG_GLOBAL_COLLECTION = os.getenv("RAG_GLOBAL_COLLECTION", "sleep_guidelines")
RAG_PATIENT_COLLECTION = os.getenv("RAG_PATIENT_COLLECTION", "patient_sleep_reports")
RAG_DEFAULT_TOP_K = int(os.getenv("RAG_DEFAULT_TOP_K", "5"))

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT_SECONDS", "20"))
