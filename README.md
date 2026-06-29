<h2> Project Demo</h2>

<a href="https://youtu.be/D3vALDrm6JA" target="_blank">
  <img src="https://img.youtube.com/vi/D3vALDrm6JA/maxresdefault.jpg" 
       alt="Watch Video" 
       width="100%" />
</a>
 
 Friction Measurement System (Inclined Plane – Theta Based)
 Project Overview
 
 https://friction-coefficient-analysis-syste-seven.vercel.app/

This project is an Arduino-based friction measurement system designed to calculate the coefficient of static friction (μs) using an inclined plane method. The system gradually increases the angle of inclination until an object placed on the surface begins to slide. At that critical angle (θ), the system captures real-time data using an MPU6050 sensor and computes the coefficient of static friction.

The results are displayed live on an LCD screen and recorded in a connected software system for visualization and analysis.

## Working Principle

The experiment is based on the physics principle:

μs=tan(θ)critical

Where:

μs = coefficient of static friction
θcritical = angle at which the object just begins to slide
## Process Flow:
The inclined platform is gradually raised.
The MPU6050 sensor continuously measures tilt angle (θ).
When the object starts sliding:
The system detects motion/angle change.
The critical angle is recorded instantly.
The system calculates μs = tan(θ).
Results are displayed and stored in real time.
 Key Features
 Real-time angle measurement using MPU6050
 Automatic detection of sliding point
 Automatic calculation of coefficient of static friction
 LCD display for live readings
 Software integration for data logging and visualization
 Live monitoring of experimental results
 Hardware Components
Arduino Uno
MPU6050 (Accelerometer + Gyroscope Sensor)
LCD Display (16x2 or I2C LCD)
Servo Motor / Mechanical Inclination System (for angle control)
Base platform for friction surface
Power supply and connecting wires
## Scientific Concept

This system demonstrates the relationship between:

Normal force
Frictional force
Angle of inclination

At the point of motion:

mgsin(θ)=μs
mgcos(θ)

Simplifies to:

μs=tan(θ)
## Software Features
Live angle tracking from sensor
Real-time friction coefficient computation
Data logging for experiments
Graphical visualization of results (optional extension)
Serial communication between Arduino and PC
## How It Works
Place object on inclined surface
Start system calibration
Gradually increase angle
MPU6050 detects tilt continuously
At motion threshold:
angle is locked
μs is calculated
Result is displayed and logged
## Applications
Physics laboratory experiments
Engineering education
Material friction testing
Research in surface interaction
Automation-based experimental analysis
## Future Improvements
Automatic motor-controlled incline system
Cloud data logging
AI-based motion detection
Mobile dashboard integration
Multiple material comparison system
