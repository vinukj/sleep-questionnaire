import React, { useState, useEffect } from "react";
import "../styles/AboutContainer.css";

const AboutContainer = () => {
  const [form, setForm] = useState({ name: "", age: "", weight: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // On mount: fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setMessage("");
      try {
        const res = await fetch("/about-user/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        if (data && data.profile) {
          setForm({
            name: data.profile.name || "",
            age: data.profile.age || "",
            weight: data.profile.weight || ""
          });
        }
      } catch (e) {
        setMessage("Failed to load profile.");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);
  
  // Handle form input changes
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/about-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(form)
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
        <input
          type="text"
          className="input-box"
          name="name"
          placeholder="Enter Your Name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="number"
          className="input-box"
          name="age"
          placeholder="Enter Your Age"
          value={form.age}
          onChange={handleChange}
        />
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
