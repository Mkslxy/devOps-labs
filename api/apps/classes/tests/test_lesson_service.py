import pytest
from unittest.mock import MagicMock

from apps.testing.services import calculate_question_score
from apps.testing.models.question import QuestionType


class TestScoringService:

    def test_calculate_single_choice_correct(self):
        """Перевірка правильної відповіді на Single Choice"""
        mock_question = MagicMock(type=QuestionType.SINGLE_CHOICE, points=10.0)

        opt1 = MagicMock(id=1, is_correct=False)
        opt2 = MagicMock(id=2, is_correct=True)
        options = [opt1, opt2]

        selected_ids = {2}  # Студент вибрав правильний варіант

        score = calculate_question_score(mock_question, selected_ids, "", options)

        assert score == 10.0

    def test_calculate_single_choice_incorrect(self):
        """Перевірка неправильної відповіді на Single Choice (0 балів)"""
        mock_question = MagicMock(type=QuestionType.SINGLE_CHOICE, points=10.0)

        opt1 = MagicMock(id=1, is_correct=False)
        opt2 = MagicMock(id=2, is_correct=True)
        options = [opt1, opt2]

        selected_ids = {1}

        score = calculate_question_score(mock_question, selected_ids, "", options)

        assert score == 0.0

    def test_calculate_multiple_choice_exact_match(self):
        """Перевірка Multiple Choice (повний збіг = повний бал)"""
        mock_question = MagicMock(type=QuestionType.MULTIPLE_CHOICE, points=5.0)

        opt1 = MagicMock(id=1, is_correct=True)
        opt2 = MagicMock(id=2, is_correct=True)
        opt3 = MagicMock(id=3, is_correct=False)
        options = [opt1, opt2, opt3]

        selected_ids = {1, 2}

        score = calculate_question_score(mock_question, selected_ids, "", options)

        assert score == 5.0

    def test_calculate_multiple_choice_partial_fails(self):
        """Перевірка Multiple Choice (частковий збіг дає 0 балів згідно з логікою)"""
        mock_question = MagicMock(type=QuestionType.MULTIPLE_CHOICE, points=5.0)

        opt1 = MagicMock(id=1, is_correct=True)
        opt2 = MagicMock(id=2, is_correct=True)
        options = [opt1, opt2]

        selected_ids = {1}

        score = calculate_question_score(mock_question, selected_ids, "", options)

        assert score == 0.0
