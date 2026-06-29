import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import os

print("=" * 60)
print("SLIDER-CRANK MECHANISM SIMULATION")
print("=" * 60)

# ===================== PARAMETERS =====================
crank_length = 1.0
connecting_rod_length = 3.0
crank_angular_velocity = 2 * np.pi
duration = 2.0
fps = 20  # Lower FPS for smaller file
frames = int(duration * fps)
t = np.linspace(0, duration, frames)

print(f"Parameters: Crank={crank_length}m, Rod={connecting_rod_length}m")

# ===================== KINEMATICS =====================
theta = crank_angular_velocity * t
x_crank = crank_length * np.cos(theta)
y_crank = crank_length * np.sin(theta)
x_slider = crank_length * np.cos(theta) + np.sqrt(connecting_rod_length**2 - (crank_length * np.sin(theta))**2)
velocity_slider = np.gradient(x_slider, t[1]-t[0])
theta_deg = np.degrees(theta)

# ===================== GRAPHS =====================
fig1, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 8))
fig1.suptitle('Slider-Crank Mechanism Analysis')

ax1.plot(t, x_slider, 'b-', linewidth=2)
ax1.set_xlabel('Time (s)')
ax1.set_ylabel('Position (m)')
ax1.set_title('Piston Position')
ax1.grid(True)

ax2.plot(t, velocity_slider, 'r-', linewidth=2)
ax2.set_xlabel('Time (s)')
ax2.set_ylabel('Velocity (m/s)')
ax2.set_title('Piston Velocity')
ax2.grid(True)

ax3.plot(theta_deg, x_slider, 'm-', linewidth=2)
ax3.set_xlabel('Crank Angle (degrees)')
ax3.set_ylabel('Position (m)')
ax3.set_title('Position vs Angle')
ax3.grid(True)

# Simple animation preview (static frame)
ax4.plot(x_crank, y_crank, 'o-', linewidth=2)
ax4.set_xlim(-1.5, 1.5)
ax4.set_ylim(-1.5, 1.5)
ax4.set_aspect('equal')
ax4.set_title('Crank Path')
ax4.grid(True)

plt.tight_layout()
plt.savefig('slider_crank_graphs.png', dpi=150)
print("✅ Graphs saved as 'slider_crank_graphs.png'")

# ===================== SIMPLE ANIMATION =====================
print("\n🎬 Creating animation...")

fig2, ax = plt.subplots(figsize=(10, 6))
ax.set_xlim(-1.5, 5)
ax.set_ylim(-1.5, 1.5)
ax.set_aspect('equal')
ax.set_xlabel('X Position (m)')
ax.set_ylabel('Y Position (m)')
ax.set_title('Slider-Crank Mechanism Animation')
ax.grid(True, alpha=0.3)
ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5)

# Draw crank circle
circle = plt.Circle((0, 0), crank_length, fill=False, color='red', alpha=0.3)
ax.add_patch(circle)

# Initialize elements
crank_line, = ax.plot([], [], 'ro-', linewidth=3, markersize=8)
rod_line, = ax.plot([], [], 'bo-', linewidth=2, markersize=6)
slider, = ax.plot([], [], 'gs', markersize=12)
trail, = ax.plot([], [], 'gray', linewidth=1, alpha=0.5)
info_text = ax.text(0.02, 0.95, '', transform=ax.transAxes, 
                    bbox=dict(boxstyle="round", facecolor='wheat', alpha=0.8))

trail_x, trail_y = [], []

def init():
    crank_line.set_data([], [])
    rod_line.set_data([], [])
    slider.set_data([], [])
    trail.set_data([], [])
    info_text.set_text('')
    return crank_line, rod_line, slider, trail, info_text

def update(frame):
    # Update crank and rod
    crank_line.set_data([0, x_crank[frame]], [0, y_crank[frame]])
    rod_line.set_data([x_crank[frame], x_slider[frame]], [y_crank[frame], 0])
    slider.set_data([x_slider[frame]], [0])
    
    # Update trail
    trail_x.append(x_slider[frame])
    trail_y.append(0)
    if len(trail_x) > 50:
        trail_x.pop(0)
        trail_y.pop(0)
    trail.set_data(trail_x, trail_y)
    
    # Update info
    info_text.set_text(f'Angle: {theta_deg[frame]:5.1f}° | Position: {x_slider[frame]:5.2f}m | Velocity: {velocity_slider[frame]:5.2f}m/s')
    
    return crank_line, rod_line, slider, trail, info_text

# Create animation
ani = FuncAnimation(fig2, update, frames=range(0, frames, 2),  # Skip every other frame for smaller file
                    init_func=init, blit=True, interval=100, repeat=True)

# ===================== SAVE AS GIF =====================
print("💾 Saving animation as GIF...")

# Try different saving methods
saved = False

# Method 1: Try with Pillow
try:
    from matplotlib.animation import PillowWriter
    writer = PillowWriter(fps=10)  # Lower FPS for smaller file
    ani.save('slider_crank_animation.gif', writer=writer)
    if os.path.exists('slider_crank_animation.gif'):
        size = os.path.getsize('slider_crank_animation.gif')
        print(f"✅ GIF saved: slider_crank_animation.gif ({size/1024:.1f} KB)")
        saved = True
except Exception as e:
    print(f"⚠️ Pillow save failed: {e}")

# Method 2: Try with HTML (always works)
if not saved:
    try:
        from matplotlib.animation import HTMLWriter
        ani.save('slider_crank_animation.html', writer=HTMLWriter(fps=10))
        print("✅ HTML animation saved: slider_crank_animation.html")
        print("   Open this file in your web browser")
        saved = True
    except Exception as e:
        print(f"⚠️ HTML save failed: {e}")

# Method 3: Just display the animation
if not saved:
    print("⚠️ Could not save file, but animation will display on screen")

# ===================== RESULTS =====================
print("\n" + "=" * 60)
print("RESULTS")
print("=" * 60)
print(f"Max position: {np.max(x_slider):.3f} m")
print(f"Min position: {np.min(x_slider):.3f} m")
print(f"Stroke: {np.max(x_slider) - np.min(x_slider):.3f} m")
print(f"Max velocity: {np.max(np.abs(velocity_slider)):.3f} m/s")

print("\n📁 Files saved:")
for file in ['slider_crank_graphs.png', 'slider_crank_animation.gif', 'slider_crank_animation.html']:
    if os.path.exists(file):
        size = os.path.getsize(file)
        print(f"   ✅ {file} ({size/1024:.1f} KB)")

print("\n🎬 Opening animation window...")
plt.show()
print("✅ Done!")