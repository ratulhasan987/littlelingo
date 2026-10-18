
import os
import re
import requests

from .content import CURRICULUM
from .models import WordProgress



# EMOTIONAL SUPPORT
SUPPORT = {
    "sad": (
        "It is okay to feel sad. "
        "Would you like to talk or take a little break?"
    ),
    "scared": (
        "Feeling scared can be hard. "
        "Please talk to a grown-up you trust."
    ),
    "angry": (
        "It is okay to feel angry. "
        "Let us take a slow breath together."
    ),
    "lonely": (
        "I am here to listen. "
        "You can also talk with a grown-up you trust."
    ),
    "hurt": (
        "I am sorry you are hurting. "
        "Please tell a trusted grown-up."
    ),
}

DANGER = (
    "kill myself",
    "suicide",
    "hurt myself",
    "someone touched me",
    "hit me",
    "abuse",
    "not safe",
    "danger",
    "i want to die",
)

PERSONAL = re.compile(
    r"\b(address|phone number|password|where i live|"
    r"my school|my full name)\b",
    re.I,
)



# LEARNING COMMAND DETECTION
LEARNING_COMMANDS = {
    "learn",
    "lets learn",
    "start learning",
    "lets start learning",
    "i want to learn",
    "learn english",
    "learn words",
    "start lesson",
    "start a lesson",
    "new lesson",
    "continue learning",
    "continue lesson",
    "resume learning",
    "next question",
    "next word",
    "another word",
    "teach me",
    "teach me english",
    "start exploring",
    "lets get started",
}


def normalize_text(text):
    """
    Normalize punctuation, casing and spacing.

    Examples:
    "Let's learn!" -> "lets learn"
    "NEXT QUESTION!" -> "next question"
    """
    text = text.lower().strip()
    text = re.sub(r"['’]", "", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return " ".join(text.split())


def is_learning_command(text):
    return normalize_text(text) in LEARNING_COMMANDS



# CHILD MODE CLASSIFICATION
def classify(text):
    t = text.lower().strip()

    # Safety always takes priority.
    if any(keyword in t for keyword in DANGER):
        return "support", "urgent"

    # Emotional support
    for emotion in SUPPORT:
        if re.search(
            r"\b" + re.escape(emotion) + r"\b",
            t
        ):
            return "support", emotion

    # Explicit lesson commands must not be graded.
    if is_learning_command(text):
        return "learning", "command"

    if re.search(
        r"\b(bored|game|play|fun|joke)\b",
        t
    ):
        return "engagement", None

    if re.search(
        r"\b(hi|hello|how are you|friend|talk|chat)\b",
        t
    ):
        return "conversation", None

    if re.search(
        r"\b(stop|break|tired|no more|later)\b",
        t
    ):
        return "break", None

    return "learning", None



# LEARNING ENGINE
def current_question(learner):
    """
    Return the active question without changing
    attempts, successes, streak or level.
    """
    items = CURRICULUM[learner.level]

    for word, question, answer in items:
        if word == learner.current_word:
            return question

    return None


def next_question(learner):
    """
    Select the next unmastered word.

    This does not grade an answer.
    """
    items = CURRICULUM[learner.level]

    progress = {
        p.word: p
        for p in learner.words.all()
    }

    for word, question, answer in items:
        if (
            word not in progress
            or not progress[word].mastered
        ):
            learner.current_word = word
            learner.awaiting_answer = True
            return question

    learner.awaiting_answer = False

    return "You learned all the words in this level!"


def handle_learning_command(learner, text):
    """
    Learning commands are navigation actions,
    not quiz answers.

    Preserve the current unfinished question.
    """
    command = normalize_text(text)

    if learner.awaiting_answer:
        question = current_question(learner)

        if question:
            if command in {
                "next question",
                "next word",
                "another word",
            }:
                return (
                    "Let's finish this word first! "
                    + question
                )

            return (
                "Great! Let's keep learning! "
                + question
            )

    # No active question: start or resume learning.
    question = next_question(learner)

    if command in {
        "next question",
        "next word",
        "another word",
    }:
        return "Here is your question! " + question

    return "Great! Let's learn together! " + question



# OPTIONAL GROQ LLM
def try_llm(text, level):
    """
    Optional LLM for conversation only.

    Core learning works without an API key.
    """
    key = os.getenv("GROQ_API_KEY", "").strip()

    enabled = (
        os.getenv("ENABLE_LLM", "false").lower()
        == "true"
    )

    if not key or not enabled:
        return None

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
            },
            json={
                "model": os.getenv(
                    "GROQ_MODEL",
                    "llama-3.1-8b-instant"
                ),
                "temperature": 0.3,
                "max_tokens": 90,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a child-safe English "
                            "buddy for a child under 7 "
                            f"at level {level}. "
                            "Use at most two short sentences. "
                            "Use simple English. "
                            "Do not ask for personal details, "
                            "secrets, addresses or phone numbers. "
                            "No links or unsafe instructions. "
                            "Redirect safety concerns to "
                            "a trusted adult."
                        ),
                    },
                    {
                        "role": "user",
                        "content": text[:180],
                    },
                ],
            },
            timeout=0.65,
        )

        response.raise_for_status()

        result = response.json()[
            "choices"
        ][0]["message"]["content"].strip()

        if len(result) > 260:
            return None

        if re.search(
            r"https?://|\b(address|password|"
            r"phone number|secret)\b",
            result,
            re.I,
        ):
            return None

        return result

    except (
        requests.RequestException,
        KeyError,
        IndexError,
        TypeError,
        ValueError,
    ):
        return None



