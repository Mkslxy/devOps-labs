from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        return Response({
            "status": "OK",
            "timestamp": datetime.now().isoformat()
        }, status=200)
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        # Якщо БД лежить — повертаємо 503
        return Response(
            {"status": "Database unavailable"},
            status=503
        )
