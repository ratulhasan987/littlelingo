import uuid
from django.db import models
class Learner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.PositiveSmallIntegerField(default=1)
    streak = models.PositiveIntegerField(default=0)
    turns = models.PositiveIntegerField(default=0)
    last_mode = models.CharField(max_length=24, default='learning')
    current_word = models.CharField(max_length=40, blank=True, default='')
    awaiting_answer = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
class WordProgress(models.Model):
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='words')
    word = models.CharField(max_length=40)
    successes = models.PositiveSmallIntegerField(default=0)
    attempts = models.PositiveSmallIntegerField(default=0)
    mastered = models.BooleanField(default=False)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['learner','word'],name='unique_learner_word')]
class ChatTurn(models.Model):
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='history')
    child_text = models.CharField(max_length=240)
    bot_text = models.CharField(max_length=500)
    mode = models.CharField(max_length=24)
    created_at = models.DateTimeField(auto_now_add=True)
