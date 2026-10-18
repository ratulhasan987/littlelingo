import os
import re
import time
import requests
from .content import CURRICULUM
from .models import WordProgress

SUPPORT = {'sad':'It is okay to feel sad. 💛 Want to tell me what happened or take a little break?', 'scared':'Feeling scared is hard. 💛 Please talk to a grown-up you trust. Want to take a slow breath?', 'angry':'Angry feelings happen. Let us breathe in and out slowly. 🌈', 'lonely':'I am here to listen. 💛 You can also talk with a grown-up you trust.', 'hurt':'I am sorry you feel hurt. Please tell a grown-up you trust right now. 💛'}
DANGER = ('kill myself','suicide','hurt myself','someone touched me','hit me','abuse','not safe','danger','i want to die')
PERSONAL = re.compile(r'\b(address|phone number|password|where i live|my school|my full name)\b',re.I)

def classify(text):
    t=text.lower().strip()
    if any(x in t for x in DANGER): return 'support','urgent'
    for emotion in SUPPORT:
        if re.search(r'\b'+re.escape(emotion)+r'\b', t): return 'support', emotion
    if re.search(r'\b(bored|game|play|fun|joke)\b', t): return 'engagement',None
    if re.search(r'\b(hi|hello|how are you|friend|talk|chat)\b', t): return 'conversation',None
    if re.search(r'\b(stop|break|tired|no more|later)\b', t): return 'break',None
    return 'learning',None

def next_question(learner):
    items=CURRICULUM[learner.level]
    progress={p.word:p for p in learner.words.all()}
    for word,question,answer in items:
        if not progress.get(word) or not progress[word].mastered:
            learner.current_word=word
            learner.awaiting_answer=True
            return question
    return 'You learned all the words in this level! 🌟'

def try_llm(text, level):
    # All LLM calls are optional. 650ms timeout protects the main response budget.
    key=os.getenv('GROQ_API_KEY','').strip()
    if not key or os.getenv('ENABLE_LLM','false').lower()!='true': return None
    try:
        response=requests.post('https://api.groq.com/openai/v1/chat/completions',headers={'Authorization':f'Bearer {key}'},json={
          'model':os.getenv('GROQ_MODEL','llama-3.1-8b-instant'), 'temperature':0.3,'max_tokens':90,
          'messages':[{'role':'system','content':f'You are a child-safe English buddy for a child under 7 at level {level}. Use at most two short sentences, simple English, no personal questions or identifying information, no unsafe instructions, no secrets, no links. Redirect safety concerns to a trusted adult.'},{'role':'user','content':text[:180]}]},timeout=0.65)
        response.raise_for_status()
        result=response.json()['choices'][0]['message']['content'].strip()
        # Block common unsafe output characteristics; deterministic fallback otherwise.
        if len(result)>260 or re.search(r'https?://|\b(address|password|phone number|secret)\b',result,re.I):return None
        return result
    except (requests.RequestException,KeyError,IndexError,TypeError,ValueError):return None

def reply(learner, text):
    mode,emotion=classify(text)
    t=text.lower().strip()
    if PERSONAL.search(text): return 'support','Let us keep personal details private. 💛 We can talk about colors or animals instead!',False
    if mode=='support':
        if emotion=='urgent': return mode,'I am sorry this is happening. Please tell a trusted grown-up near you right now. You deserve help and safety. 💛',False
        return mode,SUPPORT[emotion],False
    if mode=='break':return mode,'Okay! Taking a break is smart. See you when you feel ready. 🌼',False
    if mode=='engagement':return mode,'Let us play! 🎮 Can you name an animal that says meow?',False
    if mode=='conversation':return mode,(try_llm(text,learner.level) or 'I am happy to talk with you! 🌈 What animal do you like?'),False
    if learner.awaiting_answer:
        question=next((q for w,q,a in CURRICULUM[learner.level] if w==learner.current_word),None)
        match=next(((w,q,a) for w,q,a in CURRICULUM[learner.level] if w==learner.current_word),None)
        if match:
            word,_,answer=match
            tokens=re.findall(r"[a-z]+", t)
            # Exact token / short-answer match, no fuzzy grading of complex utterances.
            correct=(answer in tokens or t==answer)
            prog,_=WordProgress.objects.get_or_create(learner=learner,word=word)
            prog.attempts=min(prog.attempts+1,65535)
            if correct:
                prog.successes=min(prog.successes+1,65535)
                prog.mastered=prog.successes>=2
                learner.streak+=1
                learner.awaiting_answer=False
                message='Great job! 🌟 That is right! '
                if prog.mastered: message+='You know this word! '
                prog.save()
                if all(learner.words.filter(word=w,mastered=True).exists() for w,_,_ in CURRICULUM[learner.level]):
                    if learner.level<3:
                        learner.level+=1
                        message+=f'You unlocked Level {learner.level}! 🎉 '
                    else:message+='You completed Level 3! 🏆 '
                if not (learner.level==3 and all(learner.words.filter(word=w,mastered=True).exists() for w,_,_ in CURRICULUM[3])):
                    message+=next_question(learner)
                return 'learning',message,True
            learner.streak=0
            prog.save()
            return 'learning',f'Good try! 💛 {question} Hint: it starts with {answer[0].upper()}.',False
    return 'learning',next_question(learner),False