# MAIN CHAT ENGINE
def reply(learner, text):
    mode, emotion = classify(text)
    t = text.lower().strip()

    
    # 1. Personal information protection
    if PERSONAL.search(text):
        return (
            "support",
            "Let's keep personal details private. "
            "We can talk about colors or animals instead!",
            False,
        )

    
    # 2. Emotional support and safety
    if mode == "support":
        if emotion == "urgent":
            return (
                "support",
                "I am sorry this is happening. "
                "Please tell a trusted grown-up near "
                "you right now. You deserve help "
                "and safety.",
                False,
            )

        return (
            "support",
            SUPPORT[emotion],
            False,
        )

    
    # 3. Learning command detection
    # IMPORTANT: Before answer evaluation
    if emotion == "command":
        message = handle_learning_command(
            learner,
            text
        )

        return "learning", message, False

    
    # 4. Break mode
    if mode == "break":
        return (
            "break",
            "Okay! Taking a break is smart. "
            "See you when you feel ready.",
            False,
        )

    
    # 5. Engagement mode
    if mode == "engagement":
        return (
            "engagement",
            "Let's play! Can you name an "
            "animal that says meow?",
            False,
        )

    
    # 6. Conversation mode
    if mode == "conversation":
        answer = try_llm(
            text,
            learner.level
        )

        if not answer:
            answer = (
                "I am happy to talk with you! "
                "What animal do you like?"
            )

        return "conversation", answer, False

    
    # 7. Evaluate actual learning answer
    if learner.awaiting_answer:

        match = next(
            (
                (word, question, answer)
                for word, question, answer
                in CURRICULUM[learner.level]
                if word == learner.current_word
            ),
            None,
        )

        if match:
            word, question, answer = match

            tokens = re.findall(
                r"[a-z]+",
                t
            )

            expected = str(answer).lower().strip()

            correct = (
                expected in tokens
                or t == expected
            )

            progress, created = (
                WordProgress.objects.get_or_create(
                    learner=learner,
                    word=word,
                )
            )

            progress.attempts = min(
                progress.attempts + 1,
                65535
            )

            
            # Correct answer
            if correct:
                progress.successes = min(
                    progress.successes + 1,
                    65535
                )

                progress.mastered = (
                    progress.successes >= 2
                )

                learner.streak += 1
                learner.awaiting_answer = False

                progress.save()

                message = (
                    "Great job! That is right! "
                )

                if progress.mastered:
                    message += (
                        "You know this word! "
                    )

                # Check level completion
                level_completed = all(
                    learner.words.filter(
                        word=w,
                        mastered=True
                    ).exists()
                    for w, _, _ in CURRICULUM[
                        learner.level
                    ]
                )

                if level_completed:
                    if learner.level < 3:
                        learner.level += 1

                        message += (
                            f"You unlocked Level "
                            f"{learner.level}! "
                        )

                    else:
                        message += (
                            "You completed Level 3! "
                        )

                        learner.awaiting_answer = False

                        return (
                            "learning",
                            message.strip(),
                            True,
                        )

                message += next_question(
                    learner
                )

                return (
                    "learning",
                    message.strip(),
                    True,
                )

            
            # Incorrect answer
            learner.streak = 0
            progress.save()

            return (
                "learning",
                f"Good try! {question} "
                f"Hint: it starts with "
                f"{expected[0].upper()}.",
                False,
            )

    
    # 8. First lesson
    
    return (
        "learning",
        next_question(learner),
        False,
    )



# FRONTEND UI METADATA
def response_ui(
    mode,
    answer,
    correct,
    original_text=""
):
    """
    Returns allowlisted UI metadata.

    Frontend displays Lucide icons based
    on the response type.
    """

    if mode == "support":
        if classify(original_text)[1] == "urgent":
            return {
                "type": "urgent",
                "icon": "shield-alert",
                "animation": "none",
            }

        return {
            "type": "support",
            "icon": "heart",
            "animation": "none",
        }

    if mode == "break":
        return {
            "type": "break",
            "icon": "coffee",
            "animation": "none",
        }

    if mode == "engagement":
        return {
            "type": "engagement",
            "icon": "gamepad-2",
            "animation": "none",
        }

    if mode == "conversation":
        return {
            "type": "conversation",
            "icon": "message-circle",
            "animation": "none",
        }

    if (
        "unlocked Level" in answer
        or "completed Level 3" in answer
    ):
        return {
            "type": "achievement",
            "icon": "trophy",
            "animation": "celebrate",
        }

    if correct:
        return {
            "type": "success",
            "icon": "check-circle-2",
            "animation": "pop",
        }

    if answer.startswith("Good try!"):
        return {
            "type": "hint",
            "icon": "lightbulb",
            "animation": "none",
        }

    return {
        "type": "learning",
        "icon": "book-open",
        "animation": "none",
    }
