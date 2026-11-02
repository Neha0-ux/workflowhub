from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import WorkflowItem
from .serializers import RegisterSerializer, WorkflowItemSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ - create a new user account."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(APIView):
    """POST /api/auth/login/ - exchange username and password for a token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user = authenticate(
            username=request.data.get("username"), password=request.data.get("password")
        )
        if user is None:
            return Response(
                {"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})


class LogoutView(APIView):
    """POST /api/auth/logout/ - delete the caller's token."""

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowItemViewSet(viewsets.ModelViewSet):
    """Full CRUD on /api/workflows/, limited to the logged-in user's items."""

    serializer_class = WorkflowItemSerializer

    def get_queryset(self):
        queryset = WorkflowItem.objects.filter(owner=self.request.user)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
