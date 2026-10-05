import csv

from django.db.models import DateField
from django.db.models.functions import Cast
from django.http import HttpResponse

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)

from .models import Transaction
from .serializers import TransactionSerializer


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="status",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description=(
                "Filter transactions by status: "
                "PENDING, SUCCESS, or FAILED."
            ),
            required=False,
        ),
        OpenApiParameter(
            name="min_amount",
            type=OpenApiTypes.DECIMAL,
            location=OpenApiParameter.QUERY,
            description=(
                "Filter transactions with amount "
                "greater than or equal to this value."
            ),
            required=False,
        ),
        OpenApiParameter(
            name="max_amount",
            type=OpenApiTypes.DECIMAL,
            location=OpenApiParameter.QUERY,
            description=(
                "Filter transactions with amount "
                "less than or equal to this value."
            ),
            required=False,
        ),
        OpenApiParameter(
            name="start_date",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="Filter transactions from this date.",
            required=False,
        ),
        OpenApiParameter(
            name="end_date",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="Filter transactions up to this date.",
            required=False,
        ),
    ]
)
class TransactionListView(generics.ListAPIView):
    """
    Display transaction history for the authenticated user
    with optional filters for status, amount, and date.
    """

    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(
            user_id=self.request.user.id
        )

        # ---------------------------------------------------------
        # Status filter
        # ---------------------------------------------------------
        status_value = self.request.query_params.get("status")

        if status_value:
            queryset = queryset.filter(
                status=status_value.upper()
            )

        # ---------------------------------------------------------
        # Minimum amount filter
        # ---------------------------------------------------------
        min_amount = self.request.query_params.get("min_amount")

        if min_amount:
            queryset = queryset.filter(
                amount__gte=min_amount
            )

        # ---------------------------------------------------------
        # Maximum amount filter
        # ---------------------------------------------------------
        max_amount = self.request.query_params.get("max_amount")

        if max_amount:
            queryset = queryset.filter(
                amount__lte=max_amount
            )

        # ---------------------------------------------------------
        # Convert created_at to DATE
        #
        # This avoids the date filtering issue with the shared
        # FastAPI payments table and MySQL DateTime field.
        # ---------------------------------------------------------
        queryset = queryset.annotate(
            created_date=Cast(
                "created_at",
                output_field=DateField(),
            )
        )

        # ---------------------------------------------------------
        # Start date filter
        # ---------------------------------------------------------
        start_date = self.request.query_params.get("start_date")

        if start_date:
            queryset = queryset.filter(
                created_date__gte=start_date
            )

        # ---------------------------------------------------------
        # End date filter
        # ---------------------------------------------------------
        end_date = self.request.query_params.get("end_date")

        if end_date:
            queryset = queryset.filter(
                created_date__lte=end_date
            )

        return queryset


class TransactionCSVExportView(APIView):
    """
    Export all transactions as a CSV file.
    Only admin/staff users are allowed.
    """

    permission_classes = [
        IsAuthenticated,
        IsAdminUser,
    ]

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
                "Updated At",
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
                    transaction.updated_at,
                ]
            )

        return response