from django.urls import path

from .views import (
    AdminDashboardSummaryView,
    AdminUserListView,
    AdminCardListView,
    AdminTransactionListView,
    AdminTransactionExportView,
)

from .card_management_views import (
    AdminCardBlockView,
    AdminCardUnblockView,
    AdminCardCreditLimitView,
    AdminCardActivityView,
)


urlpatterns = [
    # Existing admin dashboard APIs
    path(
        "summary/",
        AdminDashboardSummaryView.as_view(),
        name="admin-summary",
    ),

    path(
        "users/",
        AdminUserListView.as_view(),
        name="admin-users",
    ),

    path(
        "cards/",
        AdminCardListView.as_view(),
        name="admin-cards",
    ),

    path(
        "transactions/",
        AdminTransactionListView.as_view(),
        name="admin-transactions",
    ),

    path(
        "transactions/export/",
        AdminTransactionExportView.as_view(),
        name="admin-transactions-export",
    ),

    # New card management APIs
    path(
        "cards/<int:pk>/block/",
        AdminCardBlockView.as_view(),
        name="admin-card-block",
    ),

    path(
        "cards/<int:pk>/unblock/",
        AdminCardUnblockView.as_view(),
        name="admin-card-unblock",
    ),

    path(
        "cards/<int:pk>/credit-limit/",
        AdminCardCreditLimitView.as_view(),
        name="admin-card-credit-limit",
    ),

    path(
        "cards/<int:pk>/activity/",
        AdminCardActivityView.as_view(),
        name="admin-card-activity",
    ),
]