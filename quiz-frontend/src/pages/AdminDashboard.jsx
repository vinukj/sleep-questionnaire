import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Dashboard,
  People,
  Assessment,
  Download,
  Visibility,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ExcelExportButton from '../components/ExcelExportButton';

import Navbar from '../components/Navbar.jsx';
/**
 * Admin Dashboard Component
 * Provides admin functionality including data export and response management
 */
const AdminDashboard = () => {
  const { currentUser: user, authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalResponses: 0,
    totalUsers: 0,
    recentResponses: []
  });
  const [responses, 
    
    
    setResponses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

useEffect(() => {
  console.log('Admin dashboard mounted');
}, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all questionnaire responses for admin view
      const response = await authFetch('/questionnaire/admin/all-responses');
      
      if (!response.ok) {
        throw new Error('Failed to load admin dashboard data');
      }

      const data = await response.json();
      const allResponses = data.responses || [];

      // Calculate statistics
      const uniqueUsers = new Set(allResponses.map(r => r.user_id)).size;
      const recentResponses = allResponses
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalResponses: allResponses.length,
        totalUsers: uniqueUsers,
        recentResponses: recentResponses
      });

      setResponses(allResponses);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreFromResponse = (responseData) => {
    try {
      const data = typeof responseData === 'string' 
        ? JSON.parse(responseData) 
        : responseData;
      return data.scores.issScore || 'N/A';
    } catch {
      return 'N/A';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please log in to access the admin dashboard.
        </Alert>
      </Container>
    );
  }

  return (<>
    <Navbar />
    <Container maxWidth="lg" sx={{ py: 4 }}>
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Dashboard sx={{ mr: 2, verticalAlign: 'bottom' }} />
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage questionnaire responses and export data
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Total Responses
                      </Typography>
                      <Typography variant="h4">
                        {stats.totalResponses}
                      </Typography>
                    </Box>
                    <Assessment color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Total Users
                      </Typography>
                      <Typography variant="h4">
                        {stats.totalUsers}
                      </Typography>
                    </Box>
                    <People color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid> */}

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Export Data
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Download all responses
                      </Typography>
                      <ExcelExportButton 
                        fileName="questionnaire_responses_admin"
                        size="small"
                        variant="outlined"
                        onExportStart={(format) => console.log(`Admin export started: ${format}`)}
                        onExportComplete={(format, fileName) => {
                          console.log(`Admin export completed: ${fileName}`);
                        }}
                        onExportError={(error) => {
                          setError(`Export failed: ${error}`);
                        }}
                      />
                    </Box>
                    <Download color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Responses */}
          <Paper sx={{ mb: 4 }}>
            <Box sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Recent Responses
                </Typography>
                <Button
                  startIcon={<Refresh />}
                  onClick={loadDashboardData}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              
              {stats.recentResponses.length === 0 ? (
                <Typography color="text.secondary" align="center" py={4}>
                  No responses found
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {stats.recentResponses.map((response) => (
                    <Grid item xs={12} key={response.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start">
                            <Box>
                              <Typography variant="subtitle2">
                                {response.response_data.name || response.response_data.email || 'Unknown User'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Score: {getScoreFromResponse(response.response_data)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(response.created_at)}
                              </Typography>
                            </Box>
                            <Chip 
                              size="small" 
                              label="Completed" 
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>

          {/* All Responses Table */}
          <Paper>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                All Questionnaire Responses
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Hospital ID</TableCell>
                      <TableCell>Patient Name</TableCell>
                      <TableCell>Patient Email</TableCell>
                      <TableCell>ISS Score</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responses
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((response) => (
                        <TableRow key={response.id}>
                          <TableCell>{response.response_data.hospital_id}</TableCell>
                          <TableCell>{response.response_data.name || 'N/A'}</TableCell>
                          <TableCell>{response.response_data.email || '-'}</TableCell>
                          <TableCell>{getScoreFromResponse(response.response_data)}</TableCell>
                          <TableCell>{formatDate(response.created_at)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Response Details">
                              <IconButton size="small">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={responses.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          </Paper>
        </>
      )}
    </Container>
                </>
  );
};

export default AdminDashboard;