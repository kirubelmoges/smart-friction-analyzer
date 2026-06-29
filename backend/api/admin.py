from django.contrib import admin
from .models import Measurement, LiveData

@admin.register(Measurement)
class MeasurementAdmin(admin.ModelAdmin):
    list_display = ['critical_angle', 'coefficient_friction', 'timestamp', 'material_name']
    list_filter = ['timestamp', 'material_name']
    search_fields = ['material_name', 'notes']
    readonly_fields = ['timestamp']

@admin.register(LiveData)
class LiveDataAdmin(admin.ModelAdmin):
    list_display = ['current_angle', 'timestamp']
    list_filter = ['timestamp']
    readonly_fields = ['timestamp']