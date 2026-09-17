from modeltranslation.translator import register, TranslationOptions
from .models import Question, QuestionOption, Test


@register(Question)
class QuestionTranslationOptions(TranslationOptions):
    fields = ('text', )


@register(QuestionOption)
class QuestionOptionTranslationOptions(TranslationOptions):
    fields = ('option_text', )


@register(Test)
class TestTranslationOptions(TranslationOptions):
    fields = ('title', 'description')