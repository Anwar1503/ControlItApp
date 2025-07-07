import React from "react";
import Navbar from "./Navbar";

const cardStyle = {
  background: "#fff",
  padding: "1.5rem",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  marginBottom: "2rem",
};

const sectionTitle = {
  marginBottom: "1rem",
  fontSize: "1.5rem",
  borderBottom: "2px solid #eee",
  paddingBottom: "0.5rem",
};

const Dashboard = () => (
  <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
    <Navbar />
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "2rem", fontSize: "2rem" }}>
        👋 Welcome to Your Dashboard
      </h2>

      {/* Section: Importance of Control */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>💻 Why Controlling PC Usage is Important</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>🧠 Prevents eye strain and digital fatigue.</li>
          <li>💪 Reduces risk of repetitive strain injuries.</li>
          <li>🏖 Helps maintain a healthy work-life balance.</li>
          <li>🎯 Improves focus and productivity by encouraging regular breaks.</li>
          <li>🪑 Supports better posture and reduces back/neck pain.</li>
        </ul>
      </div>

      {/* Section: Health Tips */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>❤️ Health Tips & Benefits</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>👀 Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.</li>
          <li>🚶 Take short walks or stretch during breaks.</li>
          <li>🧑‍💻 Maintain an ergonomic workstation setup.</li>
          <li>💧 Stay hydrated and avoid excessive caffeine.</li>
          <li>🔵 Use blue light filters to reduce eye strain.</li>
        </ul>
      </div>

      {/* NEW CARD 1 */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>📊 PC Usage Stats Overview</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>Total Screen Time Today: <strong>3h 45m</strong></li>
          <li>Breaks Taken: <strong>4</strong></li>
          <li>Longest Continuous Session: <strong>1h 20m</strong></li>
          <li>Apps Used Most: <strong>Chrome, VSCode, YouTube</strong></li>
        </ul>
      </div>

      {/* NEW CARD 2 */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>🕒 Recommended Usage Schedule</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>8:00 AM - 12:00 PM: Productive Work</li>
          <li>12:00 PM - 1:00 PM: Lunch Break (No Screen)</li>
          <li>1:00 PM - 4:00 PM: Study/Project Time</li>
          <li>4:00 PM - 5:00 PM: Outdoor Activity</li>
          <li>6:00 PM - 8:00 PM: Light Usage (Entertainment or Learning)</li>
        </ul>
      </div>

      {/* NEW CARD 3 */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>🔔 Break Reminders Setup</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>✔️ Reminder Every 45 Minutes</li>
          <li>🧘 Stretching Prompt at 2:00 PM & 4:00 PM</li>
          <li>📵 Auto Lock for 5 Mins After 1h 30m Usage</li>
          <li>🔊 Sound & Popup Notification Enabled</li>
        </ul>
      </div>

      {/* NEW CARD 4 */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>👨‍👩‍👧 Parental Control Insights</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>Child's Screen Time: <strong>2h 15m</strong></li>
          <li>Most Visited Sites: <strong>YouTube Kids, Khan Academy</strong></li>
          <li>Restricted Hours: <strong>9 PM to 7 AM</strong></li>
          <li>Notifications sent: <strong>3 warnings</strong> for extended usage</li>
        </ul>
      </div>
    </div>
  </div>
);

export default Dashboard;
