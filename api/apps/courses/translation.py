from modeltranslation.translator import register, TranslationOptions
from .models import Course, CourseModule, CourseTopic, Material


@register(Course)
class CourseTranslationOptions(TranslationOptions):
    fields = ('title', 'description')


@register(CourseModule)
class CourseModuleTranslationOptions(TranslationOptions):
    fields = ('title',)


@register(CourseTopic)
class CourseTopicTranslationOptions(TranslationOptions):
    fields = ('title', 'content_description')


@register(Material)
class MaterialTranslationOptions(TranslationOptions):
    fields = ('title',)
