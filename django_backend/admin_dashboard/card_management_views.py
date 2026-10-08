from decimal import Decimal, InvalidOperation

from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_logs.models import AdminLog
from admin_logs.permissions import AuditAdminPermission
from cards.models import Card
from notifications.services import send_card_blocked_notification


# ============================================================
# BLOCK CARD
# ============================================================

class AdminCardBlockView(APIView):
    """
    Block a card.
    Admin only.
    """

    permission_classes = [AuditAdminPermission]

    def post(self, request, pk):
        card = get_object_or_404(
            Card,
            pk=pk,
        )

        # ----------------------------------------------------
        # ALREADY BLOCKED
        # ----------------------------------------------------

        if card.status == "BLOCKED":
            return Response(
                {
                    "message": "Card is already blocked.",
                    "card_id": card.id,
                    "status": card.status,
                },
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------------------
        # BLOCK CARD
        # ----------------------------------------------------

        card.status = "BLOCKED"

        card.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        # ----------------------------------------------------
        # SEND EMAIL NOTIFICATION
        # ----------------------------------------------------

        send_card_blocked_notification(
            user=card.user,
            masked_card_number=card.masked_card_number,
        )

        # ----------------------------------------------------
        # ADMIN AUDIT LOG
        # ----------------------------------------------------

        AdminLog.objects.create(
            admin_user=request.user,
            action="OTHER",
            description=(
                f"Card {card.id} was blocked by admin "
                f"{request.user.username}."
            ),
            object_id=str(card.id),
            ip_address=request.META.get(
                "REMOTE_ADDR"
            ),
        )

        return Response(
            {
                "message": "Card blocked successfully.",
                "card_id": card.id,
                "status": card.status,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# UNBLOCK CARD
# ============================================================

class AdminCardUnblockView(APIView):
    """
    Unblock a card.
    Admin only.
    """

    permission_classes = [AuditAdminPermission]

    def post(self, request, pk):
        card = get_object_or_404(
            Card,
            pk=pk,
        )

        # ----------------------------------------------------
        # ALREADY ACTIVE
        # ----------------------------------------------------

        if card.status == "ACTIVE":
            return Response(
                {
                    "message": "Card is already active.",
                    "card_id": card.id,
                    "status": card.status,
                },
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------------------
        # UNBLOCK CARD
        # ----------------------------------------------------

        card.status = "ACTIVE"

        card.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        # ----------------------------------------------------
        # ADMIN AUDIT LOG
        # ----------------------------------------------------

        AdminLog.objects.create(
            admin_user=request.user,
            action="OTHER",
            description=(
                f"Card {card.id} was unblocked by admin "
                f"{request.user.username}."
            ),
            object_id=str(card.id),
            ip_address=request.META.get(
                "REMOTE_ADDR"
            ),
        )

        return Response(
            {
                "message": "Card unblocked successfully.",
                "card_id": card.id,
                "status": card.status,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# UPDATE CREDIT LIMIT
# ============================================================

class AdminCardCreditLimitView(APIView):
    """
    Update a card's credit limit.
    Admin only.
    """

    permission_classes = [AuditAdminPermission]

    def patch(self, request, pk):
        card = get_object_or_404(
            Card,
            pk=pk,
        )

        raw_limit = request.data.get(
            "credit_limit"
        )

        # ----------------------------------------------------
        # REQUIRED FIELD
        # ----------------------------------------------------

        if raw_limit is None:
            return Response(
                {
                    "detail": (
                        "credit_limit is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # VALIDATE NUMBER
        # ----------------------------------------------------

        try:
            credit_limit = Decimal(
                str(raw_limit)
            )

        except (
            InvalidOperation,
            ValueError,
        ):
            return Response(
                {
                    "detail": (
                        "credit_limit must be "
                        "a valid number."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # VALIDATE NEGATIVE VALUE
        # ----------------------------------------------------

        if credit_limit < Decimal("0.00"):
            return Response(
                {
                    "detail": (
                        "credit_limit cannot "
                        "be negative."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # UPDATE CREDIT LIMIT
        # ----------------------------------------------------

        old_limit = card.credit_limit

        card.credit_limit = credit_limit

        card.save(
            update_fields=[
                "credit_limit",
                "updated_at",
            ]
        )

        # ----------------------------------------------------
        # ADMIN AUDIT LOG
        # ----------------------------------------------------

        AdminLog.objects.create(
            admin_user=request.user,
            action="OTHER",
            description=(
                f"Credit limit updated for card "
                f"{card.id} from {old_limit} "
                f"to {credit_limit} by admin "
                f"{request.user.username}."
            ),
            object_id=str(card.id),
            ip_address=request.META.get(
                "REMOTE_ADDR"
            ),
        )

        return Response(
            {
                "message": (
                    "Credit limit updated "
                    "successfully."
                ),
                "card_id": card.id,
                "credit_limit": card.credit_limit,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# CARD ACTIVITY
# ============================================================

class AdminCardActivityView(APIView):
    """
    View admin activity related to a specific card.
    Admin only.
    """

    permission_classes = [AuditAdminPermission]

    def get(self, request, pk):
        get_object_or_404(
            Card,
            pk=pk,
        )

        logs = (
            AdminLog.objects
            .filter(
                object_id=str(pk)
            )
            .select_related("admin_user")
            .order_by("-created_at")
        )

        data = [
            {
                "id": log.id,
                "action": log.action,
                "description": log.description,
                "admin_user": (
                    log.admin_user.username
                    if log.admin_user
                    else None
                ),
                "ip_address": log.ip_address,
                "created_at": log.created_at,
            }
            for log in logs
        ]

        return Response(
            {
                "card_id": pk,
                "activity": data,
            },
            status=status.HTTP_200_OK,
        )