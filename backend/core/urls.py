from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/login/', TokenObtainPairView.as_view()),

    # API routes
    path('api/', include('api.urls')),
]