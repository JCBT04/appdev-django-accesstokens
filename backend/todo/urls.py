from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TodoViewSet, SecureHelloView

router = DefaultRouter()
router.register(r'todo', TodoViewSet)  # Register the TodoViewSet for the 'todo' path

urlpatterns = [
    path('', include(router.urls)),  # Use the router to handle the API routes
    path('secure-hello/', SecureHelloView.as_view()),
]
