// file: frontend/src/pages/HomeScreen.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import ExcelExportButton from '../components/ExcelExportButton.jsx';
import '../styles/HomeScreen.css';
import { fetchAndCacheAllQuizzes } from '../service/quizCacheService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Alert, Button, CircularProgress } from '@mui/material';
import { BugReport } from '@mui/icons-material';

function HomeScreen() {
  const { currentUser, loading, authFetch, authReady } = useAuth();
  const navigate = useNavigate();
  const [exportMessage, setExportMessage] = useState('');
  const [testDbLoading, setTestDbLoading] = useState(false);
  const [testDbResult, setTestDbResult] = useState(null);

  // Sample patient data for testing export 

  // Export event handlers
  const handleExportStart = (format) => {
    setExportMessage(`Starting ${format.toUpperCase()} export...`);
  };

  const handleExportComplete = (format, fileName) => {
    setExportMessage(`✅ ${format.toUpperCase()} export completed: ${fileName}`);
    setTimeout(() => setExportMessage(''), 5000);
  };

  const handleExportError = (error) => {
    setExportMessage(`❌ Export failed: ${error}`);
    setTimeout(() => setExportMessage(''), 5000);
  };

  // Test database endpoint
const handleTestDatabase = async () => {
  setTestDbLoading(true);
  setTestDbResult(null);

  try {
    console.log('🚀 Testing database connection...');

    const response = await fetch('/api/export/excel', {
      method: 'GET',
      // Include authorization if needed:
      // headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));

    if (!response.ok) {
      // If server returned an error, read as text
      const text = await response.text();
      throw new Error(`Server error ${response.status}: ${text.substring(0, 200)}...`);
    }

    // Treat response as a blob (binary file)
    const blob = await response.blob();

    // Create a temporary link to trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Extract filename from Content-Disposition header if provided
    const disposition = response.headers.get('content-disposition');
    let fileName = 'patients.xlsx'; // default
    if (disposition && disposition.includes('filename=')) {
      fileName = disposition
        .split('filename=')[1]
        .split(';')[0]
        .replace(/"/g, '');
    }

    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    setTestDbResult({
      success: true,
      message: `✅ Excel export ready! File: ${fileName}`,
      data: null
    });
    console.log('✅ File download triggered successfully');

  } catch (error) {
    console.error('Database test error:', error);
    setTestDbResult({
      success: false,
      message: `❌ Database test error: ${error.message}`,
      data: null
    });
  } finally {
    setTestDbLoading(false);
    // Clear result after 10 seconds
    setTimeout(() => setTestDbResult(null), 10000);
  }
};


  useEffect(() => {
    // Redirect to login if auth check finished and user is not authenticated
    if (authReady && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, authReady, navigate]);

  // useEffect(() => {
  //   // Fetch quizzes once the user is logged in
  //   if (currentUser) {
  //     fetchAndCacheAllQuizzes(authFetch, currentUser.user.id);
  //   }
  // }, [currentUser, authFetch]);

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
