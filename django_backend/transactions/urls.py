from django.urls import path

from .views import TransactionCSVExportView, TransactionListView


urlpatterns = [
    path(
        "",
        TransactionListView.as_view(),
        name="transaction-list",
    ),
     path(
        "export/",
        TransactionCSVExportView.as_view(),
        name="transaction-csv-export",
    ),
]