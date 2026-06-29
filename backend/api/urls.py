from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeasurementViewSet, LiveDataViewSet, latest_measurement, latest_angle, statistics

router = DefaultRouter()
router.register(r'measurements', MeasurementViewSet)
router.register(r'livedata', LiveDataViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('latest-measurement/', latest_measurement, name='latest-measurement'),
    path('latest-angle/', latest_angle, name='latest-angle'),
    path('statistics/', statistics, name='statistics'),
]