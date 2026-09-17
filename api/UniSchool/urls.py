from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from django.conf import settings
from django.conf.urls.static import static

from apps.core.views import health_check

urlpatterns = [
    path('', include('apps.users.urls')),
    path('', include('apps.courses.urls')),
    path('', include('apps.classes.urls')),
    path('', include('apps.testing.urls')),
    path('', include('apps.homework.urls')),
    path('', include('apps.gradebook.urls')),
    path('gradebook/', include('apps.gradebook.urls')),
    path('', include('apps.support.urls')),
    path('', include('apps.crm.urls')),
    path('stats/', include('apps.stats.urls')),
    path('', include('apps.finance.urls')),
    path('google/', include('apps.google_integration.urls')),
    path('magic-import/', include('apps.magic_import.urls')),
    path('telegram/', include('apps.telegram.urls')),

    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('health/', health_check, name='health_check'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
