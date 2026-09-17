from datetime import timedelta
from uuid import uuid4, UUID

from django.db import transaction, models
from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, GenericViewSet, ReadOnlyModelViewSet

from UniSchool import settings
from apps.core.utils import HasPermission, CustomPageNumberPagination
from apps.testing.filters import StudentAnswerFilterSet, TestAttemptFilterSet, QuestionFilterSet, TestVersionFilterSet, \
    TestFilterSet, TestAssignmentFilterSet, OnboardingTestAssignmentFilterSet, OnboardingTestAttemptFilterSet, \
    OnboardingStudentAnswerFilterSet
from apps.testing.models import Test, TestVersion, Question, TestAttempt, StudentAnswer, \
    OnboardingTestAttempt, OnboardingStudentAnswer
from apps.testing.models.test_assigment import TestAssignment
from apps.testing.models.test_attempt import TestAttemptStatus
from apps.testing.models.test_version import TestStatus
from apps.testing.permissions import IsNotStudent
from apps.testing.policies import TestQueryPolicy, TestVersionQueryPolicy, TestAssignmentQueryPolicy, \
    TestAttemptQueryPolicy, StudentAnswerQueryPolicy, CanViewAssignmentInfo
from apps.testing.serializers import TestSerializer, TestVersionSerializer, QuestionListSerializer, \
    QuestionSerializer, TestVersionDetailSerializer, TestAttemptStartSerializer, \
    TestAttemptFinishSerializer, TestAssignmentSerializer, TestAttemptDetailSerializer, TestAttemptReviewSerializer, \
    StudentAnswerGradeSerializer, TeacherAttemptListSerializer, OnboardingTestAssignmentSerializer, \
    OnboardingTestAttemptStartSerializer, OnboardingTestAttemptFinishSerializer, OnboardingTestAttemptReviewSerializer, \
    OnboardingTestAttemptDetailSerializer, OnboardingTestAttemptResultSerializer, \
    TeacherOnboardingAttemptListSerializer, OnboardingStudentAnswerGradeSerializer, PublicTestAssignmentSerializer, \
    TestAttemptResultSerializer
from apps.testing.services import _rate_and_save_students_answers


@extend_schema(tags=["TestManagement/Test"])
class TestViewSet(ModelViewSet):
    queryset = Test.objects.all().order_by('-created_at')
    serializer_class = TestSerializer

    permission_classes = [HasPermission, IsNotStudent]
    admin_permissions = ['test.manage_all']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TestFilterSet
    ordering_fields = ['id', 'title', 'created_at']

    def get_queryset(self):
        return TestQueryPolicy.for_user(self.request.user)

    def get_required_permissions(self, view):
        if self.request.method not in permissions.SAFE_METHODS:
            return ['tests.read', 'tests.write']
        return ['tests.read']

    @extend_schema(
        summary="Створити нову версію тесту (та що TestVersion)",
        description="Створює чернетку (DRAFT) на основі останньої версії. Копіює налаштування та питання.",
        responses={201: TestVersionSerializer},
        request=None
    )
    @action(detail=True, methods=['post'], url_path='create-version')
    @transaction.atomic
    def create_version(self, request, pk=None):
        test = self.get_object()
        user = request.user

        existing_draft = test.versions.filter(status=TestStatus.DRAFT).first()
        if existing_draft:
            return Response(
                {
                    "detail": "This test already has active draft. Firstly publish or delete it.",
                    "version_id": existing_draft.id
                },
                status=409
            )

        latest_version = test.versions.order_by('-version_number').first()

        if not latest_version:
            new_version_number = 1
            source_questions = []
            settings_source = {}
        else:
            new_version_number = latest_version.version_number + 1
            source_questions = latest_version.questions.all()
            settings_source = {
                "time_limit_minutes": latest_version.time_limit_minutes,
                "passing_score_percent": latest_version.passing_score_percent,
                "is_random_order": latest_version.is_random_order,
            }

        new_version = TestVersion.objects.create(
            test=test,
            version_number=new_version_number,
            status=TestStatus.DRAFT,
            created_by=user,
            **settings_source
        )

        if source_questions:
            new_version.questions.set(source_questions)

        return Response(
            TestVersionDetailSerializer(new_version).data,
            status=201
        )


