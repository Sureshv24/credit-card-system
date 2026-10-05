from django.urls import path

from .views import (
    AdminDashboardSummaryView,
    AdminUserListView,
    AdminCardListView,
    AdminTransactionListView,
    AdminTransactionExportView,
)


urlpatterns = [
    path(
        "summary/",
        AdminDashboardSummaryView.as_view(),
        name="admin-dashboard-summary",
    ),

    path(
        "users/",
        AdminUserListView.as_view(),
        name="admin-user-list",
    ),

    path(
        "cards/",
        AdminCardListView.as_view(),
        name="admin-card-list",
    ),

    path(
        "transactions/",
        AdminTransactionListView.as_view(),
        name="admin-transaction-list",
    ),

    path(
        "transactions/export/",
        AdminTransactionExportView.as_view(),
        name="admin-transaction-export",
    ),
]
