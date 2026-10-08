import uuid
from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user_id
from models import Card, Payment, User
from notifications import (
    send_high_value_transaction_notification,
    send_low_credit_notification,
)
from schemas import PaymentCreate, PaymentResponse


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
)


# ============================================================
# CREATE PAYMENT
# POST /api/payments/
# ============================================================

@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    payment_data: PaymentCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Create a new payment.

    Security:
    - User can only use their own card.
    - Blocked cards cannot be used.
    """

    card = (
        db.query(Card)
        .filter(
            Card.id == payment_data.card_id,
            Card.user_id == user_id,
        )
        .first()
    )

    if card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Card not found or does not belong "
                "to the authenticated user."
            ),
        )

    # --------------------------------------------------------
    # BLOCKED CARD CHECK
    # --------------------------------------------------------

    if card.status == "BLOCKED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This card is blocked and cannot be used "
                "for payments."
            ),
        )

    # --------------------------------------------------------
    # TRANSACTION REFERENCE
    # --------------------------------------------------------

    transaction_reference = (
        f"TXN-{uuid.uuid4().hex[:12].upper()}"
    )

    # --------------------------------------------------------
    # CREATE PAYMENT
    # --------------------------------------------------------

    payment = Payment(
        user_id=user_id,
        card_id=payment_data.card_id,
        amount=payment_data.amount,
        status="PENDING",
        transaction_reference=transaction_reference,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


# ============================================================
# GET PAYMENT
# GET /api/payments/{payment_id}
# ============================================================

@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(
    payment_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get a payment belonging to the authenticated user.
    """

    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
            Payment.user_id == user_id,
        )
        .first()
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    return payment


# ============================================================
# PROCESS PAYMENT
# POST /api/payments/{payment_id}/process
# ============================================================

@router.post(
    "/{payment_id}/process",
    response_model=PaymentResponse,
)
def process_payment(
    payment_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Process a pending payment.

    After successful processing:
    1. Payment becomes SUCCESS.
    2. High-value alert is checked.
    3. Available-credit percentage is calculated.
    4. Low-credit alert is checked.
    """

    # --------------------------------------------------------
    # FIND PAYMENT
    # --------------------------------------------------------

    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
            Payment.user_id == user_id,
        )
        .first()
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    # --------------------------------------------------------
    # ONLY PENDING PAYMENTS CAN BE PROCESSED
    # --------------------------------------------------------

    if payment.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending payments can be processed.",
        )

    # --------------------------------------------------------
    # GET CARD
    # --------------------------------------------------------

    card = (
        db.query(Card)
        .filter(
            Card.id == payment.card_id,
            Card.user_id == payment.user_id,
        )
        .first()
    )

    if card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment card not found.",
        )

    # --------------------------------------------------------
    # BLOCKED CARD CHECK
    # --------------------------------------------------------

    if card.status == "BLOCKED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This card is blocked and the payment "
                "cannot be processed."
            ),
        )

    # --------------------------------------------------------
    # GET USER
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == payment.user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment user not found.",
        )

    # --------------------------------------------------------
    # CREDIT LIMIT
    # --------------------------------------------------------

    credit_limit = Decimal(
        str(card.credit_limit or 0)
    )

    # --------------------------------------------------------
    # SUCCESSFUL SPENDING BEFORE THIS PAYMENT
    # --------------------------------------------------------

    successful_spending_before = (
        db.query(
            func.coalesce(
                func.sum(Payment.amount),
                0,
            )
        )
        .filter(
            Payment.card_id == card.id,
            Payment.user_id == user.id,
            Payment.status == "SUCCESS",
        )
        .scalar()
    )

    successful_spending_before = Decimal(
        str(
            successful_spending_before
            if successful_spending_before is not None
            else 0
        )
    )

    # --------------------------------------------------------
    # AVAILABLE CREDIT BEFORE PAYMENT
    # --------------------------------------------------------

    available_before = (
        credit_limit
        - successful_spending_before
    )

    if available_before < Decimal("0.00"):
        available_before = Decimal("0.00")

    # --------------------------------------------------------
    # MARK PAYMENT SUCCESSFUL
    # --------------------------------------------------------

    payment.status = "SUCCESS"

    db.commit()
    db.refresh(payment)

    # --------------------------------------------------------
    # SUCCESSFUL SPENDING AFTER THIS PAYMENT
    # --------------------------------------------------------

    successful_spending_after = (
        successful_spending_before
        + Decimal(str(payment.amount))
    )

    # --------------------------------------------------------
    # AVAILABLE CREDIT AFTER PAYMENT
    # --------------------------------------------------------

    available_after = (
        credit_limit
        - successful_spending_after
    )

    if available_after < Decimal("0.00"):
        available_after = Decimal("0.00")

    # ========================================================
    # EMAIL ALERT 1
    # TRANSACTION AMOUNT > ₹5000
    # ========================================================

    send_high_value_transaction_notification(
        email=user.email,
        username=user.username,
        amount=Decimal(str(payment.amount)),
        transaction_reference=payment.transaction_reference,
    )

    # ========================================================
    # EMAIL ALERT 2
    # AVAILABLE CREDIT < 10%
    # ========================================================

    if credit_limit > Decimal("0.00"):

        before_percentage = (
            available_before
            / credit_limit
        ) * Decimal("100")

        after_percentage = (
            available_after
            / credit_limit
        ) * Decimal("100")

        # Send notification only when the threshold
        # is crossed from 10% or above to below 10%.

        if (
            before_percentage >= Decimal("10.00")
            and after_percentage < Decimal("10.00")
        ):
            send_low_credit_notification(
                email=user.email,
                username=user.username,
                credit_limit=credit_limit,
                available_credit=available_after,
                available_percentage=after_percentage,
            )

    return payment