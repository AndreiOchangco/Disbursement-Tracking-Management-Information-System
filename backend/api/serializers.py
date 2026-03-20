from rest_framework import serializers
from .models import Disbursement

class DisbursementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disbursement
        fields = '__all__'