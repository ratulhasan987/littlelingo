# English presentation script (approximately 90–110 seconds)

Hello, I am presenting LittleLingo, an English-learning chatbot designed for children under seven.

The challenge was to support progressive learning, recognize the child's interaction mode, provide social-emotional support, and keep latency under two seconds in normal conditions.

I chose Next.js with Tailwind for a friendly, mobile-responsive interface, and Django REST Framework for the backend because it is simple to maintain and allows structured learning progress in the database.

The AI design is hybrid. The primary path uses a deterministic learning engine and lightweight intent detection, while an optional Groq model can respond to casual conversation. If the API is slow or unavailable, the system uses a safe preset response. This reduces cost and dependency on external services.

The learning engine has three levels. A learner earns mastery by answering each prompt correctly twice, and can only move to the next level after mastering the current one. The bot also remembers the active prompt and progress, so the experience adapts to earlier answers.

If the learner says they are bored, the bot offers play. If they feel sad or scared, it switches to a gentle support response rather than continuing a lesson. Safety-related messages encourage speaking to a trusted adult.

The main trade-off is that rule-based classification is fast and predictable but less flexible than a full LLM. The demonstration also needs stronger parental consent and moderation before serving real children.

Finally, I will demonstrate answering a lesson question, switching into support mode, and checking that the level and progress persist after refresh.

Thank you!
