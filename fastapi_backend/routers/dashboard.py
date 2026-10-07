from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user_id
from models import Card, Payment


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # 1. Total number of transactions
    # ---------------------------------------------------------
    total_transactions = (
        db.query(func.count(Payment.id))
        .filter(
            Payment.user_id == user_id,
        )
        .scalar()
        or 0
    )

    # ---------------------------------------------------------
    # 2. Total amount spent
    # Requirement: sum of ALL transactions
    # ---------------------------------------------------------
    total_amount_spent = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.user_id == user_id,
        )
        .scalar()
        or 0
    )

    # ---------------------------------------------------------
    # 3. Current month spending
    # ---------------------------------------------------------
    now = datetime.now()

    current_month_spending = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.user_id == user_id,
            func.year(Payment.created_at) == now.year,
            func.month(Payment.created_at) == now.month,
        )
        .scalar()
        or 0
    )

    # ---------------------------------------------------------
    # 4. Credit limit
    # Demo value because cards_card does not currently contain
    # a credit_limit column.
    # ---------------------------------------------------------
    credit_limit = 100000.00

    # ---------------------------------------------------------
    # 5. Available credit
    # ---------------------------------------------------------
    available_credit_limit = (
        credit_limit - float(total_amount_spent)
    )

    # Never return a negative available credit value.
    available_credit_limit = max(
        available_credit_limit,
        0,
    )

    # ---------------------------------------------------------
    # 6. Last 5 transactions
    #
    # OUTER JOIN is used instead of INNER JOIN so that a payment
    # is still returned even when its card row is missing.
    # ---------------------------------------------------------
    last_5_transactions = (
        db.query(Payment, Card)
        .outerjoin(
            Card,
            (Card.id == Payment.card_id)
            & (Card.user_id == user_id),
        )
        .filter(
            Payment.user_id == user_id,
        )
        .order_by(
            Payment.created_at.desc(),
        )
        .limit(5)
        .all()
    )

    transactions = []

    for payment, card in last_5_transactions:
        transactions.append(
            {
                "amount": float(payment.amount),
                "masked_card_number": (
                    card.masked_card_number
                    if card
                    else "**** **** **** ****"
                ),
                "date": payment.created_at,
                "status": payment.status,
            }
        )

    # ---------------------------------------------------------
    # Final response
    # ---------------------------------------------------------
    return {
        "total_transactions": total_transactions,
        "total_amount_spent": float(
            total_amount_spent
        ),
        "current_month_spending": float(
            current_month_spending
        ),
        "available_credit_limit": available_credit_limit,
        "last_5_transactions": transactions,
    }