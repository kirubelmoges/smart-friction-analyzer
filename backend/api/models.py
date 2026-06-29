from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import math

class Measurement(models.Model):
    """
    Stores friction coefficient measurements
    """
    material_name = models.CharField(max_length=100, blank=True, null=True)
    critical_angle = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(90.0)]
    )
    coefficient_friction = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(2.0)]
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"μ={self.coefficient_friction:.4f} at {self.critical_angle:.2f}°"
    
    def save(self, *args, **kwargs):
        # Auto-calculate friction coefficient if not provided
        if not self.coefficient_friction and self.critical_angle:
            angle_rad = math.radians(self.critical_angle)
            self.coefficient_friction = math.tan(angle_rad)
        super().save(*args, **kwargs)

class LiveData(models.Model):
    """
    Stores real-time angle readings from Arduino
    """
    current_angle = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(90.0)]
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Angle: {self.current_angle:.2f}° at {self.timestamp}"
