from django.db import models


class Transaction(models.Model):
    """
    Django representation of the FastAPI payments table.

    This model does not create or modify the table.
    It reads the existing payments table created by FastAPI.
    """

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    ]

    id = models.IntegerField(
        primary_key=True,
    )

    user_id = models.IntegerField(
        db_index=True,
    )

    card_id = models.IntegerField(
        db_index=True,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
    )

    transaction_reference = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
    )

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "payments"
        ordering = ["-created_at"]

    def __str__(self):
        return self.transaction_reference