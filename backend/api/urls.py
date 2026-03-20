from rest_framework.routers import DefaultRouter
from .views import DisbursementViewSet

router = DefaultRouter()
router.register(r'disbursements', DisbursementViewSet)

urlpatterns = router.urls