from google.genai import Client

from UniSchool import settings

gemini = Client(api_key=settings.GEMINI_TOKEN)
