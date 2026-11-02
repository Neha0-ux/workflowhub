from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import WorkflowItem

User = get_user_model()


class AuthTests(APITestCase):
    def test_register_login_logout(self):
        response = self.client.post(
            "/api/auth/register/",
            {"username": "alice", "email": "alice@example.com", "password": "Str0ngPass!23"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)

        response = self.client.post(
            "/api/auth/login/", {"username": "alice", "password": "Str0ngPass!23"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data["token"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        response = self.client.get("/api/workflows/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_with_wrong_password_fails(self):
        User.objects.create_user(username="bob", password="Str0ngPass!23")
        response = self.client.post("/api/auth/login/", {"username": "bob", "password": "wrong"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WorkflowItemTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="Str0ngPass!23")
        self.other = User.objects.create_user(username="bob", password="Str0ngPass!23")
        self.client.force_authenticate(self.user)

    def test_crud(self):
        response = self.client.post(
            "/api/workflows/", {"title": "Write report", "description": "Task 1"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")
        item_id = response.data["id"]

        response = self.client.patch(f"/api/workflows/{item_id}/", {"status": "in_progress"})
        self.assertEqual(response.data["status"], "in_progress")

        response = self.client.put(
            f"/api/workflows/{item_id}/",
            {"title": "Write final report", "description": "Edited", "status": "completed"},
        )
        self.assertEqual(response.data["title"], "Write final report")

        response = self.client.get("/api/workflows/")
        self.assertEqual(len(response.data), 1)

        response = self.client.delete(f"/api/workflows/{item_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WorkflowItem.objects.exists())

    def test_invalid_status_rejected(self):
        response = self.client.post("/api/workflows/", {"title": "X", "status": "done"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_users_cannot_see_each_others_items(self):
        item = WorkflowItem.objects.create(owner=self.other, title="Bob's item")
        self.assertEqual(self.client.get("/api/workflows/").data, [])
        response = self.client.delete(f"/api/workflows/{item.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_by_status(self):
        WorkflowItem.objects.create(owner=self.user, title="A", status="pending")
        WorkflowItem.objects.create(owner=self.user, title="B", status="completed")
        response = self.client.get("/api/workflows/?status=completed")
        self.assertEqual([i["title"] for i in response.data], ["B"])
