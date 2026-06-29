import serial
import threading
import time
import sys
import os

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'friction_backend.settings')
import django
django.setup()

from api.models import Measurement, LiveData

class ArduinoSerialReader:
    def __init__(self, port='COM4', baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.serial_connection = None
        self.running = False
        self.current_angle = 0
        
    def connect(self):
        try:
            self.serial_connection = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=1
            )
            print(f"✅ Connected to Arduino on {self.port}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            return False
    
    def process_data(self, line):
        try:
            line = line.strip()
            
            if line.startswith('ANGLE:'):
                angle = float(line.split(':')[1])
                print(f"📐 Motion detected at {angle:.2f}°")
                self.current_angle = angle
                
            elif line.startswith('MU:'):
                mu = float(line.split(':')[1])
                print(f"📊 Coefficient of friction: {mu:.4f}")
                
                # Save to database
                Measurement.objects.create(
                    critical_angle=self.current_angle,
                    coefficient_friction=mu
                )
                print(f"💾 Saved to database!")
                
            elif line.startswith('LIVE:'):
                angle = float(line.split(':')[1])
                
                # Save live data (keep only last 100)
                LiveData.objects.create(current_angle=angle)
                
                # Cleanup old data
                if LiveData.objects.count() > 100:
                    oldest = LiveData.objects.last()
                    if oldest:
                        oldest.delete()
                        
        except Exception as e:
            print(f"⚠️ Error: {e}")
    
    def read_data(self):
        print("📡 Listening for Arduino data...")
        while self.running and self.serial_connection:
            try:
                if self.serial_connection.in_waiting:
                    line = self.serial_connection.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        print(f"📨 Received: {line}")
                        self.process_data(line)
                else:
                    time.sleep(0.01)
            except Exception as e:
                print(f"⚠️ Read error: {e}")
                time.sleep(1)
    
    def start(self):
        if self.connect():
            self.running = True
            self.thread = threading.Thread(target=self.read_data, daemon=True)
            self.thread.start()
            print("✅ Serial reader started")
    
    def stop(self):
        print("🛑 Stopping serial reader...")
        self.running = False
        if self.serial_connection:
            self.serial_connection.close()

serial_reader = ArduinoSerialReader()

def start_serial_reader():
    serial_reader.start()

def stop_serial_reader():
    serial_reader.stop()

if __name__ == "__main__":
    start_serial_reader()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        stop_serial_reader()