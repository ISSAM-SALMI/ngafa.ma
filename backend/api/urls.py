from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    UserViewSet, ClientViewSet, SalonServiceViewSet, SalonVisitViewSet,
    DressViewSet, DressRentalViewSet, NgafaItemViewSet, NgafaEventViewSet,
    current_user, NgafaBookingItemViewSet, download_contract_pdf,
    login_view,
    download_salon_visit_pdf, download_dress_rental_pdf
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'salon-services', SalonServiceViewSet)
router.register(r'salon-visits', SalonVisitViewSet)
router.register(r'dresses', DressViewSet)
router.register(r'dress-rentals', DressRentalViewSet)
router.register(r'ngafa-items', NgafaItemViewSet)
router.register(r'ngafa-events', NgafaEventViewSet)
router.register(r'ngafa-booking-items', NgafaBookingItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', login_view),
    path('auth/me/', current_user),
    path('current-user/', current_user),
    path('api-token-auth/', obtain_auth_token),
    path('ngafa-events/<int:pk>/contract/', download_contract_pdf),
    path('salon-visits/<int:pk>/receipt/', download_salon_visit_pdf),
    path('dress-rentals/<int:pk>/contract/', download_dress_rental_pdf),
]
