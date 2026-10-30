# HRMind AI

An Agentic HR Policy and Grievance Management System.

## Architecture

* **Frontend**: React + Vite (Deployed on Netlify)
* **Backend**: FastAPI + LangGraph (Deployed on Render)
* **Database & Storage**: Supabase (PostgreSQL & Object Storage)
* **Vector Database**: Qdrant Cloud
* **LLM**: Groq (Llama-3 models)

## Environment Variables

Refer to ackend/.env.example for the required environment variables.

## Deployment Guide

### 1. Database & Storage (Supabase)
1. Create a new Supabase project.
2. In the SQL Editor, create the required tables or rely on SQLAlchemy's Base.metadata.create_all(bind=engine). (Alembic migrations recommended for production).
3. Under **Storage**, create a public bucket named policies.
4. Copy your Database Connection String (Session Pooler IPv4), SUPABASE_URL, and SUPABASE_KEY.

### 2. Vector Database (Qdrant Cloud)
1. Create a cluster on Qdrant Cloud.
2. Get the Cluster URL and API Key (if authenticated).
3. Set QDRANT_URL and QDRANT_COLLECTION (default: hr_policies).

### 3. LLM (Groq)
1. Generate an API Key from the Groq console.
2. Set GROQ_API_KEY.

### 4. Backend (Render)
1. Create a new Web Service on Render connected to this repository.
2. Set the Root Directory to ackend.
3. Build Command: pip install -r requirements.txt
4. Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
5. Add all environment variables listed in .env.example to the Render environment settings.

### 5. Frontend (Netlify)
1. Create a new Site on Netlify connected to this repository.
2. Set the Base Directory to rontend.
3. Build Command: 
pm run build
4. Publish Directory: rontend/dist
5. Set the VITE_API_URL environment variable to your Render backend URL (e.g., https://hrmind-api.onrender.com).
6. Update the backend's FRONTEND_URL environment variable to match the Netlify URL for CORS configuration.
