from django.contrib import admin
from .models import DeptHead, User, DV, DVArchived, DVWorkflow, DVPayment, DVParticulars, DVJE, DVReport, Payee

class PayeeInline(admin.StackedInline):
    model = Payee
    can_delete = False
    verbose_name_plural = 'Payee Information'
    fk_name = 'dv'

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'department', 'status']
    list_filter = ['department', 'status']
    search_fields = ['full_name', 'email']
    list_editable = ['status']

@admin.register(DeptHead)
class DeptHeadAdmin(admin.ModelAdmin):
    # Columns to show in the list view
    list_display = ('fullname', 'department')
    
    # Enable a sidebar filter for departments
    list_filter = ('department',)
    
    # Add a search bar for names
    search_fields = ('fullname',)


@admin.register(DV)
class DVAdmin(admin.ModelAdmin):
    list_display = ['dv_no', 'tracking_no', 'position_office', 'fund_source', 'status', 'current_step', 'created_date']
    list_filter = ['status', 'fund_source', 'current_step']
    search_fields = ['dv_no', 'tracking_no', 'payee__name']
    inlines = [PayeeInline]

    def get_payee_name(self, obj):
        try:
            return obj.payee_info.name
        except Payee.DoesNotExist:
            return "No Payee"
    get_payee_name.short_description = 'Payee'


@admin.register(DVWorkflow)
class DVWorkflowAdmin(admin.ModelAdmin):
    list_display = ['dv', 'step', 'status', 'action_by', 'action_date']
    list_filter = ['status', 'step']


@admin.register(DVArchived)
class DVArchivedAdmin(admin.ModelAdmin):
    list_display = ['dv', 'archived_date', 'reason_of_archive']


admin.site.register(DVPayment)
admin.site.register(DVParticulars)
admin.site.register(DVJE)
@admin.register(DVReport)
class DVReportAdmin(admin.ModelAdmin):
    # Use actual model fields: `created_at` stores when the report was generated.
    list_display = ['dv', 'created_at']
    list_filter = ['created_at']