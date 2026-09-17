from datetime import timedelta, UTC, datetime, date
from unittest.mock import MagicMock, patch

from apps.users.models.reset_code import ResetCode
from apps.users.utils import years_ago, set_auth_cookies


class TestUsersLogic:

    def test_reset_code_generation_length(self):
        """Перевірка, що ResetCode.generate_code() завжди видає код з цифр потрібної довжини"""
        code_6 = ResetCode.generate_code(length=6)
        assert len(code_6) == 6
        assert code_6.isdigit()

        code_10 = ResetCode.generate_code(length=10)
        assert len(code_10) == 10
        assert code_10.isdigit()

    def test_reset_code_is_valid(self):
        """Перевірка логіки експірації коду скидання пароля"""
        reset_code = ResetCode(code="123456")
        reset_code.user_id = 1

        reset_code.expire_at = datetime.now(UTC) + timedelta(minutes=5)
        assert reset_code.is_valid() is True

        reset_code.expire_at = datetime.now(UTC) - timedelta(minutes=5)
        assert reset_code.is_valid() is False

    def test_years_ago_util(self):
        """Перевірка функції years_ago на коректність віднімання років"""
        today = date.today()
        past_date = years_ago(10)

        assert today.year - past_date.year in [9, 10]
        if today.month == 2 and today.day == 29:
            assert past_date.day == 28

    @patch('apps.users.utils.settings')
    def test_set_auth_cookies(self, mock_settings):
        """Перевірка, що set_auth_cookies правильно налаштовує параметри JWT кук"""
        mock_settings.SIMPLE_JWT = {
            'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
            'REFRESH_TOKEN_LIFETIME': timedelta(days=1)
        }
        mock_settings.DEBUG = False

        mock_response = MagicMock()

        set_auth_cookies(mock_response, "access_token_123", "refresh_token_456")

        assert mock_response.set_cookie.call_count == 2

        call_args_access = mock_response.set_cookie.call_args_list[0][1]

        assert call_args_access['key'] == 'access-token'
        assert call_args_access['value'] == "access_token_123"
        assert call_args_access['httponly'] is True
        assert call_args_access['secure'] is True
