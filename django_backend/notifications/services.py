import logging

from django.conf import settings
from django.core.mail import send_mail


logger = logging.getLogger(__name__)


def send_card_blocked_notification(
    user,
    masked_card_number: str,
) -> bool:
    """
    Send an email when an administrator blocks a card.
    """

    if not user.email:
        logger.warning(
            "Card-block notification skipped: user %s has no email.",
            user.id,
        )
        return False

    try:
        send_mail(
            subject="CardPay Alert: Your Card Has Been Blocked",
            message=(
                f"Hello {user.username},\n\n"
                f"Your card {masked_card_number} has been blocked "
                f"by an administrator.\n\n"
                "You will not be able to use this card for new "
                "payments while it is blocked.\n\n"
                "If you believe this was done incorrectly, "
                "please contact support.\n\n"
                "CardPay Payment Platform"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        logger.info(
            "Card-block notification sent to user %s.",
            user.id,
        )

        return True

    except Exception:
        logger.exception(
            "Failed to send card-block notification for user %s.",
            user.id,
        )

        return False