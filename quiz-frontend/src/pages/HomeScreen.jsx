import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000';

function HomeScreen() {
  const [user, setUser] = useState(null); // store user data

  const getProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unauthorized or invalid token");
      }

      const data = await response.json();
      console.log("Profile Data:", data);
      setUser(data.user); // save user object in state
    } catch (error) {
      console.error("Error fetching profile:", error.message);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  return (
    <div>
      <h1>Welcome</h1>
      {user ? (
        <div>
         
          <p>{user.email}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}

export default HomeScreen;
