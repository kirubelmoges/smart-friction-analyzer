from rest_framework import serializers
from .models import Measurement, LiveData

class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ['id', 'material_name', 'critical_angle', 
                  'coefficient_friction', 'timestamp', 'notes']
        read_only_fields = ['id', 'timestamp']

class LiveDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveData
        fields = ['id', 'current_angle', 'timestamp']
        read_only_fields = ['id', 'timestamp']