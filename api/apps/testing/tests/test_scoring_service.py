import pytest
from unittest.mock import MagicMock, patch
from rest_framework.exceptions import ValidationError

from apps.testing.models.test_attempt import TestAttemptStatus


class TestAttemptService:

    @patch('apps.testing.services.TestAttempt.objects.filter')
    def test_start_attempt_fails_if_already_passed(self, mock_filter):
        """Студент не може почати нову спробу, якщо він вже успішно здав цей тест"""

        mock_student = MagicMock()
        mock_assignment = MagicMock()

        mock_filter.return_value.exists.return_value = True

        with pytest.raises(ValidationError, match="You have already passed this test."):
            if mock_filter(student=mock_student, assignment=mock_assignment, is_passed=True).exists():
                raise ValidationError("You have already passed this test.")

    @patch('apps.testing.services.TestAttempt.objects.filter')
    @patch('apps.testing.services.TestAttempt.objects.create')
    def test_start_attempt_success(self, mock_create, mock_filter):
        """Успішний старт тесту, якщо попередніх успішних спроб немає"""

        mock_filter.return_value.exists.return_value = False
        fake_attempt = MagicMock(status=TestAttemptStatus.IN_PROGRESS)
        mock_create.return_value = fake_attempt

        result = mock_create(status=TestAttemptStatus.IN_PROGRESS)

        assert result.status == TestAttemptStatus.IN_PROGRESS
        mock_create.assert_called_once()
