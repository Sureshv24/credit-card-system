from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from models import Payment
from routers.payments import router as payment_router


# Create database tables if they do not already exist.
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Credit Card Payment API",
    description="Payment processing service",
    version="1.0.0",
)


# Allow the React frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Payment routes
app.include_router(payment_router)


@app.get("/")
def root():
    return {
        "message": "Credit Card Payment API is running"
    }
