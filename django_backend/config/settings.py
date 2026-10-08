"""
Django settings for config project.

Credit Card Payment System
Backend: Django + Django REST Framework
Database: MySQL
"""

import os
from pathlib import Path

from dotenv import load_dotenv


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(BASE_DIR / ".env")


# ============================================================
# SECURITY
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-development-key-change-this"
)

DEBUG = os.getenv("DEBUG", "True").lower() == "true"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")
    if host.strip()
]


# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    # Django built-in apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    

    # Third-party apps
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",

    # Project apps
    "authentication",
    "cards",
    "transactions",
    "admin_dashboard",
    "admin_logs",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URL CONFIGURATION
# ============================================================

ROOT_URLCONF = "config.urls"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# WSGI / ASGI
# ============================================================

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# ============================================================
# DATABASE - MYSQL
# ============================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3306"),

        "OPTIONS": {
            "charset": "utf8mb4",
        },

        "CONN_MAX_AGE": 60,
    }
}


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    # JWT authentication
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    # Protect APIs by default
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    # API documentation
    "DEFAULT_SCHEMA_CLASS": (
        "drf_spectacular.openapi.AutoSchema"
    ),

    # Pagination
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),

    "PAGE_SIZE": 10,

    # Security / validation
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}


# ============================================================
# JWT CONFIGURATION
# ============================================================

from datetime import timedelta

SIMPLE_JWT = {
    # Access token lifetime
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),

    # Refresh token lifetime
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),

    # Rotate refresh tokens
    "ROTATE_REFRESH_TOKENS": True,

    # Blacklist old refresh token after rotation
    "BLACKLIST_AFTER_ROTATION": True,

    # Authentication header
    "AUTH_HEADER_TYPES": ("Bearer",),

    # User identification
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",

    # Token signing
    "UPDATE_LAST_LOGIN": True,
}


# ============================================================
# API DOCUMENTATION
# ============================================================

SPECTACULAR_SETTINGS = {
    "TITLE": "Credit Card Payment System API",

    "DESCRIPTION": (
        "Secure REST API for the Credit Card Payment System. "
        "Includes authentication, card management, "
        "transactions and administrative functionality."
    ),

    "VERSION": "1.0.0",

    "SERVE_INCLUDE_SCHEMA": False,
}


# ============================================================
# CORS
# ============================================================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


# ============================================================
# CSRF TRUSTED ORIGINS
# ============================================================

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES
# ============================================================

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ============================================================
# MEDIA FILES
# ============================================================

MEDIA_URL = "media/"

MEDIA_ROOT = BASE_DIR / "media"


# ============================================================
# EMAIL CONFIGURATION
# ============================================================

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "authentication.User"



# ============================================================
# EMAIL CONFIGURATION
# ============================================================

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

EMAIL_USE_TLS = (
    os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
)

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER,
)