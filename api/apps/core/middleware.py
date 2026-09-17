import logging
import traceback
from datetime import datetime
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('django.request')


class CoreSystemMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        logger.info(f"{request.method} {request.path} - {response.status_code}")
        return response

    def process_exception(self, request, exception):
        logger.error(f"System Crash: {traceback.format_exc()}")

        return JsonResponse({
            "timestamp": datetime.now().isoformat(),
            "errorCode": "INTERNAL_ERROR",
            "message": "Виникла непередбачувана помилка на сервері."
        }, status=500)
