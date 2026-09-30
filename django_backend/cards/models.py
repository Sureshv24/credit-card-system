from django.conf import settings
from django.db import models


class Card(models.Model):
    """
    Stores safe, non-sensitive information about a user's card.

    Full card number and CVV are intentionally NOT stored.
    """

    CARD_TYPE_CHOICES = [
        ("credit", "Credit"),
        ("debit", "Debit"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cards",
    )

    card_type = models.CharField(
        max_length=10,
        choices=CARD_TYPE_CHOICES,
    )

    masked_card_number = models.CharField(
        max_length=19,
    )

    last_four_digits = models.CharField(
        max_length=4,
    )

    expiry_month = models.PositiveSmallIntegerField()

    expiry_year = models.PositiveSmallIntegerField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.card_type.title()} **** {self.last_four_digits}"