# LittleLingo — System design

## Purpose
Demonstrate safe, adaptive English learning for children younger than 7 through short prompts and gentle reinforcement.

## Architecture
Next.js (child UI, quick replies, speech synthesis, local anonymous learner ID) → Django REST Framework `/api/chat/` → classifier / learning / SEL / optional bounded Groq chat → Django ORM / SQLite (development) or Postgres (persistent deployment). Diagram: `architecture.png`.

## Mode and routing algorithm
1. Validate length and learner session.
2. Detect privacy disclosure first, then urgent safety / emotional support, break, playful engagement, casual conversation; otherwise learning.
3. Learning engine loads the current level's earliest unmastered prompt, evaluates exact short answer, and increments successes. Mastery: two correct attempts per word. Completion of all 5 words in the level unlocks the next level.
4. Context: `Learner.level`, `current_word`, `awaiting_answer`, `last_mode`, `streak`, `WordProgress` and 12 recent turns. The LLM currently receives only the immediate text and level, *not* long-form history.
5. Persist turn and return JSON.

## Design trade-offs
- **Deterministic core** supports consistent correctness, simple testing and minimal latency. Limits: restricted vocabulary, regex intent gaps and non-semantic answer evaluation.
- **Optional Groq** supports casual dialogue, but adds variability, free-tier rate limits and content risk. Request is timed out at 650 ms and has fixed fallback. Keyword-based output guard is a minimal demonstration, not comprehensive moderation.
- **SQLite** is simplest locally; production needs persistent Postgres.
- **Text-first** ensures keyboard use; browser speech synthesis is optional and varies by device.

## Performance budget and test methodology
API processes a short string, usually no external call, with single-learner DB operations. Measure on deployed hosting with 100 sequential and concurrent requests and report p50/p95/p99, failures, warm/cold starts, and frontend network TTFB. A local response measurement alone does not demonstrate <2 s end-to-end latency. Optional LLM adds up to ~650 ms client timeout + handling. Hosting/network/cold starts remain uncontrolled.

## SEL and safeguarding
For sadness/fear/anger/loneliness: empathetic, non-clinical short messages and choice of a break. Urgent unsafe messages direct the child to a nearby trusted adult. No requests for personally identifying data. Before actual child users, add guardian consent, explicit deletion/export, vetted moderation, abuse reporting, audit controls and legal/privacy assessment.

## Future improvements
Age-specific curriculum; multilingual parent controls; adaptive spaced repetition; accessible voice input; rubric-based grading; better classification evaluation; per-user consent and deletion; production monitoring and deployment health checks.
