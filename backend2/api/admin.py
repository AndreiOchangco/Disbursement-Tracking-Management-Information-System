from django.contrib import admin
from .models import User, DV, DVArchived, DVWorkflow, DVPayment, DVParticulars, DVJE


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'department', 'status']
    list_filter = ['department', 'status']
    search_fields = ['full_name', 'email']
    list_editable = ['status']


@admin.register(DV)
class DVAdmin(admin.ModelAdmin):
    list_display = ['dv_no', 'tracking_no', 'payee', 'office', 'fund_source', 'status', 'current_step', 'created_date']
    list_filter = ['status', 'fund_source', 'current_step']
    search_fields = ['dv_no', 'tracking_no', 'payee']


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