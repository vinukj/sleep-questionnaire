import React from "react";
import "../styles/AboutContainer.css";

const AboutContainer = () => {
  return (
    <div className="about-container">
      <h2 className="about-title">About Yourself</h2>

      <input
        type="text"
        className="input-box"
        placeholder="Enter Your Name"
      />
      <input
        type="number"
        className="input-box"
        placeholder="Enter Your Age"
      />
      <input
        type="number"
        className="input-box"
        placeholder="Enter Your Weight"
      />

      <button className="submit-btn">Submit</button>
    </div>
  );
};

export default AboutContainer;
