from rest_framework.views import exception_handler
from datetime import datetime

def global_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_message = response.data.get('detail', str(exc)) if isinstance(response.data, dict) else str(exc)
        response.data = {
            "timestamp": datetime.now().isoformat(),
            "errorCode": "API_ERROR",
            "message": error_message
        }
    return response
