from rest_framework import serializers
from .models import User, DV, DVArchived, DVWorkflow, DVPayment, DVParticulars, DVJE, DVParticularValue, DVReport


STEP_LABELS = {
    1: 'Accounting',
    2: 'Budget',
    3: 'Treasurer',
    4: 'BAC/GSO',
    5: "Mayor's Office",
    6: 'Completed',
}


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'department', 'status']

class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'department', 'status', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance

class DVWorkflowSerializer(serializers.ModelSerializer):
    action_by_name = serializers.SerializerMethodField()
    action_by_department = serializers.SerializerMethodField()
    step_label = serializers.SerializerMethodField()

    class Meta:
        model = DVWorkflow
        fields = [
            'id', 'dv', 'step', 'step_label', 'status', 'remarks',
            'action_date', 'action_by', 'action_by_name', 'action_by_department'
        ]

    def get_action_by_name(self, obj):
        return obj.action_by.full_name if obj.action_by else None

    def get_action_by_department(self, obj):
        if obj.action_by:
            return obj.action_by.get_department_display()
        return None

    def get_step_label(self, obj):
        return STEP_LABELS.get(obj.step, f'Step {obj.step}')


class DVArchivedSerializer(serializers.ModelSerializer):
    class Meta:
        model = DVArchived
        fields = '__all__'


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
    accounting_name = serializers.SerializerMethodField()
    current_step_label = serializers.SerializerMethodField()
    payments = DVPaymentSerializer(many=True, read_only=True)
    particulars = DVParticularsSerializer(many=True, read_only=True)
    journal_entries = DVJESerializer(many=True, read_only=True)
    workflow_steps = DVWorkflowSerializer(many=True, read_only=True)
    archive_info = DVArchivedSerializer(read_only=True)

    class Meta:
        model = DV
        fields = '__all__'

    def get_accounting_name(self, obj):
        return obj.accounting.full_name if obj.accounting else None

    def get_current_step_label(self, obj):
        return STEP_LABELS.get(obj.current_step, f'Step {obj.current_step}')


class DVCreateUpdateSerializer(serializers.ModelSerializer):
    payments = DVPaymentSerializer(many=True, required=False)
    particulars = DVParticularsSerializer(many=True, required=False)
    journal_entries = DVJESerializer(many=True, required=False)

    class Meta:
        model = DV
        fields = [
            'dv_no', 'dv_date', 'tracking_no', 'transaction_no', 
            'transaction_date', 'payee', 'office_unit_project', 'position_office', 'cafoa_no', 
            'created_date', 'advice_no', 'advice_date', 
            'responsibility_center', 'fund_source', 'tin',
            'payments', 'particulars', 'journal_entries'
        ]

    def create(self, validated_data):
        payments_data = validated_data.pop('payments', [])
        particulars_data = validated_data.pop('particulars', [])
        je_data = validated_data.pop('journal_entries', [])

        dv = DV.objects.create(**validated_data)

        # Handle Payments
        for p in payments_data:
            DVPayment.objects.create(dv=dv, **p)
            
        # Handle Particulars and their Category Values
        for part in particulars_data:
            category_values_data = part.pop('category_values', [])
            particular_obj = DVParticulars.objects.create(dv=dv, **part)
            
            for val in category_values_data:
                DVParticularValue.objects.create(particulars=particular_obj, **val)

        # Handle Journal Entries
        for je in je_data:
            DVJE.objects.create(dv=dv, **je)

        return dv

    def update(self, instance, validated_data):
        payments_data = validated_data.pop('payments', None)
        particulars_data = validated_data.pop('particulars', None)
        je_data = validated_data.pop('journal_entries', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if payments_data is not None:
            instance.payments.all().delete()
            for p in payments_data:
                DVPayment.objects.create(dv=instance, **p)

        if particulars_data is not None:
            instance.particulars.all().delete()
            for part in particulars_data:
                category_values_data = part.pop('category_values', [])
                particular_obj = DVParticulars.objects.create(dv=instance, **part)
                
                for val in category_values_data:
                    DVParticularValue.objects.create(particulars=particular_obj, **val)

        if je_data is not None:
            instance.journal_entries.all().delete()
            for je in je_data:
                DVJE.objects.create(dv=instance, **je)

        return instance


class DVReportSerializer(serializers.ModelSerializer):
    dv_no = serializers.CharField(source='dv.dv_no', read_only=True)
    class Meta:
        model = DVReport
        # Expose only fields that exist on DVReport; include `dv_no` and full `payload`
        fields = ['id', 'dv', 'dv_no', 'payload', 'created_at']