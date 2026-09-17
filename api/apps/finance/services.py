from django.db import transaction
from decimal import Decimal

from apps.finance.models import Transaction, TransactionType, SchoolBalance, CompanyBalance


class PnlService:

    @staticmethod
    def _get_wallet(school, currency):
        if school:
            wallet, _ = SchoolBalance.objects.select_for_update().get_or_create(
                school=school, currency=currency, defaults={'balance': Decimal('0.00')}
            )
        else:
            wallet, _ = CompanyBalance.objects.select_for_update().get_or_create(
                currency=currency, defaults={'balance': Decimal('0.00')}
            )
        return wallet

    @staticmethod
    def _revert_balance(txn_type, amount, school, currency):
        wallet = PnlService._get_wallet(school, currency)
        if txn_type == TransactionType.INCOME:
            wallet.balance -= amount
        elif txn_type == TransactionType.EXPENSE:
            wallet.balance += amount
        wallet.save(update_fields=['balance'])

    @staticmethod
    def _apply_balance(txn_type, amount, school, currency):
        wallet = PnlService._get_wallet(school, currency)
        if txn_type == TransactionType.INCOME:
            wallet.balance += amount
        elif txn_type == TransactionType.EXPENSE:
            wallet.balance -= amount
        wallet.save(update_fields=['balance'])

    @staticmethod
    def create_transaction(amount, type_, currency, school=None, **kwargs):
        with transaction.atomic():
            txn = Transaction.objects.create(
                amount=amount, type=type_, currency=currency, school=school, **kwargs
            )
            PnlService._apply_balance(type_, amount, school, currency)
            return txn

    @staticmethod
    def update_transaction(transaction_instance, **validated_data):
        with transaction.atomic():
            PnlService._revert_balance(
                transaction_instance.type,
                transaction_instance.amount,
                transaction_instance.school,
                transaction_instance.currency
            )

            for attr, value in validated_data.items():
                setattr(transaction_instance, attr, value)
            transaction_instance.save()

            PnlService._apply_balance(
                transaction_instance.type,
                transaction_instance.amount,
                transaction_instance.school,
                transaction_instance.currency
            )

            return transaction_instance

    @staticmethod
    def delete_transaction(transaction_instance):
        with transaction.atomic():
            PnlService._revert_balance(
                transaction_instance.type,
                transaction_instance.amount,
                transaction_instance.school,
                transaction_instance.currency
            )
            transaction_instance.delete()
