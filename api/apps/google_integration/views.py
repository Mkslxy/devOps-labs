from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import GoogleCallbackSerializer
from .services import GoogleCalendarService
from ..core.google_colors import GoogleCalendarColor


@extend_schema(tags=["Google"])
class GoogleConnectView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        url = GoogleCalendarService.get_authorization_url()
        return Response({"url": url})


@extend_schema(
    tags=["Google"],
    request=GoogleCallbackSerializer
)
class GoogleCallbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GoogleCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"]

        try:
            creds = GoogleCalendarService.get_tokens(code)

            user = request.user
            user.google_refresh_token = creds.refresh_token
            user.is_google_calendar_connected = True
            user.save()

            return Response({"status": "Google Calendar Connected Successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=400)


@extend_schema(tags=["Google"])
class GoogleColorsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        colors = [
            {"id": color.value, "hex": color.label, "name": color.name}
            for color in GoogleCalendarColor
        ]
        return Response(colors)



@extend_schema(tags=["Google"])
class GoogleDisconnectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.google_refresh_token:
            return Response(
                {"detail": "Google Calendar is not connected."},
                status=400
            )

        GoogleCalendarService.disconnect_user(user)

        return Response(
            {"detail": "Google Calendar is successfully disconnected."},
            status=200
        )
