# Correct WSGI settings
import os
from django.core.wsgi import get_wsgi_application

settings_module = 'backend.deployment_settings' if 'RENDER_EXTERNAL_HOSTNAME' in os.environ else 'backend.settings'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.deployment_settings')

application = get_wsgi_application()
