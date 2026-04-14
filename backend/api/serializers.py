from rest_framework import serializers
from .models import User, DV, DVArchived, DVWorkflow, DVPayment, DVParticulars, DVJE, DVParticularValue

STEP_LABELS = {1: 'Accounting', 2: 'Budget', 3: 'Treasurer', 4: 'BAC/GSO', 5: "Mayor's Office", 6: 'Completed'}

class UserSerializer(serializers.ModelSerializer):
    department_label = serializers.CharField(source='get_department_display', read_only=True)
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'department', 'department_label', 'status']

class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'department', 'status', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password: user.pass_hashed = password # Handled by model save()
        user.save()
        return user

class DVWorkflowSerializer(serializers.ModelSerializer):
    action_by_name = serializers.ReadOnlyField(source='action_by.full_name')
    action_by_department = serializers.ReadOnlyField(source='action_by.get_department_display')
    step_label = serializers.SerializerMethodField()

    class Meta:
        model = DVWorkflow
        fields = ['id', 'dv', 'step', 'step_label', 'status', 'remarks', 'action_date', 'action_by', 'action_by_name', 'action_by_department']

    def get_step_label(self, obj):
        return STEP_LABELS.get(obj.step, f'Step {obj.step}')

class DVPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DVPayment
        exclude = ['dv']

class DVParticularValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = DVParticularValue
        fields = ['id', 'category', 'np', 'ft', 'tf']

class DVParticularsSerializer(serializers.ModelSerializer):
    category_values = DVParticularValueSerializer(many=True)
    class Meta:
        model = DVParticulars
        fields = ['id', 'description', 'jev_no', 'date', 'category_values']

class DVJESerializer(serializers.ModelSerializer):
    class Meta:
        model = DVJE
        exclude = ['dv']

class DVSerializer(serializers.ModelSerializer):
    accounting_name = serializers.ReadOnlyField(source='accounting.full_name')
    current_step_label = serializers.SerializerMethodField()
    payments = DVPaymentSerializer(many=True, read_only=True)
    particulars = DVParticularsSerializer(many=True, read_only=True)
    journal_entries = DVJESerializer(many=True, read_only=True)
    workflow_steps = DVWorkflowSerializer(many=True, read_only=True)
    archive_info = serializers.StringRelatedField()

    class Meta:
        model = DV
        fields = '__all__'

    def get_current_step_label(self, obj):
        return STEP_LABELS.get(obj.current_step, f'Step {obj.current_step}')

class DVCreateUpdateSerializer(serializers.ModelSerializer):
    payments = DVPaymentSerializer(many=True, required=False)
    particulars = DVParticularsSerializer(many=True, required=False)
    journal_entries = DVJESerializer(many=True, required=False)

    class Meta:
        model = DV
        fields = ['dv_no', 'tracking_no', 'payee', 'office', 'cafoa_no', 'created_date', 'advice_no', 'responsibility_center', 'fund_source', 'tin', 'payments', 'particulars', 'journal_entries']

    def create(self, validated_data):
        payments_data = validated_data.pop('payments', [])
        particulars_data = validated_data.pop('particulars', [])
        je_data = validated_data.pop('journal_entries', [])

        dv = DV.objects.create(**validated_data)
        for p in payments_data: DVPayment.objects.create(dv=dv, **p)
        for je in je_data: DVJE.objects.create(dv=dv, **je)
        
        for part in particulars_data:
            vals = part.pop('category_values', [])
            p_obj = DVParticulars.objects.create(dv=dv, **part)
            for v in vals: DVParticularValue.objects.create(particulars=p_obj, **v)
        return dv