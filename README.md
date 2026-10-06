Credit Card Payment System
Full-stack Credit Card Payment System using React + Tailwind CSS, Django REST Framework, FastAPI, and MySQL.
Tech Stack
- Frontend: React, Vite, Tailwind CSS
- Backend: Django REST Framework, FastAPI
- Database: MySQL
- Authentication: JWT
- API Testing: Postman
- Deployment: Docker + Docker Compose
- Testing: Django TestCase, Pytest, Coverage.py
Main Features
Authentication
- User registration and login
- JWT access/refresh tokens
- Logout with refresh-token blacklisting
- Protected routes
- Password hashing
Card Management
- Add, view, and delete credit/debit cards
- Full card number is not stored
- Only masked number and last 4 digits are stored
- CVV is not stored
Payments
- Payment creation through FastAPI
- Initial status: PENDING
- Final status: SUCCESS or FAILED
- Unique transaction reference
- Card ownership validation
Transactions
- Transaction history
- Filter by status, amount, and date
- Admin CSV export
Admin
- Dashboard summary
- Manage users
- View cards
- View transactions
- Daily payment summary
- Admin activity logs
Project Structure
credit-card-system/
├── django_backend/
├── fastapi_backend/
├── frontend/
├── database/
├── postman/
├── screenshots/
├── docker-compose.yml
├── Dockerfile
└── README.md
Local Setup
1. Django
cd django_backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
Django:
http://localhost:8000
Django API docs:
http://localhost:8000/api/docs/
2. FastAPI
cd fastapi_backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
FastAPI:
http://localhost:8001
Swagger:
http://localhost:8001/docs
3. Frontend
cd frontend
npm install
npm run dev
Frontend:
http://localhost:5173
Docker
From the project root:
docker compose build
docker compose up -d
docker compose ps
Services:
Frontend  : http://localhost:5173
Django    : http://localhost:8000
FastApi  : http://localhost:8001/docs
MySQL     : localhost:3307
Important API Endpoints
Authentication
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/token/refresh/
GET  /api/auth/me/
POST /api/auth/logout/
Cards
GET    /api/cards/
POST   /api/cards/
DELETE /api/cards/{id}/
Payments
POST /api/payments/
GET  /api/payments/{id}
POST /api/payments/{id}/process
Transactions
GET /api/transactions/
GET /api/transactions/export/
Admin Dashboard
GET /api/admin-dashboard/summary/
GET /api/admin-dashboard/users/
GET /api/admin-dashboard/cards/
GET /api/admin-dashboard/transactions/
GET /api/admin-dashboard/transactions/export/
Database
Main tables:
authentication_user
cards_card
payments
admin_logs
Submission database dump:
database/credit_card_payment_db_submission.sql
Postman
Collection:
postman/Credit-Card-Payment-System.postman_collection.json
Testing
Django
.\django_backend\venv\Scripts\python.exe .\django_backend\manage.py test authentication.tests cards.tests
Verified:
11 tests passed
77% coverage
FastAPI
cd fastapi_backend
.\venv\Scripts\python.exe -m pytest tests -v
Verified:
8 tests passed
89% coverage
Security
- JWT authentication
- Password hashing
- Input validation
- ORM-based database access
- No full card-number storage
- No CVV storage
- Protected user/admin endpoints
Screenshots
Place final UI screenshots inside:
screenshots/
Recommended:
01_register.png
02_login.png
03_dashboard.png
04_cards.png
05_add_card.png
06_payment.png
07_payment_result.png
08_transactions.png
09_transaction_filters.png
10_admin_dashboard.png
Final Submission
- GitHub repository link
- Database dump
- Postman collection
- UI screenshots
- Admin credentials shared separately
Do not commit .env, passwords, JWT secrets, or other credentials to GitHub.