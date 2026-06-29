import serial
import threading
import time
import requests
import json

# ============================================
# CONFIGURATION - CORRECT ENDPOINTS
# ============================================
ARDUINO_PORT = 'COM4'
BAUD_RATE = 9600

# Use the correct API endpoints
RENDER_API_URL = 'https://static-friction-analyzer.onrender.com/api/measurements/'
LIVE_API_URL = 'https://static-friction-analyzer.onrender.com/api/livedata/'

# ============================================
# SERIAL READER CLASS
# ============================================
class ArduinoCloudReader:
    def __init__(self, port=ARDUINO_PORT, baudrate=BAUD_RATE):
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
            print(f"🌐 Sending data to: {RENDER_API_URL}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            return False
    
    def send_to_cloud(self, angle, mu):
        """Send measurement to Render API"""
        try:
            # Format data exactly as Django REST Framework expects
            data = {
                "critical_angle": float(angle),
                "coefficient_friction": float(mu),
                "material_name": "Arduino Measurement"
            }
            
            print(f"   📤 Sending: angle={angle}, mu={mu}")
            
            response = requests.post(
                RENDER_API_URL,
                json=data,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout=10
            )
            
            print(f"   📥 Response status: {response.status_code}")
            
            if response.status_code == 201:
                print(f"   ✅ Saved to cloud database!")
            elif response.status_code == 400:
                print(f"   ❌ Bad request: {response.text}")
            else:
                print(f"   ⚠️ Unexpected response: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"   ❌ Cloud error: {e}")
    
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
                
                # Send to cloud via Render API
                self.send_to_cloud(self.current_angle, mu)
                        
            elif line.startswith('LIVE:'):
                angle = float(line.split(':')[1])
                # Optional: send live data
                # self.send_live_to_cloud(angle)
                        
        except Exception as e:
            print(f"⚠️ Error in process_data: {e}")
    
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
            print("✅ Serial reader started (sending to Render cloud)")
    
    def stop(self):
        print("🛑 Stopping serial reader...")
        self.running = False
        if self.serial_connection:
            self.serial_connection.close()

# ============================================
# MAIN
# ============================================
if __name__ == "__main__":
    reader = ArduinoCloudReader()
    reader.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        reader.stop()