import json

from PIL import Image
from django.core.serializers.json import DjangoJSONEncoder
from google.genai import types

from UniSchool import settings
from UniSchool.gemini import gemini
from apps.magic_import.schemas import TestMagicImportResult, CourseImportResult, FinancialAnalysisResult
from apps.magic_import.services.prompts import Prompts


class GeminiService:

    @staticmethod
    def gen_test_from_photo(photo):
        image = Image.open(photo)

        response = gemini.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[Prompts.TESTS_PROMPT, image],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TestMagicImportResult,
                temperature=0.0,
            ),
        )

        return json.loads(response.text)

    @staticmethod
    def gen_course_from_pdf(pdf_file_obj):
        pdf_bytes = pdf_file_obj.read()

        document_part = types.Part.from_bytes(
            data=pdf_bytes,
            mime_type='application/pdf'
        )

        response = gemini.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[Prompts.COURSE_PROMPT, document_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CourseImportResult,
                temperature=0.1,
            ),
        )

        return json.loads(response.text)

    @staticmethod
    def analyze_financial_data(pnl_data: dict, books_data: dict):
        combined_data = {
            "pnl_report": pnl_data,
            "book_orders_report": books_data
        }
        json_string = json.dumps(
            combined_data,
            ensure_ascii=False,
            cls=DjangoJSONEncoder
        )

        full_prompt = f"{Prompts.FINANCE_ANALYSIS_PROMPT}\n\nОсь дані для аналізу:\n{json_string}"

        response = gemini.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[full_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FinancialAnalysisResult,
                temperature=0.2,
            ),
        )

        return json.loads(response.text)
