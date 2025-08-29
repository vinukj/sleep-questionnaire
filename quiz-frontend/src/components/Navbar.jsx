import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-logo">SleepApp</h1>
      </div>

      {/* Hamburger for mobile */}
      <div
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Nav links */}
      <ul className={`navbar-tabs ${menuOpen ? "active" : ""}`}>
        <li className="tab-item" onClick={() => navigate("/home")}>Home</li>
        <li className="tab-item" onClick={() => navigate("/questionnaire")}>Questionnaires</li>
        <li className="tab-item" onClick={() => alert("Profile placeholder")}>Profile</li>
        <li className="tab-item logout" onClick={handleLogout}>Logout</li>
      </ul>
    </nav>
  );
}
