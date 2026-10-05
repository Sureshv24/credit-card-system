from django.conf import settings
from django.db import models


class AdminLog(models.Model):
    ACTION_CHOICES = [
    ("LOGIN", "Login"),
    ("LOGOUT", "Logout"),
    ("VIEW_SUMMARY", "View Summary"),
    ("VIEW_USERS", "View Users"),
    ("VIEW_CARDS", "View Cards"),
    ("VIEW_TRANSACTIONS", "View Transactions"),
    ("EXPORT_TRANSACTIONS", "Export Transactions"),
    ("OTHER", "Other"),
]

    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_logs",
    )

    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    object_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )

    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "admin_logs"
        ordering = ["-created_at"]

    def __str__(self):
        username = (
            self.admin_user.username
            if self.admin_user
            else "Unknown Admin"
        )

        return f"{username} - {self.action} - {self.created_at}"