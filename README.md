# 🦉 LittleLingo — English Learning Chatbot for Kids Under 7

A working Django REST Framework + Next.js hybrid chatbot MVP with 3 learning levels, mastery tracking, mode detection, SEL support, optional Groq LLM and browser speech synthesis. **No paid AI API required.**

## Quick start (Windows / macOS / Linux)

### Backend (Python 3.11+)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend health: http://localhost:8000/api/health/

### Frontend (Node 20+)
```bash
cd frontend
npm install
cp .env.example .env.local  # Windows: copy .env.example .env.local
npm run dev
```
Open http://localhost:3000

### Optional Groq LLM
Set `ENABLE_LLM=true` and `GROQ_API_KEY=...` in the environment. If no key, the chatbot uses deterministic responses. An external LLM is only used for conversational mode, has a strict 650ms HTTP timeout and falls back to curated replies. Never commit credentials.

## API
**POST** `/api/chat/` body: `{"message":"start"}`. Store returned `learner_id` and send it in future requests. Response: `learner_id`, `reply`, `mode`, `level`, `streak`, `correct`, `latency_ms`.
**GET** `/api/progress/<learner_id>/` returns level, practice records, mode and streak.
**GET** `/api/health/` returns `{ "status": "ok" }`.

## Tests
```bash
cd backend
python manage.py test tests
```

## Deploy (required for submission)
1. Push this directory to GitHub.
2. Create a persistent Postgres database (never use ephemeral SQLite on free hosting for real progress).
3. Deploy backend using `backend/render.yaml` settings or Render Web Service with root directory `backend`; configure `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_HOSTS=<your-backend-host>`, `CORS_ALLOWED_ORIGINS=https://<your-frontend>.vercel.app`, and `DEBUG=false`.
4. Deploy `frontend` on Vercel. Set `NEXT_PUBLIC_API_URL=https://<your-backend-host>`. Redeploy after changing this build-time variable.
5. Check deployed `/api/health/`, run end-to-end chat, test returning learner, check browser console, benchmark warm/cold starts.

**Caveat:** Render free services can spin down and violate the <2 s target on cold start. This MVP does not guarantee a universal production SLA. Test deployed p50/p95 and report both warm and cold results. Free-tier limits and availability vary.

## Safety / limitations
- Only anonymous UUIDs, not names, emails, or addresses. Child-friendly curated learning prompts and emotional support; escalate signs of danger to a trusted adult.
- Database retains at most 12 recent chat turns per learner; vocabulary progress persists. For real children, use caregiver consent, data deletion controls, stronger content moderation, data retention schedules, and a privacy review before production launch.
- Mode detection is transparent keyword-based NLP, not a medical emotion diagnosis. Learner IDs are bearer-like identifiers; this demo is not a production child-data security architecture. Do not deploy publicly for real children without proper authentication, consent and abuse controls.
- Frontend stores anonymous learner UUID in browser local storage. `Start over` creates a new session but does not delete old server data.
- The sample curriculum is deliberately small (5 tasks per level), intended to demonstrate progression rather than be a full education product.

See `docs/system-design.md`, `docs/architecture.png`, `docs/video-script.md`.

### Quick local latency sample
With the backend running, execute `python benchmark.py` from `backend/`. This makes 50 sequential warm HTTP requests and shows p50/p95/max; it is **not** a full frontend or concurrent-load test.
