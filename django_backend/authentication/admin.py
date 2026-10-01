from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Admin configuration for application users.
    """

    list_display = (
        "id",
        "username",
        "email",
        "phone_number",
        "is_active",
        "is_staff",
        "created_at",
    )

    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
        "created_at",
    )

    search_fields = (
        "username",
        "email",
        "phone_number",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "Additional Information",
            {
                "fields": (
                    "phone_number",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Additional Information",
            {
                "fields": (
                    "email",
                    "phone_number",
                )
            },
        ),
    )