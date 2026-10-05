from rest_framework.permissions import IsAdminUser

from .models import AdminLog


class AuditAdminPermission(IsAdminUser):
    """
    Admin permission with audit logging.

    Every successful admin API access creates
    an entry in the admin_logs table.
    """

    def has_permission(self, request, view):
        allowed = super().has_permission(
            request,
            view
        )

        if not allowed:
            return False

        path = request.path

        if path.endswith("/summary/"):
            action = "VIEW_SUMMARY"
            description = (
                "Admin viewed dashboard summary."
            )

        elif path.endswith("/users/"):
            action = "VIEW_USERS"
            description = (
                "Admin viewed users list."
            )

        elif path.endswith("/cards/"):
            action = "VIEW_CARDS"
            description = (
                "Admin viewed cards list."
            )

        elif path.endswith("/transactions/"):
            action = "VIEW_TRANSACTIONS"
            description = (
                "Admin viewed transactions list."
            )

        elif path.endswith("/transactions/export/"):
            action = "EXPORT_TRANSACTIONS"
            description = (
                "Admin exported transactions CSV."
            )

        else:
            action = "OTHER"
            description = (
                f"Admin accessed {path}."
            )

        # Get client IP address
        ip_address = (
            request.META.get(
                "HTTP_X_FORWARDED_FOR"
            )
            or request.META.get(
                "REMOTE_ADDR"
            )
        )

        if ip_address and "," in ip_address:
            ip_address = (
                ip_address.split(",")[0]
                .strip()
            )

        AdminLog.objects.create(
            admin_user=request.user,
            action=action,
            description=description,
            ip_address=ip_address,
        )

        return True 