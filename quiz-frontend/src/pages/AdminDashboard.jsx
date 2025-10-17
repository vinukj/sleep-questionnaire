import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Tooltip,
  TextField
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
import { useNavigate } from "react-router-dom";


import Navbar from '../components/Navbar.jsx';

/**
 * Simple debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Admin Dashboard Component
 * Provides admin functionality including data export and response management
 */
const AdminDashboard = () => {
  const { currentUser: user, authFetch } = useAuth();
  const navigate = useNavigate();
  const allResponsesRef = useRef(null); // Ref for All Responses section
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalResponses: 0,
    totalUsers: 0,
    recentResponses: []
  });
  const [responses, setResponses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState(""); // For controlled input
  const [tableLoading, setTableLoading] = useState(false); // Separate loading for table only
  const [paginationData, setPaginationData] = useState({
    total: 0,
    page: 0,
    pageSize: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    console.log('Admin dashboard mounted');
  }, []);

  // Load statistics only once on mount
  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  // Load table data when pagination or search changes
  useEffect(() => {
    if (user) {
      loadTableData();
    }
  }, [user, page, rowsPerPage, searchQuery]);

  // Load statistics (total counts and recent responses) - runs once
  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all responses for statistics (no pagination, no search)
      const response = await authFetch('/questionnaire/admin/all-responses?page=0&limit=10000');
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard statistics');
      }

      const data = await response.json();
      const allResponses = data.responses || [];

      // Calculate statistics
      const uniqueUsers = new Set(allResponses.map(r => r.user_id)).size;
      const recentResponses = allResponses
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalResponses: data.pagination?.total || allResponses.length,
        totalUsers: uniqueUsers,
        recentResponses: recentResponses
      });
    } catch (err) {
      console.error('Statistics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load table data (with pagination and search) - runs on search/pagination change
  const loadTableData = async () => {
    try {
      setTableLoading(true);
      setError(null);

      // Build query string with pagination and search
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString()
      });
      
      // Add search parameter if search query exists
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      // Fetch questionnaire responses with pagination and search
      const response = await authFetch(
        `/questionnaire/admin/all-responses?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load table data');
      }

      const data = await response.json();
      const allResponses = data.responses || [];

      // Set pagination data from backend response
      if (data.pagination) {
        setPaginationData(data.pagination);
      }

      setResponses(allResponses);
    } catch (err) {
      console.error('Table data error:', err);
      setError(err.message);
    } finally {
      setTableLoading(false);
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
      return data.issScore || data.scores.issScore || 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const handleModifyResponses = () => {
    // Smooth scroll to All Responses table
    if (allResponsesRef.current) {
      allResponsesRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const handleViewResponse = (response) => {
    navigate("/STJohnquestionnaire", { 
      state: { 
        responseData: response.response_data,
        responseId: response.id,
        isEditing: true 
      } 
    });
  };

  const handleRefresh = () => {
    loadStatistics();
    loadTableData();
  };

  // Use useRef to store the debounce timeout
  const searchTimeoutRef = useRef(null);
  const MIN_SEARCH_LENGTH = 2; // Minimum characters before searching

  // Optimized search handler with proper debouncing
  const handleSearchInput = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value); // Update input immediately for UI responsiveness
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If search is cleared, reset immediately
    if (value.trim() === '') {
      setSearchQuery('');
      setPage(0);
      return;
    }
    
    // Only search if minimum length met
    if (value.trim().length < MIN_SEARCH_LENGTH) {
      return; // Don't search yet, wait for more characters
    }
    
    // Set new timeout - only fires after user stops typing for 500ms
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(0); // Reset to first page when searching
    }, 500); // 500ms delay
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        View All/ Edit Responses
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Modify Patient Responses
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleModifyResponses}
                      >
                        Edit Responses
                      </Button>
                    </Box>
                    <People color="primary" sx={{ fontSize: 40 }} />
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
                  onClick={handleRefresh}
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

          {/* Search Bar */}
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Search by Hospital ID, Name, Email, or Phone"
              variant="outlined"
              fullWidth
              value={searchInput}
              onChange={handleSearchInput}
              helperText="Type at least 2 characters to search. Search triggers 0.5s after you stop typing."
            />
          </Box>

          {/* All Responses Table */}
          <Paper ref={allResponsesRef}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                All Questionnaire Responses
              </Typography>
              
              {tableLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <>
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
                        {responses.map((response) => (
                          <TableRow key={response.id}>
                            <TableCell>{response.response_data.hospital_id}</TableCell>
                            <TableCell>{response.response_data.name || 'N/A'}</TableCell>
                            <TableCell>{response.response_data.email || '-'}</TableCell>
                            <TableCell>{getScoreFromResponse(response.response_data)}</TableCell>
                            <TableCell>{formatDate(response.created_at)}</TableCell>
                            <TableCell align="center">
                          <Tooltip title="Edit/View Response">
                            <IconButton size="small" onClick={() => handleViewResponse(response)}>
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
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={paginationData.total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
                </>
              )}
            </Box>
          </Paper>
        </>
      )}
    </Container>
                </>
  );
};

export default AdminDashboard;