@extend_schema(tags=["TestManagement/TestVersion"])
class TestVersionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet
):
    queryset = TestVersion.objects.all()
    serializer_class = TestVersionSerializer
    permission_classes = [HasPermission, IsNotStudent]
    admin_permissions = ['test.manage_all']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TestVersionFilterSet
    ordering_fields = ['id', 'passing_score_percent', 'created_at']

    def get_queryset(self):
        return TestVersionQueryPolicy.for_user(self.request.user)

    def get_required_permissions(self, view):
        if self.request.method not in permissions.SAFE_METHODS:
            return ['tests.read', 'tests.write']
        return ['tests.read']

    def get_queryset(self):
        queryset = TestVersion.objects.all()

        if self.action == 'retrieve':
            return queryset.prefetch_related(
                'questions',
                'questions__options'
            )
        return queryset

    def get_serializer_class(self):
        if self.action != 'list':
            return TestVersionDetailSerializer
        return TestVersionSerializer

    def perform_update(self, serializer):
        version = serializer.save()

        if version.status == TestStatus.PUBLISHED:
            test = version.test
            test.current_version = version
            test.save()

    @extend_schema(request=QuestionListSerializer)
    @action(detail=True, methods=['post'], url_path='add-questions')
    def add_questions(self, request, pk=None):
        version = self.get_object()

        serializer = QuestionListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids_to_add = serializer.validated_data['question_ids']

        valid_questions = Question.objects.filter(id__in=ids_to_add)
        if not valid_questions:
            return Response(
                {"message": "No valid question IDs found."},
                status=400
            )

        version.questions.add(*valid_questions)
        data = TestVersionDetailSerializer(instance=version).data
        return Response(data, status=200)

    @extend_schema(request=QuestionListSerializer)
    @action(detail=True, methods=['post'], url_path='remove-questions')
    def remove_questions(self, request, pk=None):
        version = self.get_object()

        question_ids = request.data.get('question_ids', [])
        version.questions.remove(*question_ids)

        return Response({
            "message": "Questions removed.",
        }, status=200)


@extend_schema(tags=["TestManagement/Question"])
class QuestionViewSet(ModelViewSet):
    queryset = Question.objects.all().order_by('-created_at')
    serializer_class = QuestionSerializer

    permission_classes = [HasPermission, IsNotStudent]
    admin_permissions = ['test.manage_all']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = QuestionFilterSet
    ordering_fields = ['id', 'text', 'points', 'created_at']

    def get_required_permissions(self, view):
        if self.request.method not in permissions.SAFE_METHODS:
            return ['tests.read', 'tests.write']
        return ['tests.read']


@extend_schema(tags=["TestManagement/TestAssignment"])
class TestAssignmentViewSet(ModelViewSet):
    queryset = TestAssignment.objects.all().select_related(
        'test',
        'pinned_version',
        'lesson',
        'material'
    ).order_by('-created_at')
    serializer_class = TestAssignmentSerializer

    permission_classes = [HasPermission, IsNotStudent]
    required_permissions = ['tests.read', 'tests.write']
    admin_permissions = ['test.manage_all']

    pagination_class = CustomPageNumberPagination

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TestAssignmentFilterSet
    ordering_fields = ['id', 'created_at', 'starting_at', 'closing_at']

    def get_queryset(self):
        return TestAssignmentQueryPolicy.for_user(self.request.user)


@extend_schema(tags=["TestManagement/OnboardingTestAssignment"])
class OnboardingTestAssignmentViewSet(ModelViewSet):
    queryset = TestAssignment.objects.all().select_related(
        'test',
        'pinned_version',
    ).order_by('-created_at')
    serializer_class = OnboardingTestAssignmentSerializer

    permission_classes = [HasPermission]
    required_permissions = ['tests.manage_onboardings']

    pagination_class = CustomPageNumberPagination

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = OnboardingTestAssignmentFilterSet
    ordering_fields = ['id', 'created_at', 'starting_at', 'closing_at']

    def get_queryset(self):
        return (
            TestAssignment.objects
            .filter(lesson__isnull=True, material__isnull=True, group__isnull=True)
            .select_related('test', 'pinned_version', )
            .order_by('-created_at')
        )


