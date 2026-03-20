from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Disbursement
from .serializers import DisbursementSerializer

class DisbursementViewSet(ModelViewSet):
    queryset = Disbursement.objects.all().order_by('-created_at')
    serializer_class = DisbursementSerializer
    permission_classes = [IsAuthenticated]