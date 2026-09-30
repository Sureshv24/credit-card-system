from rest_framework import serializers

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "user_id",
            "card_id",
            "amount",
            "status",
            "transaction_reference",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "card_id",
            "amount",
            "status",
            "transaction_reference",
            "created_at",
            "updated_at",
        ]