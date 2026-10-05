from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException

from routers.payments import (
    create_payment,
    get_payment,
    process_payment,
)
from schemas import PaymentCreate


class FakeQuery:
    def __init__(self, result):
        self.result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.result


class FakeDB:
    def __init__(self, query_results):
        self.query_results = query_results
        self.added = None

    def query(self, model):
        return FakeQuery(self.query_results.get(model))

    def add(self, obj):
        self.added = obj

    def commit(self):
        pass

    def refresh(self, obj):
        if obj.id is None:
            obj.id = 1


def test_payment_schema_valid():
    payment = PaymentCreate(
        card_id=1,
        amount=Decimal("150.50"),
    )

    assert payment.card_id == 1
    assert payment.amount == Decimal("150.50")


def test_payment_schema_rejects_negative_amount():
    with pytest.raises(Exception):
        PaymentCreate(
            card_id=1,
            amount=Decimal("-10.00"),
        )


def test_create_payment():
    from models import Card

    fake_card = SimpleNamespace(
        id=10,
        user_id=1,
    )

    db = FakeDB({
        Card: fake_card,
    })

    payment_data = PaymentCreate(
        card_id=10,
        amount=Decimal("250.00"),
    )

    result = create_payment(
        payment_data=payment_data,
        user_id=1,
        db=db,
    )

    assert result.user_id == 1
    assert result.card_id == 10
    assert result.amount == Decimal("250.00")
    assert result.status == "PENDING"
    assert result.transaction_reference.startswith("TXN-")


def test_create_payment_card_not_found():
    from models import Card

    db = FakeDB({
        Card: None,
    })

    payment_data = PaymentCreate(
        card_id=10,
        amount=Decimal("250.00"),
    )

    with pytest.raises(HTTPException) as exc:
        create_payment(
            payment_data=payment_data,
            user_id=1,
            db=db,
        )

    assert exc.value.status_code == 404


def test_get_payment():
    from models import Payment

    fake_payment = SimpleNamespace(
        id=1,
        user_id=1,
        card_id=10,
        amount=Decimal("100.00"),
        status="PENDING",
        transaction_reference="TXN-TEST123",
    )

    db = FakeDB({
        Payment: fake_payment,
    })

    result = get_payment(
        payment_id=1,
        user_id=1,
        db=db,
    )

    assert result.id == 1
    assert result.status == "PENDING"


def test_get_payment_not_found():
    from models import Payment

    db = FakeDB({
        Payment: None,
    })

    with pytest.raises(HTTPException) as exc:
        get_payment(
            payment_id=1,
            user_id=1,
            db=db,
        )

    assert exc.value.status_code == 404


def test_process_payment_success():
    from models import Payment

    fake_payment = SimpleNamespace(
        id=1,
        user_id=1,
        card_id=10,
        amount=Decimal("100.00"),
        status="PENDING",
        transaction_reference="TXN-TEST123",
    )

    db = FakeDB({
        Payment: fake_payment,
    })

    with patch(
        "routers.payments.random.choice",
        return_value="SUCCESS",
    ):
        result = process_payment(
            payment_id=1,
            user_id=1,
            db=db,
        )

    assert result.status == "SUCCESS"


def test_process_payment_not_pending():
    from models import Payment

    fake_payment = SimpleNamespace(
        id=1,
        user_id=1,
        card_id=10,
        amount=Decimal("100.00"),
        status="SUCCESS",
        transaction_reference="TXN-TEST123",
    )

    db = FakeDB({
        Payment: fake_payment,
    })

    with pytest.raises(HTTPException) as exc:
        process_payment(
            payment_id=1,
            user_id=1,
            db=db,
        )

    assert exc.value.status_code == 400
