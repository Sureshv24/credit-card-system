from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


User = get_user_model()


class AuthenticationTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_register_user(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "testuser",
                "email": "testuser@example.com",
                "phone_number": "9876543210",
                "password": "Test@12345",
                "password2": "Test@12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            User.objects.filter(email="testuser@example.com").exists()
        )

        user = User.objects.get(email="testuser@example.com")
        self.assertTrue(user.check_password("Test@12345"))

    def test_register_password_mismatch(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "testuser",
                "email": "testuser@example.com",
                "phone_number": "9876543210",
                "password": "Test@12345",
                "password2": "Different@12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_login_user(self):
        User.objects.create_user(
            username="loginuser",
            email="login@example.com",
            password="Test@12345",
        )

        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "loginuser",
                "password": "Test@12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_authenticated(self):
        user = User.objects.create_user(
            username="meuser",
            email="me@example.com",
            password="Test@12345",
        )

        self.client.force_authenticate(user=user)

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "meuser")
        self.assertEqual(response.data["email"], "me@example.com")
