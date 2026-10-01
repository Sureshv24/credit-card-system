from datetime import datetime, time, timedelta

from django.contrib import admin
from django.db.models import Count, Q, Sum
from django.utils import timezone

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """
    Admin configuration for transactions.

    Transactions are created and managed by the FastAPI payment service.
    Django Admin is read-only for these records.
    """

    change_list_template = (
        "admin/transactions/transaction/change_list.html"
    )

    list_display = (
        "id",
        "user_id",
        "card_id",
        "amount",
        "status",
        "transaction_reference",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "transaction_reference",
        "user_id",
        "card_id",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "id",
        "user_id",
        "card_id",
        "amount",
        "status",
        "transaction_reference",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        """
        Display the daily payment summary above the transaction list.
        """

        today = timezone.localdate()
        current_timezone = timezone.get_current_timezone()

        start_of_day = timezone.make_aware(
            datetime.combine(today, time.min),
            current_timezone,
        )

        start_of_next_day = start_of_day + timedelta(days=1)

        today_transactions = Transaction.objects.filter(
            created_at__gte=start_of_day,
            created_at__lt=start_of_next_day,
        )

        summary = today_transactions.aggregate(
            total_transactions=Count("id"),

            successful_transactions=Count(
                "id",
                filter=Q(status="SUCCESS"),
            ),

            failed_transactions=Count(
                "id",
                filter=Q(status="FAILED"),
            ),

            pending_transactions=Count(
                "id",
                filter=Q(status="PENDING"),
            ),

            total_amount=Sum("amount"),

            successful_amount=Sum(
                "amount",
                filter=Q(status="SUCCESS"),
            ),
        )

        extra_context = extra_context or {}

        extra_context["daily_summary"] = summary
        extra_context["summary_date"] = today

        return super().changelist_view(
            request,
            extra_context=extra_context,
        )