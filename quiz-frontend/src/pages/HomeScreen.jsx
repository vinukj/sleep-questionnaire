// file: frontend/src/pages/HomeScreen.jsx
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import ExcelExportButton from '../components/ExcelExportButton.jsx';
import '../styles/HomeScreen.css';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Alert, Button, CircularProgress } from '@mui/material';
import { BugReport } from '@mui/icons-material';

function HomeScreen() {
  const { currentUser, authReady } = useAuth();
  const navigate = useNavigate();

  // Sample patient data for testing export - removed unused handlers and test functions


  useEffect(() => {
    // Redirect to login if auth check finished and user is not authenticated
    if (authReady && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, authReady, navigate]);

  if (!authReady) {
    return (
      <div className="home-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <>
      <Navbar />
      <div className="home-container">
        <main className="home-main">
          <Typography variant="h4" component="h2" gutterBottom>
            Welcome {currentUser.user ? currentUser.user.email : currentUser.email}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
      
          </Typography>


          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
            
            {/* Questionnaire Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sleep Questionnaire
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Complete the comprehensive sleep assessment questionnaire
                </Typography>
                <Link to="/STJohnquestionnaire" className="start-quiz-button">
                  Start Questionnaire
                </Link>
              </CardContent>
            </Card>

          </Box>
        </main>
      </div>
    </>
  );
}

export default HomeScreen;