@extend_schema(tags=["TestTaking/TestAttempt"])
class TestAttemptViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet
):
    queryset = TestAttempt.objects.all()
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TestAttemptFilterSet
    ordering_fields = ['id', 'finished_at', 'started_at', 'duration', 'grade__value']

    def get_queryset(self):
        return TestAttemptQueryPolicy.for_user(self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return TestAttemptStartSerializer
        if self.action == 'finish':
            return TestAttemptFinishSerializer
        if self.action == 'review':
            return TestAttemptReviewSerializer
        if self.action == 'retrieve':
            return TestAttemptDetailSerializer
        return TestAttemptResultSerializer

    @transaction.atomic
    @extend_schema(description="Створює спробу тесту: починає відлік часу і тд.")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user

        try:
            assignment = TestAssignment.objects.select_related(
                'test__current_version',
                'pinned_version'
            ).get(id=data['assignment_id'])
        except TestAssignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=404)

        version = assignment.actual_version

        if not version:
            return Response({"detail": "This test is not ready yet (no active version)."}, status=400)

        if version.status != 'published':
            return Response({"detail": "Test version is not published."}, status=400)

        existing_active_attempt = TestAttempt.objects.filter(
            student=user,
            assignment=assignment,
            status=TestAttemptStatus.IN_PROGRESS
        ).first()

        if existing_active_attempt:
            return Response({
                "detail": "You already have an active attempt for this test. "
                          "You can finish it or wait for the next attempt.",
                "attempt_id": existing_active_attempt.id
            }, status=409)

        if assignment.starting_at and assignment.starting_at > timezone.now():
            return Response({"detail": "Test is not started yet."}, status=400)

        attempt = TestAttempt.objects.create(
            student=user,
            test_version=version,
            assignment=assignment,
            status=TestAttemptStatus.IN_PROGRESS,
        )

        time_limit = assignment.custom_time_limit or version.time_limit_minutes
        deadline = None
        if time_limit:
            deadline = attempt.started_at + timedelta(minutes=time_limit)

        return Response({
            "attempt_id": attempt.id,
            "started_at": attempt.started_at,
            "deadline": deadline,
            "time_limit_minutes": time_limit
        }, status=201)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def finish(self, request, pk=None):
        attempt = self.get_object()

        if attempt.status != TestAttemptStatus.IN_PROGRESS:
            return Response({"detail": "This test is finished."}, status=400)

        finish_time = timezone.now()
        version = attempt.test_version
        assignment = attempt.assignment
        time_limit = assignment.custom_time_limit or version.time_limit_minutes

        actual_status = TestAttemptStatus.COMPLETED
        if time_limit:
            max_allowed_time = attempt.started_at + timedelta(minutes=time_limit) + timedelta(minutes=2)
            if finish_time > max_allowed_time:
                actual_status = TestAttemptStatus.TIMED_OUT

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data['answers']

        questions_map = {q.id: q for q in version.questions.all()}
        total_score = _rate_and_save_students_answers(attempt, answers_data, questions_map)
        total_possible_score = sum(q.points for q in questions_map.values())

        attempt.finished_at = finish_time
        attempt.status = actual_status
        attempt.max_possible_score = total_possible_score

        if total_possible_score > 0:
            percentage = (total_score / total_possible_score) * 100
            pass_threshold = assignment.custom_passing_score or version.passing_score_percent
            attempt.is_passed = percentage >= pass_threshold

        attempt.save()

        return Response(TestAttemptResultSerializer(attempt).data)

    @action(detail=True, methods=['get'])
    def review(self, request, pk=None):
        attempt = self.get_object()

        if attempt.status == TestAttemptStatus.IN_PROGRESS:
            return Response({"detail": "Спочатку завершіть тест."}, status=400)

        if not attempt.assignment.show_answers:
            return Response({"detail": "Відповіді до цієї спроби недоступні."})

        serializer = self.get_serializer(attempt)
        return Response(serializer.data)


