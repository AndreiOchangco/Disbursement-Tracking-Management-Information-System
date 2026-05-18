from django.db import models, transaction
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password as django_check_password


DEPARTMENT_CHOICES = [
    ('admin', 'System Administrator'),
    ('accounting', 'Accounting'),
    ('budget', 'Budget'),
    ('treasurer', 'Treasurer'),
    ('bac_gso', 'BAC/GSO'),
    ('municipal_admin', "Municipal Administrator"),
    ('mayors_office', "Mayor's Office"),
]

FUND_SOURCE_CHOICES = [
    ('GF', 'GF'),
    ('20% DF', '20% DF'),
    ('5% DRRM', '5% DRRM'),
    ('GAD', 'GAD'),
    ('RA7171', 'RA7171'),
    ('SEF', 'SEF'),
    ('TF', 'TF'),
    ('PHILHEALTH', 'PHILHEALTH'),
    ('CALAMITY', 'CALAMITY'),
]

MOP_CHOICES = [
    ('CASH', 'Cash'),
    ('CHECK', 'Check'),
    ('OTHERS', 'Others'),
]

DV_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('disapproved', 'Disapproved'),
    ('completed', 'Completed'),
    ('archived', 'Archived'),
]

WORKFLOW_STATUS_CHOICES = [
    ('submitted', 'Submitted'),
    ('resubmitted', 'Resubmitted'),
    ('approved', 'Approved'),
    ('disapproved', 'Disapproved'),
    ('archived', 'Archived'),
]

USER_STATUS_CHOICES = [
    ('active', 'Active'),
    ('inactive', 'Inactive'),
    ('archived', 'Archived'),
]


class User(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    pass_hashed = models.CharField(max_length=255)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    status = models.CharField(max_length=20, choices=USER_STATUS_CHOICES, default='active')

    class Meta:
        db_table = 'user'

    @property
    def is_authenticated(self):
        return True

    def set_password(self, raw_password):
        self.pass_hashed = make_password(raw_password)

    def check_password(self, raw_password):
        return django_check_password(raw_password, self.pass_hashed)

    def save(self, *args, **kwargs):
        if self.pass_hashed and not self.pass_hashed.startswith('pbkdf2_'):
            self.pass_hashed = make_password(self.pass_hashed)
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            # When a new user is added, deactivate all other active users in same dept
            User.objects.filter(
                department=self.department,
                status='active'
            ).exclude(pk=self.pk).update(status='inactive')

    def __str__(self):
        return f"{self.full_name} ({self.department})"
    

class DeptHead(models.Model):
    fullname = models.CharField(max_length=255)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)

    class Meta:
        db_table = 'dept_head'
    
    def __str__(self):
        return f"{self.fullname} - {self.department}"


class DV(models.Model):
    dv_no = models.CharField(max_length=100, unique=True, blank=True, null=True)
    dv_date = models.DateField(blank=True, null=True)
    tracking_no = models.CharField(max_length=100, unique=True)
    transaction_no = models.CharField(max_length=100, blank=True, null=True)
    transaction_date = models.DateField(blank=True, null=True)
    accounting = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='created_dvs'
    )
    position_office = models.CharField(max_length=255, blank=True, null=True)
    office_unit_project = models.CharField(max_length=255, blank=True, null=True)
    cafoa_no = models.CharField(max_length=100, blank=True, null=True)
    created_date = models.DateField(auto_now_add=True, blank=True, null=True)
    advice_no = models.CharField(max_length=100, blank=True, null=True)
    advice_date = models.DateField(blank=True, null=True)
    responsibility_center = models.CharField(max_length=255, blank=True, null=True)
    fund_source = models.CharField(max_length=50, choices=FUND_SOURCE_CHOICES)
    tin = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=DV_STATUS_CHOICES, default='pending')
    # current_step: 1=Accounting, 2=Budget, 3=Treasurer, 4=BAC/GSO, 5=Mayor's Office, 6=Completed
    # Default changed to 2 so new DVs start forwarded to Budget
    current_step = models.IntegerField(default=2, blank=True, null=True)
    last_disapproved_step = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dv'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Auto-generate tracking_no on initial creation
        if not self.tracking_no:
            with transaction.atomic():
                now = timezone.now()
                year_str = str(now.year)
                year_month_str = now.strftime('%Y%m')
                
                # Lock the matching rows until the end of the transaction
                last_dv = DV.objects.select_for_update().filter(
                    tracking_no__startswith=year_str
                ).order_by('-tracking_no').first()
                
                if last_dv and last_dv.tracking_no:
                    # Extract the last 4 digits
                    try:
                        last_series = int(last_dv.tracking_no[-4:])
                        new_series = last_series + 1
                    except ValueError:
                        new_series = 1
                else:
                    new_series = 1
                        
                # Generate the sequence string
                generated_no = f"{year_month_str}{new_series:04d}"
                
                # Assign it to ALL number fields
                self.tracking_no = generated_no
                self.dv_no = generated_no
                self.transaction_no = generated_no
                
                # Assign the creation date to ALL date fields
                current_date = now.date()
                self.created_date = current_date
                self.dv_date = current_date
                self.transaction_date = current_date
                
        super().save(*args, **kwargs)

    def __str__(self):
        return self.tracking_no
    
    def generate_accounting_reference(self):
        if not self.transaction_no or not self.created_date:
            return ""

        mm = f"{self.created_date.month:02d}"

        # last 4 digits = YYYYMMSSSS, we only need series
        raw_series = str(self.transaction_no)[-4:]

        if raw_series.isdigit():
            series = int(raw_series)
        else:
            series = 0

        return f"{mm}-{series:03d}"
    
