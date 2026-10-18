import time
from uuid import UUID
from django.db import transaction
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Learner, ChatTurn
from .engine import reply

def health(request): return JsonResponse({'status':'ok'})
@api_view(['POST'])
def chat(request):
    started=time.perf_counter()
    text=request.data.get('message','')
    if not isinstance(text,str) or not text.strip() or len(text)>240:
        return Response({'error':'Message must contain 1–240 characters.'},status=400)
    raw=request.data.get('learner_id')
    if raw:
        try: learner_id=UUID(str(raw))
        except (ValueError,AttributeError):return Response({'error':'Invalid learner_id'},status=400)
    else:learner_id=None
    with transaction.atomic():
        if learner_id:
            learner=Learner.objects.select_for_update().filter(pk=learner_id).first()
            if learner is None:return Response({'error':'Learner not found'},status=404)
        else:learner=Learner.objects.create()
        mode,answer,correct=reply(learner,text.strip())
        learner.turns+=1
        learner.last_mode=mode
        learner.save()
        ChatTurn.objects.create(learner=learner,child_text=text.strip(),bot_text=answer[:500],mode=mode)
        # Short retention: never preserve more than the most recent 12 turns.
        old_ids=list(ChatTurn.objects.filter(learner=learner).order_by('-id').values_list('pk',flat=True)[12:])
        if old_ids:ChatTurn.objects.filter(pk__in=old_ids).delete()
    return Response({'learner_id':str(learner.id),'reply':answer,'mode':mode,'level':learner.level,'streak':learner.streak,'correct':correct,'latency_ms':round((time.perf_counter()-started)*1000,1)})
@api_view(['GET'])
def progress(request,learner_id):
    learner=Learner.objects.filter(pk=learner_id).first()
    if not learner:return Response({'error':'Learner not found'},status=404)
    return Response({'learner_id':str(learner.id),'level':learner.level,'streak':learner.streak,'turns':learner.turns,'mode':learner.last_mode,'words':[{'word':w.word,'attempts':w.attempts,'successes':w.successes,'mastered':w.mastered} for w in learner.words.all().order_by('id')]})
