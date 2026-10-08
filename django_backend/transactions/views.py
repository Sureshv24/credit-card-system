import csv

from django.db.models import DateField
from django.db.models.functions import Cast
from django.http import FileResponse, HttpResponse

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Transaction
from .serializers import TransactionSerializer
from .statement_service import generate_monthly_statement


# ============================================================
# TRANSACTION HISTORY
# ============================================================

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

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        queryset = Transaction.objects.filter(
            user_id=self.request.user.id
        )

        # --------------------------------------------------------
        # STATUS FILTER
        # --------------------------------------------------------

        status_value = (
            self.request.query_params.get("status")
        )

        if status_value:
            queryset = queryset.filter(
                status=status_value.upper()
            )

        # --------------------------------------------------------
        # MINIMUM AMOUNT FILTER
        # --------------------------------------------------------

        min_amount = (
            self.request.query_params.get("min_amount")
        )

        if min_amount:
            queryset = queryset.filter(
                amount__gte=min_amount
            )

        # --------------------------------------------------------
        # MAXIMUM AMOUNT FILTER
        # --------------------------------------------------------

        max_amount = (
            self.request.query_params.get("max_amount")
        )

        if max_amount:
            queryset = queryset.filter(
                amount__lte=max_amount
            )

        # --------------------------------------------------------
        # CONVERT CREATED_AT TO DATE
        # --------------------------------------------------------

        queryset = queryset.annotate(
            created_date=Cast(
                "created_at",
                output_field=DateField(),
            )
        )

        # --------------------------------------------------------
        # START DATE FILTER
        # --------------------------------------------------------

        start_date = (
            self.request.query_params.get("start_date")
        )

        if start_date:
            queryset = queryset.filter(
                created_date__gte=start_date
            )

        # --------------------------------------------------------
        # END DATE FILTER
        # --------------------------------------------------------

        end_date = (
            self.request.query_params.get("end_date")
        )

        if end_date:
            queryset = queryset.filter(
                created_date__lte=end_date
            )

        return queryset


# ============================================================
# MONTHLY STATEMENT PDF
# ============================================================

class MonthlyStatementPDFView(APIView):
    """
    Generate and download a monthly statement PDF
    for the authenticated user.

    Query parameters:
        month: 1-12
        year: 2000-2100
    """

    permission_classes = [
        IsAuthenticated,
    ]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="month",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Statement month (1-12).",
                required=True,
            ),
            OpenApiParameter(
                name="year",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Statement year.",
                required=True,
            ),
        ],
        responses={
            200: OpenApiTypes.BINARY,
        },
    )
    def get(self, request):
        # --------------------------------------------------------
        # GET MONTH
        # --------------------------------------------------------

        month_value = request.query_params.get(
            "month"
        )

        if not month_value:
            return Response(
                {
                    "detail": "month is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            month = int(month_value)

        except (TypeError, ValueError):
            return Response(
                {
                    "detail": (
                        "month must be a valid number."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # VALIDATE MONTH
        # --------------------------------------------------------

        if month < 1 or month > 12:
            return Response(
                {
                    "detail": (
                        "month must be between 1 and 12."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # GET YEAR
        # --------------------------------------------------------

        year_value = request.query_params.get(
            "year"
        )

        if not year_value:
            return Response(
                {
                    "detail": "year is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            year = int(year_value)

        except (TypeError, ValueError):
            return Response(
                {
                    "detail": (
                        "year must be a valid number."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # VALIDATE YEAR
        # --------------------------------------------------------

        if year < 2000 or year > 2100:
            return Response(
                {
                    "detail": (
                        "year must be between "
                        "2000 and 2100."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # GENERATE PDF
        # --------------------------------------------------------

        try:
            pdf_buffer, filename = (
                generate_monthly_statement(
                    request.user,
                    year,
                    month,
                )
            )

        except Exception:
            return Response(
                {
                    "detail": (
                        "Unable to generate the "
                        "monthly statement."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --------------------------------------------------------
        # DOWNLOAD PDF
        # --------------------------------------------------------

        response = FileResponse(
            pdf_buffer,
            content_type="application/pdf",
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; filename="{filename}"'
        )

        return response


# ============================================================
# ADMIN TRANSACTION CSV EXPORT
# ============================================================

class TransactionCSVExportView(APIView):
    """
    Export all transactions as a CSV file.

    Only authenticated admin/staff users
    are allowed.
    """

    permission_classes = [
        IsAuthenticated,
        IsAdminUser,
    ]

    def get(self, request):
        transactions = (
            Transaction.objects
            .all()
            .order_by("-created_at")
        )

        response = HttpResponse(
            content_type="text/csv"
        )

        response[
            "Content-Disposition"
        ] = (
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