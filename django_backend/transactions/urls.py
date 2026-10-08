from django.urls import path

from .views import (
    MonthlyStatementPDFView,
    TransactionCSVExportView,
    TransactionListView,
)


urlpatterns = [
    path(
        "",
        TransactionListView.as_view(),
        name="transaction-list",
    ),

    path(
        "monthly-statement/",
        MonthlyStatementPDFView.as_view(),
        name="monthly-statement",
    ),

    path(
        "export/",
        TransactionCSVExportView.as_view(),
        name="transaction-export",
    ),
]