What Is This

This is a complete system that measures how slippery different materials are. Instead of guessing or using complicated math, this device does everything automatically.
You place a block on an inclined board, tilt it slowly, and the system tells you the exact friction coefficient. No manual calculations needed.

How It Works

The physics is simple. When you tilt a board, the angle at which a block starts to slide tells you the friction coefficient. The formula is μ = tan(angle).
This system automates that process:
An Arduino with a motion sensor measures the tilt angle continuously
When the block slides, it records that exact angle
The data goes to a cloud database
You see results on a web dashboard in real time


What You Need

Hardware
Part	               Purpose
Arduino Uno	          Reads the sensor and calculates angle
MPU6050 sensor	      Measures tilt in three dimensions
LCD screen          	Shows live angle during testing (optional)
USB cable            	Connects Arduino to computer
Inclined board	      A flat board with a hinge at one end
Test blocks	          Materials you want to test like wood rubber metal


Software

Software	   Version	Purpose
Arduino       IDE	2.0+	Upload code to Arduino
Python	      3.10+	Runs the serial reader
Node.js	18.x	Runs the web dashboard
Git	Latest	  Version control optional


Cloud Services (Free tier works)

Service	   What It Does
Render	   Hosts your backend API
Aiven	     Hosts your MySQL database
Vercel	   Hosts your web dashboard


Wiring Instructions
MPU6050 Connections

MPU6050      Pin	Arduino Pin
VCC	         5V
GND	         GND
SCL          A5

LCD Connections (I2C Type)
LCD Pin	Arduino Pin

VCC	   5V
GND	    GND
SCL	    A5
SDA     A4
SDA   	A4


 Arduino Setup
Install Required Libraries
Open Arduino IDE. Go to Sketch > Include Library > Manage Libraries.

Search and install:

MPU6050 by Electronic Cats

LiquidCrystal I2C by Frank de Brabander

Upload the Code
Open the file arduino/friction_meter.ino

Select Tools > Board > Arduino Uno

Select Tools > Port > COMx (your Arduino port)

Click the Upload button


Verify It Works
Open Serial Monitor (Tools > Serial Monitor). Set baud rate to 9600.

You should see:

text
LIVE:0.00
LIVE:0.01
LIVE:0.00



Backend Setup
 
Create Virtual Environment
Windows:


cd backend
python -m venv venv
venv\Scripts\activate
Mac / Linux:


cd backend
python3 -m venv venv
source venv/bin/activate
Install Dependencies

pip install -r requirements.txt
Create Environment File
Create a file named .env in the backend folder with this content:


SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=mysql://username:password@host:port/database?ssl_mode=REQUIRED
ARDUINO_PORT=COM3
BAUD_RATE=9600
Run Migrations

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
Start the Backend
text
python manage.py runserver

Start the Serial Reader (New Terminal Window)

python manage.py start_serial or python serial_reader_cloud.py

Frontend Setup

Install Dependencies

cd frontend/friction-dashboard
npm install
Create Environment File
Create a file named .env in the frontend folder:


REACT_APP_API_URL=http://localhost:8000/api
Start the Dashboard

npm start


How to Use the System
Step by Step
Connect Arduino to your computer via USB

Open a terminal and start the serial reader

Open another terminal and start the Django backend

Open another terminal and start the React dashboard

Open your browser to http://localhost:3000

Place your test block at the top of the inclined board

Slowly lift the bottom edge of the board

Stop lifting the moment the block starts to slide

Look at the dashboard. Your friction coefficient appears automatically

Understanding the Dashboard
Current Angle - Live tilt reading updates every half second

Latest μ - Your most recent measurement

Average μ - Average of your last 3 tests

Total Tests - How many measurements you have taken

Real Time Chart - See the angle change as you tilt

History Table - All your past measurements

Understanding Results
Below 0.15 means Very Low friction. Examples are Ice on ice and Teflon.

0.15 to 0.35 means Low friction. Examples are Oiled metal and ball bearings.

0.35 to 0.55 means Medium friction. Examples are Dry wood and concrete.

0.55 to 0.75 means High friction. Examples are Rubber and MDF board.

Above 0.75 means Very High friction. Examples are Velcro and adhesive tape.

Tips for Accurate Results
Do clean the board before each test. Do not test on dusty or dirty surfaces.

Do tilt slowly about 1 degree per second. Do not jerk the board quickly.

Do stop immediately when the block slides. Do not keep tilting after the slide.

Do test the same material three times. Do not rely on a single measurement.

Do keep the board dry. Do not test on wet surfaces unless intentional.

Do let the Arduino calibrate for 5 seconds. Do not move the board during calibration.

Common Problems and Solutions
Arduino Not Detected

Try a different USB cable. Some cables only charge and do not transfer data.
Try a different USB port on your computer.
Check Device Manager to see if the COM port appears.

Serial Reader Cannot Connect

Close the Arduino Serial Monitor if it is open. It locks the COM port.
Check that the correct COM port is in your .env file.
Run the terminal as administrator.

No Data on Dashboard

Make sure the serial reader is running.
Check that Arduino is sending data. Look for LIVE messages in the serial reader window.
Verify the backend API is running at http://localhost:8000

Angle Jumps Around

Keep the board perfectly still during calibration. This is the first 5 seconds after upload.
Increase the motionSensitivity value in the Arduino code.
Check that the MPU6050 is firmly attached to the board.

Build Fails on Vercel

Make sure react-scripts is in your package.json dependencies.
Set Node.js version to 18.x in Vercel settings.
Redeploy without cache.

Deployment to Cloud
Deploy Backend to Render

First push your code to GitHub.
Then create an account at render.com.
Click New then Web Service.
Connect your GitHub repository.
Set build command to pip install -r requirements.txt.
Set start command to gunicorn friction_backend.wsgi:application.
Add your DATABASE_URL as an environment variable.
Click Deploy.

Deploy Frontend to Vercel

First push your code to GitHub.
Then create an account at vercel.com.
Click Add New then Project.
Import your GitHub repository.
Add environment variable REACT_APP_API_URL pointing to your Render backend.
Click Deploy.

Deploy Database to Aiven

Create an account at aiven.io.
Create a new MySQL service on the free tier.
Copy the connection string.
Use this as your DATABASE_URL everywhere.

File Structure
smart-friction-analyzer folder contains:

backend folder which has api, serial_reader, friction_backend, requirements.txt, and .env

frontend folder which has friction-dashboard folder containing src, public, package.json, and tailwind.config.js

arduino folder which has friction_meter.ino

README.md file

Technical Specifications
Angle measurement range is 0 to 90 degrees.

Angle resolution is 0.1 degrees.

Friction coefficient range is 0 to 2.0.

Measurement accuracy is plus or minus 3 percent.

Arduino sampling rate is 40 Hz.

LCD update rate is 5 Hz.

Dashboard update rate is 2 Hz for measurements and 0.5 Hz for live angle.

License
This project is open source. You can use it, modify it, and build on it. Just give credit where it is due.


Document Version 1.0
Last Updated May 2026



