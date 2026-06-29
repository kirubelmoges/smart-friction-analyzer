
from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Measurement, LiveData
from .serializers import MeasurementSerializer, LiveDataSerializer
from django.db.models import Avg, Count, Min, Max

class MeasurementViewSet(viewsets.ModelViewSet):
    queryset = Measurement.objects.all().order_by('-timestamp')
    serializer_class = MeasurementSerializer

class LiveDataViewSet(viewsets.ModelViewSet):
    queryset = LiveData.objects.all()[:100]
    serializer_class = LiveDataSerializer

@api_view(['GET'])
def latest_measurement(request):
    """Get the most recent measurement"""
    latest = Measurement.objects.first()
    if latest:
        serializer = MeasurementSerializer(latest)
        return Response(serializer.data)
    return Response({'message': 'No measurements yet'})

@api_view(['GET'])
def latest_angle(request):
    """Get the most recent live angle"""
    latest = LiveData.objects.first()
    if latest:
        return Response({'current_angle': latest.current_angle})
    return Response({'current_angle': 0})

@api_view(['GET'])
def statistics(request):
    """Get statistical summary of all measurements"""
    measurements = Measurement.objects.all()
    if not measurements.exists():
        return Response({'message': 'No data available'})
    
    stats = measurements.aggregate(
        avg_mu=Avg('coefficient_friction'),
        min_mu=Min('coefficient_friction'),
        max_mu=Max('coefficient_friction'),
        total_count=Count('id'),
        avg_angle=Avg('critical_angle')
    )
    
    return Response(stats)