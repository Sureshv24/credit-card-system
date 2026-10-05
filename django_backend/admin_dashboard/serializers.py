from rest_framework import serializers


class AdminDailySummarySerializer(serializers.Serializer):
    date = serializers.DateField()
    transactions = serializers.IntegerField()
    successful = serializers.IntegerField()
    pending = serializers.IntegerField()
    failed = serializers.IntegerField()
    total_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )


class AdminDashboardSummarySerializer(serializers.Serializer):
    users = serializers.IntegerField()
    cards = serializers.IntegerField()
    transactions = serializers.IntegerField()
    successful_transactions = serializers.IntegerField()
    pending_transactions = serializers.IntegerField()
    failed_transactions = serializers.IntegerField()
    total_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    successful_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    daily_summary = AdminDailySummarySerializer()


class AdminUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField(
        allow_blank=True,
        allow_null=True,
    )
    is_active = serializers.BooleanField()
    is_staff = serializers.BooleanField()
    date_joined = serializers.DateTimeField()


class AdminCardSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    card_type = serializers.CharField()
    masked_card_number = serializers.CharField()
    last_four_digits = serializers.CharField()
    expiry_month = serializers.IntegerField()
    expiry_year = serializers.IntegerField()
    created_at = serializers.DateTimeField()


class AdminTransactionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    card_id = serializers.IntegerField()
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    status = serializers.CharField()
    transaction_reference = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