@extend_schema(tags=["TestTaking/OnboardingTestAttempt"])
class OnboardingTestAttemptViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet
):
    queryset = OnboardingTestAttempt.objects.all()
    permission_classes = [AllowAny]

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = OnboardingTestAttemptFilterSet
    ordering_fields = ['id', 'finished_at', 'started_at', 'duration', 'score']

    def get_serializer_class(self):
        if self.action == 'create':
            return OnboardingTestAttemptStartSerializer
        if self.action == 'finish':
            return OnboardingTestAttemptFinishSerializer
        if self.action == 'review':
            return OnboardingTestAttemptReviewSerializer
        if self.action == 'retrieve':
            return OnboardingTestAttemptDetailSerializer
        return OnboardingTestAttemptResultSerializer

    @transaction.atomic
    @extend_schema(description="Створює спробу тесту: починає відлік часу і тд.")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user

        anon_token = request.COOKIES.get('anon_test_token')
        ta_qs = OnboardingTestAttempt.objects.filter(
            Q(anonymous_token=anon_token, assignment_id=data['assignment_id']) |
            Q(email=data["email"], assignment_id=data['assignment_id'])
        )
        if user.is_authenticated:
            ta_qs = ta_qs.filter(
                Q(student=user, assignment_id=data['assignment_id']) |
                Q(email=user.email, assignment_id=data['assignment_id'])
            )
        if ta_qs.exists():
            ta = ta_qs.first()
            return Response({
                "detail": "You have already started this test.",
                "test_data": {
                    **OnboardingTestAttemptDetailSerializer(instance=ta).data
                }
            }, status=409)

        if not anon_token:
            anon_token = str(uuid4())

        tass_qs = (TestAssignment.objects
                   .filter(id=data['assignment_id'], lesson__isnull=True, material__isnull=True, group__isnull=True)
                   .select_related('test__current_version', 'pinned_version'))
        if not tass_qs.exists():
            return Response({"detail": "Assignment not found"}, status=404)

        assignment = tass_qs.first()

        if assignment.lesson or assignment.material or assignment.group:
            return Response({
                "detail": "Test cannot be passed as onboarding test because it has link to object."
            }, status=400)

        version = assignment.actual_version

        if not version:
            return Response({"detail": "This test is not ready yet (no active version)."}, status=400)

        if version.status != 'published':
            return Response({"detail": "Test version is not published."}, status=400)

        if assignment.starting_at and assignment.starting_at > timezone.now():
            return Response({"detail": "Test is not started yet."}, status=400)

        att_data = {
            "anonymous_token": anon_token,
            "test_version": version,
            "assignment": assignment,
            "status": TestAttemptStatus.IN_PROGRESS,
        }
        if user.is_authenticated:
            att_data["name"] = user.full_name
            att_data["email"] = user.email
            att_data["student"] = user
        else:
            att_data["name"] = data["name"]
            att_data["email"] = data["email"]

        attempt = OnboardingTestAttempt.objects.create(**att_data)

        time_limit = assignment.custom_time_limit or version.time_limit_minutes
        deadline = None
        if time_limit:
            deadline = attempt.started_at + timedelta(minutes=time_limit)

        response = Response({
            "attempt_id": attempt.id,
            "started_at": attempt.started_at,
            "deadline": deadline,
            "time_limit_minutes": time_limit
        }, status=201)

        response.set_cookie(
            key='anon_test_token',
            value=str(anon_token),
            httponly=True,
            samesite='Lax',
            secure=not settings.DEBUG,
            max_age=60 * 60 * 24 * 365
        )

        return response

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def finish(self, request, pk=None):
        attempt = self.get_object()

        if attempt.status != TestAttemptStatus.IN_PROGRESS:
            return Response({"detail": "This test is finished."}, status=400)

        finish_time = timezone.now()
        version = attempt.test_version
        assignment = attempt.assignment
        time_limit = assignment.custom_time_limit or version.time_limit_minutes

        actual_status = TestAttemptStatus.COMPLETED
        if time_limit:
            max_allowed_time = attempt.started_at + timedelta(minutes=time_limit) + timedelta(minutes=2)
            if finish_time > max_allowed_time:
                actual_status = TestAttemptStatus.TIMED_OUT

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data['answers']

        questions_map = {q.id: q for q in version.questions.all()}
        total_score = _rate_and_save_students_answers(attempt, answers_data, questions_map)
        total_possible_score = sum(q.points for q in questions_map.values())

        attempt.finished_at = finish_time
        attempt.status = actual_status
        attempt.score = total_score
        attempt.max_possible_score = total_possible_score

        if total_possible_score > 0:
            percentage = (total_score / total_possible_score) * 100
            pass_threshold = assignment.custom_passing_score or version.passing_score_percent
            attempt.is_passed = percentage >= pass_threshold

        attempt.save()

        return Response(OnboardingTestAttemptResultSerializer(attempt).data)

    @action(detail=True, methods=['get'])
    def review(self, request, pk=None):
        attempt = self.get_object()

        anon_token = request.COOKIES.get('anon_test_token')
        if (not anon_token) or (anon_token and attempt.anonymous_token != UUID(anon_token)):
            return Response({"detail": "Forbidden West."}, status=403)

        if attempt.status == TestAttemptStatus.IN_PROGRESS:
            return Response({"detail": "Спочатку завершіть тест."}, status=400)

        if not attempt.assignment.show_answers:
            return Response({"detail": "Відповіді до цієї спроби недоступні."})

        serializer = self.get_serializer(attempt)
        return Response(serializer.data)


