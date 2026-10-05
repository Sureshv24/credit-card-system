import csv

from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone

from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiTypes,
)

from rest_framework import generics
from admin_logs.permissions import AuditAdminPermission
from rest_framework.response import Response
from rest_framework.views import APIView

from cards.models import Card
from transactions.models import Transaction

from .serializers import (
    AdminCardSerializer,
    AdminDashboardSummarySerializer,
    AdminTransactionSerializer,
    AdminUserSerializer,
)


User = get_user_model()


class AdminDashboardSummaryView(APIView):
    """
    Admin-only dashboard summary.
    """

    permission_classes = [AuditAdminPermission]

    @extend_schema(
        responses=AdminDashboardSummarySerializer
    )
    def get(self, request):
        today = timezone.localdate()

        total_users = User.objects.count()
        total_cards = Card.objects.count()
        total_transactions = Transaction.objects.count()

        successful_transactions = Transaction.objects.filter(
            status="SUCCESS"
        ).count()

        pending_transactions = Transaction.objects.filter(
            status="PENDING"
        ).count()

        failed_transactions = Transaction.objects.filter(
            status="FAILED"
        ).count()

        total_amount = (
            Transaction.objects.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        successful_amount = (
            Transaction.objects.filter(
                status="SUCCESS"
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        today_transactions = Transaction.objects.filter(
            created_at__date=today
        )

        today_total = today_transactions.count()

        today_successful = today_transactions.filter(
            status="SUCCESS"
        ).count()

        today_pending = today_transactions.filter(
            status="PENDING"
        ).count()

        today_failed = today_transactions.filter(
            status="FAILED"
        ).count()

        today_amount = (
            today_transactions.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        return Response(
            {
                "users": total_users,
                "cards": total_cards,
                "transactions": total_transactions,
                "successful_transactions": successful_transactions,
                "pending_transactions": pending_transactions,
                "failed_transactions": failed_transactions,
                "total_amount": total_amount,
                "successful_amount": successful_amount,
                "daily_summary": {
                    "date": today,
                    "transactions": today_total,
                    "successful": today_successful,
                    "pending": today_pending,
                    "failed": today_failed,
                    "total_amount": today_amount,
                },
            }
        )


class AdminUserListView(generics.ListAPIView):
    """
    Admin-only user list.
    """

    permission_classes = [AuditAdminPermission]
    serializer_class = AdminUserSerializer

    queryset = User.objects.all().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        users = self.get_queryset()

        data = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "date_joined": user.date_joined,
            }
            for user in users
        ]

        serializer = self.get_serializer(data, many=True)

        return Response(serializer.data)


class AdminCardListView(generics.ListAPIView):
    """
    Admin-only card list.
    """

    permission_classes = [AuditAdminPermission]
    serializer_class = AdminCardSerializer

    queryset = Card.objects.all().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        cards = self.get_queryset()

        data = [
            {
                "id": card.id,
                "user_id": card.user_id,
                "card_type": card.card_type,
                "masked_card_number": card.masked_card_number,
                "last_four_digits": card.last_four_digits,
                "expiry_month": card.expiry_month,
                "expiry_year": card.expiry_year,
                "created_at": card.created_at,
            }
            for card in cards
        ]

        serializer = self.get_serializer(data, many=True)

        return Response(serializer.data)


class AdminTransactionListView(generics.ListAPIView):
    """
    Admin-only transaction list.
    """

    permission_classes = [AuditAdminPermission]
    serializer_class = AdminTransactionSerializer

    queryset = Transaction.objects.all().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        transactions = self.get_queryset()

        data = [
            {
                "id": transaction.id,
                "user_id": transaction.user_id,
                "card_id": transaction.card_id,
                "amount": transaction.amount,
                "status": transaction.status,
                "transaction_reference": transaction.transaction_reference,
                "created_at": transaction.created_at,
                "updated_at": transaction.updated_at,
            }
            for transaction in transactions
        ]

        serializer = self.get_serializer(data, many=True)

        return Response(serializer.data)


class AdminTransactionExportView(APIView):
    """
    Admin-only CSV export.
    """

    permission_classes = [AuditAdminPermission]

    @extend_schema(
        responses={
            200: OpenApiResponse(
                description="CSV file containing all transactions.",
                response=OpenApiTypes.BINARY,
            )
        }
    )
    def get(self, request):
        transactions = Transaction.objects.all().order_by(
            "-created_at"
        )

        response = HttpResponse(
            content_type="text/csv"
        )

        response["Content-Disposition"] = (
            'attachment; filename="transactions.csv"'
        )

        writer = csv.writer(response)

        writer.writerow(
            [
                "ID",
                "User ID",
                "Card ID",
                "Amount",
                "Status",
                "Transaction Reference",
                "Created At",
            ]
        )

        for transaction in transactions:
            writer.writerow(
                [
                    transaction.id,
                    transaction.user_id,
                    transaction.card_id,
                    transaction.amount,
                    transaction.status,
                    transaction.transaction_reference,
                    transaction.created_at,
                ]
            )

        return response
