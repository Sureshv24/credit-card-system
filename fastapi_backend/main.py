from fastapi import Depends, FastAPI

from database import Base, engine
from dependencies import get_current_user_id
from models import Payment
from routers.payments import router as payment_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Credit Card Payment API",
    description="Payment processing service",
    version="1.0.0",
)


app.include_router(payment_router)


@app.get("/")
def root():
    return {
        "message": "Credit Card Payment API is running"
    }


