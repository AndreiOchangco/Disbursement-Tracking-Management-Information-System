from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.login, name='login'),
    path('auth/refresh/', views.refresh_token, name='token_refresh'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/me/', views.me, name='me'),
    path('auth/csrf/', views.get_csrf_token, name='csrf_token'),
    path('auth/sso-login/', views.sso_login, name='sso-login'),

    # Admin
    path('users/signup/', views.register, name='register'),
    path('users/', views.user_list, name='user-list'),
    path('users/<int:pk>/', views.user_detail, name='user-detail'),

    # DV CRUD
    path('dv/', views.dv_list, name='dv-list'),
    path('dv/<int:pk>/', views.dv_detail, name='dv-detail'),

    # DV Workflow Actions
    path('dv/<int:pk>/submit/', views.dv_submit, name='dv-submit'),
    path('dv/<int:pk>/approve/', views.dv_approve, name='dv-approve'),
    path('dv/<int:pk>/disapprove/', views.dv_disapprove, name='dv-disapprove'),
    path('dv/<int:pk>/resubmit/', views.dv_resubmit, name='dv-resubmit'),
    path('dv/<int:pk>/archive/', views.dv_archive, name='dv-archive'),

    # Dashboard
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    # PDF report for approved disbursements
    path('dv/approved/report/pdf/', views.approved_dv_pdf, name='dv-approved-pdf'),
    # wkhtmltopdf diagnostic
    path('health/wkhtmltopdf/', views.wkhtmltopdf_health, name='wkhtmltopdf-health'),
]