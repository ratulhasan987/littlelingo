from django.urls import path
from learning.views import chat, progress, health
urlpatterns = [path('api/health/',health),path('api/chat/',chat),path('api/progress/<uuid:learner_id>/',progress)]
