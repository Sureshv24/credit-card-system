from django.contrib import admin

from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    """
    Admin configuration for saved cards.
    """

    list_display = (
        "id",
        "user",
        "card_type",
        "masked_card_number",
        "last_four_digits",
        "expiry_month",
        "expiry_year",
        "created_at",
    )

    list_filter = (
        "card_type",
        "expiry_year",
        "created_at",
    )

    search_fields = (
        "masked_card_number",
        "last_four_digits",
        "user__username",
        "user__email",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "masked_card_number",
        "last_four_digits",
        "created_at",
        "updated_at",
    )