class Payee(models.Model):
    dv = models.OneToOneField(DV, on_delete=models.CASCADE, related_name='payee')
    name = models.CharField(max_length=255)
    address = models.TextField()
    email = models.EmailField(blank=True, null=True)
    phone_no = models.CharField(max_length=11, blank=True, null=True)

    class Meta:
        db_table = 'payee'


class DVArchived(models.Model):
    dv = models.OneToOneField(DV, on_delete=models.CASCADE, related_name='archive_info')
    archived_date = models.DateField(auto_now_add=True)
    reason_of_archive = models.TextField(default="No reason of archive provided", blank=True, null=True)

    class Meta:
        db_table = 'dv_archived'


class DVWorkflow(models.Model):
    dv = models.ForeignKey(DV, on_delete=models.CASCADE, related_name='workflow_steps')
    step = models.IntegerField()
    status = models.CharField(max_length=50, choices=WORKFLOW_STATUS_CHOICES)
    remarks = models.TextField(blank=True, null=True)
    action_date = models.DateTimeField(auto_now_add=True)
    action_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='workflow_actions'
    )

    class Meta:
        db_table = 'dv_workflow'
        ordering = ['action_date']


class DVPayment(models.Model):
    dv = models.ForeignKey(DV, on_delete=models.CASCADE, related_name='payments')
    mop = models.CharField(max_length=20, choices=MOP_CHOICES)
    mop_specify = models.CharField(max_length=255, blank=True, null=True)
    atm_no = models.CharField(max_length=100, blank=True, null=True)
    bank = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'dv_payment'

class DVParticulars(models.Model):
    dv = models.ForeignKey(DV, on_delete=models.CASCADE, related_name='particulars')
    description = models.TextField()
    jev_no = models.CharField(max_length=100, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    
    class Meta:
        db_table = 'dv_particulars'


class DVReport(models.Model):
    """Snapshot of a completed DV for report generation and archival.

    Stores the serialized DV payload so report generation can operate
    independently of the live DV rows.
    """
    dv = models.OneToOneField(DV, on_delete=models.CASCADE, related_name='report')
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'dv_report'
   

class DVParticularValue(models.Model):
    particulars = models.ForeignKey(DVParticulars, on_delete=models.CASCADE, related_name='category_values')
    category = models.CharField(max_length=100)
    np = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="Net Pay")
    ft = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="15th")
    tf = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="31st")

    class Meta:
        db_table = 'dv_particular_values'


class DVJE(models.Model):
    dv = models.ForeignKey(DV, on_delete=models.CASCADE, related_name='journal_entries')
    account_code = models.CharField(max_length=255, blank=True, null=True)
    particulars = models.CharField(max_length=255, blank=True, null=True)
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0, blank=True, null=True)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0, blank=True, null=True)

    class Meta:
        db_table = 'dv_je'