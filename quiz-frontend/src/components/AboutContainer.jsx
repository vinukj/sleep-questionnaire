import React, { useState, useEffect } from "react";
import "../styles/AboutContainer.css";

const API_URL = import.meta.env.VITE_API_URL
const AboutContainer = () => {
  const [form, setForm] = useState({ name: "", age: "", weight: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setMessage("");
      try {
        const res = await fetch(`${API_URL}/about/me`, {
          credentials: "include", // IMPORTANT
        });
        const data = await res.json();
        if (data && data.profile) {
          setForm({
            name: data.profile.name || "",
            age: data.profile.age || "",
            weight: data.profile.weight || "",
          });
        }
      } catch (e) {
        setMessage("Failed to load profile.");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/about/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // IMPORTANT
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      setMessage("Profile saved successfully!");
    } catch (e) {
      setMessage("Error submitting profile.");
    }
    setLoading(false);
  };

  return (
    <div className="about-container">
      <h2 className="about-title">About Yourself</h2>
      <form onSubmit={handleSubmit}>
        <h3>Name</h3>
        <input
          type="text"
          className="input-box"
          name="name"
          placeholder="Enter Your Name"
          value={form.name}
          onChange={handleChange}
        />
        <h3>Age</h3>
        <input
          type="number"
          className="input-box"
          name="age"
          placeholder="Enter Your Age"
          value={form.age}
          onChange={handleChange}
        />
        <h3>Weight</h3>
        <input
          type="number"
          className="input-box"
          name="weight"
          placeholder="Enter Your Weight"
          value={form.weight}
          onChange={handleChange}
        />
        <button className="submit-btn" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Submit"}
        </button>
      </form>
      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default AboutContainer;
