from typing_extensions import TypedDict, NotRequired


class QuestionOptionSchema(TypedDict):
    option_text: str
    is_correct: bool
    explanation: NotRequired[str]
    correct_order: NotRequired[int]
    match_pair_text: NotRequired[str]
    blank_group_id: NotRequired[int]


class QuestionSchema(TypedDict):
    text: str
    type: str
    points: float
    options: list[QuestionOptionSchema]


class TestMagicImportResult(TypedDict):
    questions: list[QuestionSchema]


class TaskSchema(TypedDict):
    title: str
    description: NotRequired[str]


class MaterialSchema(TypedDict):
    title: str
    description: NotRequired[str]


class CourseTopicSchema(TypedDict):
    title: str
    content_description: NotRequired[str]
    materials: list[MaterialSchema]
    tasks: list[TaskSchema]


class CourseModuleSchema(TypedDict):
    title: str
    topics: list[CourseTopicSchema]


class CourseImportResult(TypedDict):
    course_title: str
    course_description: NotRequired[str]
    level: str
    modules: list[CourseModuleSchema]


class FinancialAnalysisResult(TypedDict):
    executive_summary: str
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
