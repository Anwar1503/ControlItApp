import React from "react";
import Navbar from "./Navbar";

const About = () => (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <h2>About Time Based Break App</h2>
            <p>
            <strong>Time Based Break App</strong> is designed to help you maintain a healthy relationship with your computer by encouraging regular breaks and mindful usage. 
            Our goal is to promote better health, productivity, and well-being for everyone who spends long hours at their PC.
            </p>
            <h3>Features</h3>
            <ul>
            <li>Reminds you to take regular breaks</li>
            <li>Helps prevent eye strain and fatigue</li>
            <li>Encourages healthy work habits</li>
            <li>Easy-to-use interface</li>
            <li>Customizable break intervals</li>
            </ul>
            <h3>Why Use This App?</h3>
            <p>
            Prolonged computer use can lead to health issues such as eye strain, repetitive stress injuries, and poor posture. 
            Taking regular breaks can help you stay refreshed, focused, and healthy.
            </p>
            <p>
            Thank you for choosing Time Based Break App to support your digital well-being!
            </p>
        </div>
    </div>
);

export default About;