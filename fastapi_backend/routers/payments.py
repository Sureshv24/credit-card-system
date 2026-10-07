import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user_id
from models import Card, Payment
from schemas import PaymentCreate, PaymentResponse


router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
)


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
            detail="Card not found or does not belong to the authenticated user.",
        )

    transaction_reference = (
        f"TXN-{uuid.uuid4().hex[:12].upper()}"
    )

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


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(
    payment_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
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


@router.post(
    "/{payment_id}/process",
    response_model=PaymentResponse,
)
def process_payment(
    payment_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
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

    if payment.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending payments can be processed.",
        )

    payment.status = "SUCCESS"

    db.commit()
    db.refresh(payment)

    return payment