#!/bin/sh

set -e

if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "runserver" ]; then
    echo "--- Running Migrations ---"
    python manage.py migrate --noinput

    echo "--- Loading Fixtures ---"
    FIXTURES="01_auth.json 02_users.json 03_dictionaries.json 04_course_structure.json 05_materials_and_tasks.json 06_groups.json 07_gradebook_and_tests_base.json 08_lessons_and_assignments.json 09_grades_and_submissions.json"

    for fixture in $FIXTURES; do
        FILE_PATH="apps/core/fixtures/$fixture"

        if [ -f "$FILE_PATH" ]; then
            echo "⬇️ Завантаження $fixture..."
            python manage.py loaddata "$FILE_PATH"
        else
            echo "⚠️ Файл $FILE_PATH не знайдено, пропускаємо..."
        fi
    done

    echo "✅ Базу даних успішно ініціалізовано!"
else
    echo "--- Skipping Migrations for non-api service ---"
fi

echo "--- Starting Service ---"
exec "$@"