@extend_schema(tags=["TestManagement/Test Review"])
class StudentAnswerViewSet(mixins.UpdateModelMixin, GenericViewSet):
    queryset = StudentAnswer.objects.all()
    permission_classes = [HasPermission, IsNotStudent]
    serializer_class = StudentAnswerGradeSerializer

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = StudentAnswerFilterSet
    ordering_fields = ['id', 'score_awarded']

    def get_queryset(self):
        return StudentAnswerQueryPolicy.for_user(self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        answer = serializer.save()

        attempt = answer.attempt
        total = attempt.answers.aggregate(sum_score=models.Sum('score_awarded'))['sum_score'] or 0.0

        if attempt.max_possible_score > 0:
            percentage = (total / attempt.max_possible_score) * 100
            pass_threshold = attempt.assignment.custom_passing_score or attempt.test_version.passing_score_percent
            attempt.is_passed = percentage >= pass_threshold

        attempt.save()


@extend_schema(tags=["TestManagement/Onboarding Test Review"])
class OnboardingStudentAnswerViewSet(mixins.UpdateModelMixin, GenericViewSet):
    queryset = OnboardingStudentAnswer.objects.all()
    serializer_class = OnboardingStudentAnswerGradeSerializer
    permission_classes = [HasPermission]
    required_permissions = ['tests.manage_onboardings']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = OnboardingStudentAnswerFilterSet
    ordering_fields = ['id', 'score_awarded']

    @transaction.atomic
    def perform_update(self, serializer):
        answer = serializer.save()

        attempt = answer.attempt
        total = attempt.answers.aggregate(sum_score=models.Sum('score_awarded'))['sum_score'] or 0.0

        attempt.score = total

        if attempt.max_possible_score > 0:
            percentage = (total / attempt.max_possible_score) * 100
            pass_threshold = attempt.assignment.custom_passing_score or attempt.test_version.passing_score_percent
            attempt.is_passed = percentage >= pass_threshold

        attempt.save()


@extend_schema(tags=["TestManagement/Students Answers"])
class TeacherAttemptViewSet(ReadOnlyModelViewSet):
    queryset = TestAttempt.objects.all().select_related(
        'student',
        'test_version',
        'test_version__test',
        'assignment'
    ).order_by('-finished_at')

    permission_classes = [HasPermission, IsNotStudent]

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TestAttemptFilterSet
    ordering_fields = ['id', 'finished_at', 'started_at', 'duration', 'grade__value']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TestAttemptReviewSerializer
        return TeacherAttemptListSerializer

    def get_queryset(self):
        return TestAttemptQueryPolicy.for_user(self.request.user)


@extend_schema(tags=["TestManagement/Onboarding Students Answers"])
class OnboardingTeacherAttemptViewSet(ReadOnlyModelViewSet):
    queryset = OnboardingTestAttempt.objects.all().select_related(
        'student',
        'test_version',
        'test_version__test',
        'assignment'
    ).order_by('-finished_at')

    permission_classes = [HasPermission]
    required_permissions = ['tests.manage_onboardings']

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = OnboardingTestAttemptFilterSet
    ordering_fields = ['id', 'finished_at', 'started_at', 'duration', 'score']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OnboardingTestAttemptReviewSerializer
        return TeacherOnboardingAttemptListSerializer


### LINK SHARING
@extend_schema(tags=["TestManagement/Link Access"])
class TestAssignmentInfoViewSet(mixins.RetrieveModelMixin, GenericViewSet):
    queryset = TestAssignment.objects.select_related(
        'test',
        'test__current_version',
        'pinned_version',
        'group'
    ).all()

    serializer_class = PublicTestAssignmentSerializer

    lookup_field = 'public_uid'

    permission_classes = [AllowAny, CanViewAssignmentInfo]
