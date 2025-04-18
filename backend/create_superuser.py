# backend/create_superuser.py
import os
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError

User = get_user_model()

username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin123")

try:
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print("✅ Superuser created.")
    else:
        print("ℹ️ Superuser already exists.")
except IntegrityError as e:
    print("❌ Failed to create superuser:", e)
