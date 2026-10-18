
from django.urls import path
from django.http import JsonResponse
from learning.views import chat, progress, health


def api_home(request):
    return JsonResponse({
        "status": "success",
        "message": "Welcome to LittleLingo API!",
        "application": "LittleLingo - AI English Learning Buddy",
        "version": "1.0.0",
        "features": [
            "Progressive Learning (L1, L2, L3)",
            "Adaptive Learning",
            "Child Mode Detection",
            "Social and Emotional Learning",
            "Context-Aware Responses",
            "Hybrid AI Engine"
        ],
        "endpoints": {
            "home": "/",
            "health": "/api/health/",
            "chat": "/api/chat/",
            "progress": "/api/progress/<learner_id>/"
        }
    })


urlpatterns = [
    path("", api_home, name="api-home"),
    path("api/health/", health, name="health"),
    path("api/chat/", chat, name="chat"),
    path(
        "api/progress/<uuid:learner_id>/",
        progress,
        name="progress"
    ),
]
