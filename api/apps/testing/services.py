import json

from apps.testing.models import StudentAnswer, StudentAnswerItem, QuestionOption, TestAttempt, OnboardingStudentAnswer, \
    OnboardingStudentAnswerItem
from apps.testing.models.question import QuestionType


def calculate_question_score(question, selected_ids, text_response, question_options):
    correct_ids = {opt.id for opt in question_options if opt.is_correct}

    if question.type == QuestionType.SINGLE_CHOICE:
        if len(selected_ids) == 1 and selected_ids.issubset(correct_ids):
            return float(question.points)

    elif question.type == QuestionType.MULTIPLE_CHOICE:
        if selected_ids == correct_ids:
            return float(question.points)
        return 0.0

    elif question.type == QuestionType.OPEN_TEXT:
        return 0.0

    elif question.type == QuestionType.FILL_IN_THE_BLANK:
        return _calculate_fill_in_the_blank_score(question, text_response, question_options)

    elif question.type == QuestionType.MATCHING:
        return _calculate_matching_score(question, text_response, question_options)

    elif question.type == QuestionType.ORDERING:
        return _calculate_ordering_score(question, selected_ids, question_options)

    return 0.0


def _calculate_fill_in_the_blank_score(question, text_response, question_options):
    student_answers_map = {}
    try:
        student_answers_map = json.loads(text_response)
        student_answers_map = {k: v.strip().lower() for k, v in student_answers_map.items() if v}
    except (json.JSONDecodeError, TypeError):
        if text_response:
            student_answers_map = {"1": text_response.strip().lower()}

    correct_variants_map = {}
    valid_options = [opt for opt in question_options if opt.is_correct]

    for opt in valid_options:
        group_id = str(opt.blank_group_id) if opt.blank_group_id else "1"
        val = opt.option_text.strip().lower()

        if group_id not in correct_variants_map:
            correct_variants_map[group_id] = set()
        correct_variants_map[group_id].add(val)

    total_blanks_count = len(correct_variants_map) or 1
    points_per_blank = question.points / total_blanks_count

    current_points = 0.0
    for blank_idx, correct_set in correct_variants_map.items():
        student_val = student_answers_map.get(blank_idx)
        if student_val and student_val in correct_set:
            current_points += points_per_blank

    return round(current_points, 2)


def _calculate_matching_score(question, text_response, question_options):
    try:
        student_answers = json.loads(text_response)
    except (TypeError, json.JSONDecodeError):
        return 0.0

    correct_pairs = {
        str(opt.id): opt.match_pair_text.strip().lower()
        for opt in question_options
        if opt.match_pair_text
    }

    if not correct_pairs: return 0.0

    correct_count = 0
    for opt_id, student_val in student_answers.items():
        student_val_norm = str(student_val).strip().lower()

        if correct_pairs.get(opt_id) == student_val_norm:
            correct_count += 1

    return round((correct_count / len(correct_pairs)) * question.points, 2)


def _calculate_ordering_score(question, selected_ids, question_options):
    if not selected_ids: return 0.0

    ordered_options = sorted(
        [opt for opt in question_options if opt.correct_order is not None],
        key=lambda x: x.correct_order
    )

    expected_ids = [opt.id for opt in ordered_options]

    return float(question.points) if list(selected_ids) == expected_ids else 0.0


def get_options_by_question(all_options):
    options_by_question = {}
    for opt in all_options:
        if opt.question_id not in options_by_question:
            options_by_question[opt.question_id] = []
        options_by_question[opt.question_id].append(opt)
    return options_by_question


def _rate_and_save_students_answers(attempt, answers_data, questions_map):
    total_score = 0.0

    all_options = list(QuestionOption.objects.filter(question__in=questions_map.values()))
    options_by_question = get_options_by_question(all_options)

    for ans_item in answers_data:
        q_id = ans_item['question_id']
        question = questions_map.get(q_id)

        if not question:
            continue

        selected_ids = set(ans_item.get('selected_option_ids', []))
        text_resp = ans_item.get('text_response', '')

        question_options = options_by_question.get(q_id, [])

        score_awarded = calculate_question_score(
            question, selected_ids, text_resp, question_options
        )

        total_score += score_awarded

        save_student_answer(
            attempt, question, score_awarded, selected_ids, text_resp, question_options
        )

    return total_score


def save_student_answer(attempt, question, score, selected_ids, text_resp, question_options):
    if isinstance(attempt, TestAttempt):
        student_answer = StudentAnswer
        student_answer_item = StudentAnswerItem
    else:
        student_answer = OnboardingStudentAnswer
        student_answer_item = OnboardingStudentAnswerItem

    student_answer = student_answer.objects.create(
        attempt=attempt,
        question=question,
        score_awarded=score,
    )

    items_to_create = []

    if selected_ids:
        options_map = {opt.id: opt for opt in question_options}

        for opt_id in selected_ids:
            if opt_id in options_map:
                items_to_create.append(student_answer_item(
                    student_answer=student_answer,
                    selected_option=options_map[opt_id],
                    text_response=""
                ))

    if text_resp:
        items_to_create.append(student_answer_item(
            student_answer=student_answer,
            selected_option=None,
            text_response=text_resp
        ))

    if items_to_create:
        student_answer_item.objects.bulk_create(items_to_create)

    return student_answer
