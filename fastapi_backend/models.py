from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


# ============================================================
# USER MODEL
# ============================================================

class User(Base):
    """
    Read-only representation of the Django authentication_user table.

    FastAPI uses this model only to retrieve:
    - username
    - email

    Passwords and other authentication fields are not used here.
    """

    __tablename__ = "authentication_user"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    username: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )


# ============================================================
# PAYMENT MODEL
# ============================================================

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    card_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        Enum(
            "PENDING",
            "SUCCESS",
            "FAILED",
            name="payment_status",
        ),
        nullable=False,
        default="PENDING",
    )

    transaction_reference: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ============================================================
# CARD MODEL
# ============================================================

class Card(Base):
    """
    Read-only representation of the Django Card table.

    FastAPI uses this model to validate:
    - card existence
    - card ownership
    - card status
    - credit limit

    Full card number and CVV are NOT stored.
    """

    __tablename__ = "cards_card"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    card_type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    masked_card_number: Mapped[str] = mapped_column(
        String(19),
        nullable=False,
    )

    last_four_digits: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
    )

    expiry_month: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    expiry_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # --------------------------------------------------------
    # Card status
    # --------------------------------------------------------

    status: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="ACTIVE",
    )

    # --------------------------------------------------------
    # Credit limit
    # --------------------------------------------------------

    credit_limit: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )