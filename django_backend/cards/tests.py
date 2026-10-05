from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Card


User = get_user_model()


class CardTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="carduser",
            email="card@example.com",
            password="Test@12345",
        )

        self.client.force_authenticate(user=self.user)

    def test_add_card_masks_card_number(self):
        response = self.client.post(
            "/api/cards/",
            {
                "card_type": "credit",
                "card_number": "4111111111111111",
                "expiry_month": 12,
                "expiry_year": 2030,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["last_four_digits"], "1111")
        self.assertEqual(
            response.data["masked_card_number"],
            "************1111",
        )

        card = Card.objects.get(user=self.user)

        self.assertEqual(card.last_four_digits, "1111")
        self.assertNotIn(
            "4111111111111111",
            card.masked_card_number,
        )

    def test_invalid_card_number(self):
        response = self.client.post(
            "/api/cards/",
            {
                "card_type": "credit",
                "card_number": "ABC123",
                "expiry_month": 12,
                "expiry_year": 2030,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_expiry_month(self):
        response = self.client.post(
            "/api/cards/",
            {
                "card_type": "credit",
                "card_number": "4111111111111111",
                "expiry_month": 13,
                "expiry_year": 2030,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_list_user_cards(self):
        Card.objects.create(
            user=self.user,
            card_type="credit",
            masked_card_number="************1111",
            last_four_digits="1111",
            expiry_month=12,
            expiry_year=2030,
        )

        response = self.client.get("/api/cards/")

        self.assertEqual(response.status_code, 200)

        results = response.data["results"]

        self.assertEqual(len(results), 1)
        self.assertEqual(
            results[0]["last_four_digits"],
            "1111",
        )

    def test_delete_card(self):
        card = Card.objects.create(
            user=self.user,
            card_type="credit",
            masked_card_number="************1111",
            last_four_digits="1111",
            expiry_month=12,
            expiry_year=2030,
        )

        response = self.client.delete(f"/api/cards/{card.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Card.objects.filter(id=card.id).exists())

    def test_cards_require_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/cards/")

        self.assertEqual(response.status_code, 401)
