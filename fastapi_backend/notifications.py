import logging
import os
import smtplib

from decimal import Decimal
from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv()

logger = logging.getLogger(__name__)


EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER,
)

EMAIL_USE_TLS = (
    os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
)


def send_email(
    recipient: str,
    subject: str,
    body: str,
) -> bool:
    """
    Send an email through the configured SMTP server.
    """

    if not recipient:
        logger.warning(
            "Email notification skipped: recipient email is empty."
        )
        return False

    if not EMAIL_HOST:
        logger.warning(
            "Email notification skipped: EMAIL_HOST is not configured."
        )
        return False

    try:
        message = EmailMessage()

        message["Subject"] = subject
        message["From"] = DEFAULT_FROM_EMAIL
        message["To"] = recipient

        message.set_content(body)

        with smtplib.SMTP(
            EMAIL_HOST,
            EMAIL_PORT,
            timeout=10,
        ) as smtp:

            if EMAIL_USE_TLS:
                smtp.starttls()

            smtp.login(
                EMAIL_HOST_USER,
                EMAIL_HOST_PASSWORD,
            )

            smtp.send_message(message)

        logger.info(
            "Email notification sent successfully to %s.",
            recipient,
        )

        return True

    except Exception:
        logger.exception(
            "Failed to send email notification to %s.",
            recipient,
        )

        return False


def send_high_value_transaction_notification(
    email: str,
    username: str,
    amount: Decimal,
    transaction_reference: str,
) -> bool:
    """
    Send an alert when a transaction exceeds ₹5000.
    """

    if amount <= Decimal("5000.00"):
        return False

    return send_email(
        recipient=email,
        subject="CardPay Alert: High-Value Transaction",
        body=(
            f"Hello {username},\n\n"
            f"A transaction of ₹{amount:.2f} was successfully "
            "processed on your CardPay account.\n\n"
            f"Transaction Reference: {transaction_reference}\n\n"
            "This alert was generated because the transaction "
            "amount exceeded ₹5,000.\n\n"
            "CardPay Payment Platform"
        ),
    )


def send_low_credit_notification(
    email: str,
    username: str,
    credit_limit: Decimal,
    available_credit: Decimal,
    available_percentage: Decimal,
) -> bool:
    """
    Send an alert when available credit falls below 10%.
    """

    if credit_limit <= Decimal("0.00"):
        return False

    return send_email(
        recipient=email,
        subject="CardPay Alert: Low Available Credit",
        body=(
            f"Hello {username},\n\n"
            "Your available credit has fallen below 10% "
            "of your credit limit.\n\n"
            f"Credit Limit: ₹{credit_limit:.2f}\n"
            f"Available Credit: ₹{available_credit:.2f}\n"
            f"Available Credit Percentage: "
            f"{available_percentage:.2f}%\n\n"
            "Please review your recent transactions.\n\n"
            "CardPay Payment Platform"
        ),
    )