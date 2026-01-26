import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar.jsx';
import ExcelExportButton from '../components/ExcelExportButton';
import InlineOCRUpload from '../components/InlineOCRUpload';
import logger from '../utils/logger';
import '../styles/variables.css';
import '../styles/components.css';
import '../styles/AdminDashboard.css';

// Icon Components
const SearchIcon = () => (
  <svg className="icon icon--search" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChartIcon = () => (
  <svg className="icon icon--stat" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V16C3 17.1046 3.89543 18 5 18H21M7 14L12 9L16 13L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefreshIcon = () => (
  <svg className="icon icon--btn" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1046 3.19133 13.1263 5M13 2V5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg className="icon icon--btn" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 13V15C17 15.5304 16.7893 16.0391 16.4142 16.4142C16.0391 16.7893 15.5304 17 15 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V13M6 9L10 13M10 13L14 9M10 13V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg className="icon icon--action" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ViewIcon = () => (
  <svg className="icon icon--action" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UploadIcon = () => (
  <svg className="icon icon--action" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteIcon = () => (
  <svg className="icon icon--action" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserPlusIcon = () => (
  <svg className="icon icon--btn" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 8V14M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg className="icon icon--btn" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg className="icon icon--btn" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SortIcon = () => (
  <svg className="table__sort-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2V10M6 2L3 5M6 2L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AdminDashboard = () => {
  const { currentUser: user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalResponses: 0,
    recentResponses: []
  });
  const [responses, setResponses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [paginationData, setPaginationData] = useState({
    total: 0,
    page: 0,
    pageSize: 10,
    totalPages: 0
  });

  const searchTimeoutRef = useRef(null);
  const MIN_SEARCH_LENGTH = 2;

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [addUserLoading, setAddUserLoading] = useState(false);

  // Edit User Roles Modal State
  const [showEditRolesModal, setShowEditRolesModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [editRolesLoading, setEditRolesLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTableData();
    }
  }, [user, page, rowsPerPage, searchQuery]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch('/questionnaire/admin/all-responses?page=0&limit=10000');
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard statistics');
      }

      const data = await response.json();
      const allResponses = data.responses || [];

      const recentResponses = allResponses
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalResponses: data.pagination?.total || allResponses.length,
        recentResponses: recentResponses
      });
    } catch (err) {
      console.error('Statistics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async () => {
    try {
      setTableLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString()
      });
      
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      const response = await authFetch(
        `/questionnaire/admin/all-responses?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load table data');
      }

      const data = await response.json();
      const allResponses = data.responses || [];

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

  const handleSearchInput = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim() === '') {
      setSearchQuery('');
      setPage(0);
      return;
    }
    
    if (value.trim().length < MIN_SEARCH_LENGTH) {
      return;
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(0);
    }, 500);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreFromResponse = (responseData) => {
    try {
      const data = typeof responseData === 'string' 
        ? JSON.parse(responseData) 
        : responseData;
      
      const score = data.issScore ?? data.scores?.issScore ?? null;
      return score !== null && score !== undefined ? score : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score === 'N/A' || score === null || score === undefined) return 'badge--secondary';
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    if (numScore >= 15) return 'badge--danger';
    if (numScore >= 10) return 'badge--warning';
    return 'badge--success';
  };

  const handleViewResponse = (response) => {
    navigate(`/view-response/${response.id}`, { 
      state: { 
        responseData: response.response_data,
        responseId: response.id,
        created_at: response.created_at
      } 
    });
  };

  const handleEditResponse = (response) => {
    navigate(`/edit-response/${response.id}`, { 
      state: { 
        responseData: response.response_data,
        responseId: response.id,
        patientName: response.response_data.name || 'Unknown Patient',
        patientId: response.response_data.hospital_id || response.id,
        hospitalId: response.response_data.hospital_id,
        lastModified: response.updated_at || response.created_at
      } 
    });
  };

  const handleRefresh = () => {
    loadStatistics();
    loadTableData();
  };

  const handleDelete = async (responseId) => {
    if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await authFetch(`/questionnaire/admin/response/${responseId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete response');
      }
      
      handleRefresh();
      logger.success('Response deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!addUserForm.name || !addUserForm.email || !addUserForm.password) {
      setError('All fields are required');
      return;
    }
    
    try {
      setAddUserLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addUserForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      logger.success(`User created successfully with role: ${addUserForm.role}`);
      setShowAddUserModal(false);
      setAddUserForm({ name: '', email: '', password: '', role: 'user' });
    } catch (err) {
      console.error('Add user error:', err);
      setError(err.message);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleAddUserFormChange = (field, value) => {
    setAddUserForm(prev => ({ ...prev, [field]: value }));
  };

  const loadAllUsers = async () => {
    try {
      setEditRolesLoading(true);
      const response = await authFetch('/auth/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (err) {
      console.error('Load users error:', err);
      setError(err.message);
    } finally {
      setEditRolesLoading(false);
    }
  };

  const handleOpenEditRoles = async () => {
    setShowEditRolesModal(true);
    await loadAllUsers();
  };

  const handleSelectUser = (userId) => {
    const user = allUsers.find(u => u.id === parseInt(userId));
    setSelectedUser(user);
    setNewRole(user?.role || 'user');
  };

  const handleUpdateUserRole = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }
    
    try {
      setEditRolesLoading(true);
      setError(null);
      
      const response = await authFetch('/auth/admin/users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: newRole
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      
      logger.success(`User role updated to ${newRole}`);
      setShowEditRolesModal(false);
      setSelectedUser(null);
      setNewRole('');
      await loadAllUsers(); // Refresh user list
    } catch (err) {
      console.error('Update role error:', err);
      setError(err.message);
    } finally {
      setEditRolesLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="admin-loading">
        <div className="alert alert--warning">
          Please log in to access the admin dashboard.
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="admin-main">
        <div className="admin-container">
          {/* Page Header */}
          <div className="admin-header">
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage questionnaire responses and export data</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert--error" style={{ marginBottom: '1.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
            </div>
          )}

          {loading ? (
            <div className="admin-loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {/* Search Box */}
              <div className="card admin-search-card">
                <div className="input-wrapper">
                  <SearchIcon />
                  <input
                    type="search"
                    className="input"
                    placeholder="Search by Hospital ID, Name, Email, or Phone"
                    value={searchInput}
                    onChange={handleSearchInput}
                    aria-label="Search responses"
                  />
                </div>
                <p className="admin-search-hint">
                  Type at least 2 characters to search. Results trigger after 0.5s typing.
                </p>
              </div>

              {/* Stats Cards Grid */}
              <div className="admin-stats-grid">
                {/* Total Responses Card */}
                <div className="card admin-stat-card">
                  <div className="admin-stat-content">
                    <p className="admin-stat-label">Total Responses</p>
                    <h2 className="admin-stat-value">{stats.totalResponses}</h2>
                  </div>
                  <div className="admin-stat-icon">
                    <ChartIcon />
                  </div>
                </div>

                {/* View All Responses Button Card */}
                <a href="#responses-table" className="card card--clickable card--primary">
                  <div className="card__content">
                    <h3 className="card__title">View All Responses</h3>
                  </div>
                </a>

                {/* Export Button Card */}
                <div className="card card--clickable card--secondary">
                  <ExcelExportButton 
                    fileName="questionnaire_responses_admin"
                    className="card__export-btn"
                    onExportStart={(format) => logger.info(`Admin export started: ${format}`)}
                    onExportComplete={(format, fileName) => {
                      logger.success(`Admin export completed: ${fileName}`);
                    }}
                    onExportError={(error) => {
                      setError(`Export failed: ${error}`);
                    }}
                  >
                    <div className="card__content card__content--icon">
                      <DownloadIcon />
                      <h3 className="card__title">Export All Responses</h3>
                    </div>
                  </ExcelExportButton>
                </div>

                {/* Add User Button Card - Only for Super Admins */}
                {(user?.role === 'admin' || user?.user?.role === 'admin') && (
                  <button 
                    className="card card--clickable card--success"
                    onClick={() => setShowAddUserModal(true)}
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    <div className="card__content card__content--icon">
                      <UserPlusIcon />
                      <h3 className="card__title">Add New User</h3>
                    </div>
                  </button>
                )}

                {/* Edit User Roles Button Card - Only for Super Admins */}
                {(user?.role === 'admin' || user?.user?.role === 'admin') && (
                  <button 
                    className="card card--clickable card--warning"
                    onClick={handleOpenEditRoles}
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    <div className="card__content card__content--icon">
                      <UsersIcon />
                      <h3 className="card__title">Edit User Roles</h3>
                    </div>
                  </button>
                )}
              </div>

              {/* Recent Responses Section */}
              <div className="card admin-table-card" id="responses-table">
                <div className="admin-table-header">
                  <h2 className="admin-table-title">Recent Responses</h2>
                  <div className="admin-table-actions">
                    <button className="btn btn--secondary" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshIcon />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Data Table */}
                <div className="table__wrapper">
                  {tableLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <div className="spinner"></div>
                    </div>
                  ) : responses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                      No responses found
                    </div>
                  ) : (
                    <table className="table" role="table" aria-label="Recent questionnaire responses">
                      <thead>
                        <tr>
                          <th scope="col">Hospital ID</th>
                          <th scope="col">Patient Name</th>
                          <th scope="col">Patient Email</th>
                          <th scope="col">ISS Score</th>
                          <th scope="col">Date</th>
                          <th scope="col" style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {responses.map((response) => {
                          const score = getScoreFromResponse(response.response_data);
                          return (
                            <tr key={response.id}>
                              <td>{response.response_data.hospital_id || 'N/A'}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 600 }}>{response.response_data.name || 'N/A'}</span>
                                  {/* <InlineOCRUpload
                                    patientId={response.response_data.hospital_id}
                                    patientName={response.response_data.name || 'N/A'}
                                    onUploadSuccess={(data) => {
                                      logger.success(`OCR upload successful for ${data.patientName}`);
                                    }}
                                  /> */}
                                </div>
                              </td>
                              <td>{response.response_data.email || '-'}</td>
                              <td>
                                <span className={`badge ${getScoreBadgeClass(score)}`}>
                                  {score}
                                </span>
                              </td>
                              <td>{formatDate(response.created_at)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div className="table__actions">
                                  <button 
                                    className="table__action-btn" 
                                    onClick={() => handleEditResponse(response)}
                                    aria-label="Edit response" 
                                    title="Edit"
                                  >
                                    <EditIcon />
                                  </button>
                                  <button 
                                    className="table__action-btn" 
                                    onClick={() => handleViewResponse(response)}
                                    aria-label="View response" 
                                    title="View"
                                  >
                                    <ViewIcon />
                                  </button>
                                  <button 
                                    className="table__action-btn table__action-btn--success" 
                                    onClick={() => navigate(`/ocr-upload?patientId=${response.response_data.hospital_id}`)}
                                    aria-label="Upload report" 
                                    title="Upload Report"
                                  >
                                    <UploadIcon />
                                  </button>
                                  <button 
                                    className="table__action-btn table__action-btn--danger" 
                                    onClick={() => handleDelete(response.id)}
                                    aria-label="Delete response" 
                                    title="Delete"
                                  >
                                    <DeleteIcon />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                {!tableLoading && responses.length > 0 && (
                  <div className="table__pagination">
                    <div className="table__pagination-info">
                      Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, paginationData.total)} of {paginationData.total} entries
                    </div>
                    <div className="table__pagination-controls">
                      <button 
                        className="btn btn--secondary" 
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </button>
                      <span style={{ padding: '0 1rem', color: 'var(--color-text-secondary)' }}>
                        Page {page + 1} of {paginationData.totalPages}
                      </span>
                      <button 
                        className="btn btn--secondary" 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= paginationData.totalPages - 1}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Edit User Roles Modal */}
      {showEditRolesModal && (
        <div className="modal-overlay" onClick={() => setShowEditRolesModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Edit User Roles</h2>
              <button 
                className="modal__close"
                onClick={() => setShowEditRolesModal(false)}
                aria-label="Close modal"
              >
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUserRole} className="modal__form">
              <div className="form-group">
                <label htmlFor="selectUser" className="form-label">
                  Select User <span className="form-required">*</span>
                </label>
                <select
                  id="selectUser"
                  className="input"
                  onChange={(e) => handleSelectUser(e.target.value)}
                  value={selectedUser?.id || ''}
                  required
                  disabled={editRolesLoading}
                >
                  <option value="">-- Select a user --</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} - Current Role: {user.role}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <>
                  <div className="form-group">
                    <label className="form-label">User Details</label>
                    <div style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.875rem' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Email:</strong> {selectedUser.email}</p>
                      <p style={{ margin: '0' }}><strong>Current Role:</strong> <span className="badge badge--secondary">{selectedUser.role}</span></p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newRole" className="form-label">
                      New Role <span className="form-required">*</span>
                    </label>
                    <select
                      id="newRole"
                      className="input"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      required
                    >
                      <option value="user">User</option>
                      <option value="physician">Physician</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="form-hint">Select the new role for this user</p>
                  </div>
                </>
              )}

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowEditRolesModal(false)}
                  disabled={editRolesLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={editRolesLoading || !selectedUser}
                >
                  {editRolesLoading ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></span>
                      Updating...
                    </>
                  ) : (
                    <>Update Role</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Roles Modal */}
      {showEditRolesModal && (
        <div className="modal-overlay" onClick={() => setShowEditRolesModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Edit User Roles</h2>
              <button 
                className="modal__close"
                onClick={() => setShowEditRolesModal(false)}
                aria-label="Close modal"
              >
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUserRole} className="modal__form">
              <div className="form-group">
                <label htmlFor="selectUser" className="form-label">
                  Select User <span className="form-required">*</span>
                </label>
                <select
                  id="selectUser"
                  className="input"
                  onChange={(e) => handleSelectUser(e.target.value)}
                  value={selectedUser?.id || ''}
                  required
                  disabled={editRolesLoading}
                >
                  <option value="">-- Select a user --</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} - Current Role: {user.role}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <>
                  <div className="form-group">
                    <label className="form-label">User Details</label>
                    <div style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.875rem' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Email:</strong> {selectedUser.email}</p>
                      <p style={{ margin: '0' }}><strong>Current Role:</strong> <span className="badge badge--secondary">{selectedUser.role}</span></p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newRole" className="form-label">
                      New Role <span className="form-required">*</span>
                    </label>
                    <select
                      id="newRole"
                      className="input"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      required
                    >
                      <option value="user">User</option>
                      <option value="physician">Physician</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="form-hint">Select the new role for this user</p>
                  </div>
                </>
              )}

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowEditRolesModal(false)}
                  disabled={editRolesLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={editRolesLoading || !selectedUser}
                >
                  {editRolesLoading ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></span>
                      Updating...
                    </>
                  ) : (
                    <>Update Role</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Add New User</h2>
              <button 
                className="modal__close"
                onClick={() => setShowAddUserModal(false)}
                aria-label="Close modal"
              >
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="modal__form">
              <div className="form-group">
                <label htmlFor="userName" className="form-label">
                  Full Name <span className="form-required">*</span>
                </label>
                <input
                  id="userName"
                  type="text"
                  className="input"
                  placeholder="Enter full name"
                  value={addUserForm.name}
                  onChange={(e) => handleAddUserFormChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="userEmail" className="form-label">
                  Email <span className="form-required">*</span>
                </label>
                <input
                  id="userEmail"
                  type="email"
                  className="input"
                  placeholder="Enter email address"
                  value={addUserForm.email}
                  onChange={(e) => handleAddUserFormChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="userPassword" className="form-label">
                  Password <span className="form-required">*</span>
                </label>
                <input
                  id="userPassword"
                  type="password"
                  className="input"
                  placeholder="Enter password"
                  value={addUserForm.password}
                  onChange={(e) => handleAddUserFormChange('password', e.target.value)}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="userRole" className="form-label">
                  Role <span className="form-required">*</span>
                </label>
                <select
                  id="userRole"
                  className="input"
                  value={addUserForm.role}
                  onChange={(e) => handleAddUserFormChange('role', e.target.value)}
                  required
                >
                  <option value="user">User</option>
                  <option value="physician">Physician</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="form-hint">User: Basic access | Physician: Admin dashboard access | Admin: Full access</p>
              </div>

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowAddUserModal(false)}
                  disabled={addUserLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={addUserLoading}
                >
                  {addUserLoading ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></span>
                      Creating...
                    </>
                  ) : (
                    <>Create User</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="admin-footer">
        <div className="admin-footer-content">
          <span>&copy; 2024 SleepMaitrix</span>
          <a href="#privacy" className="admin-footer-link">Privacy</a>
          <a href="#terms" className="admin-footer-link">Terms</a>
          <a href="#help" className="admin-footer-link">Help</a>
        </div>
      </footer>
    </>
  );
};

export default AdminDashboard;

/**
 * Simple debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
// Removed: unused debounce function

/**
 * Admin Dashboard Component
 * Provides admin functionality including data export and response management
 */
// const AdminDashboard = () => {
//   const { currentUser: user, authFetch } = useAuth();
//   const navigate = useNavigate();
//   const allResponsesRef = useRef(null); // Ref for All Responses section
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [stats, setStats] = useState({
//     totalResponses: 0,
//     totalUsers: 0,
//     recentResponses: []
//   });
//   const [responses, setResponses] = useState([]);
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchInput, setSearchInput] = useState(""); // For controlled input
//   const [tableLoading, setTableLoading] = useState(false); // Separate loading for table only
//   const [paginationData, setPaginationData] = useState({
//     total: 0,
//     page: 0,
//     pageSize: 10,
//     totalPages: 0,
//     hasNextPage: false,
//     hasPrevPage: false
//   });

//   useEffect(() => {
//     logger.info('Admin dashboard mounted');
//   }, []);

//   // Load statistics only once on mount
//   useEffect(() => {
//     if (user) {
//       loadStatistics();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user]);

//   // Load table data when pagination or search changes
//   useEffect(() => {
//     if (user) {
//       loadTableData();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user, page, rowsPerPage, searchQuery]);

//   // Load statistics (total counts and recent responses) - runs once
//   const loadStatistics = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Fetch all responses for statistics (no pagination, no search)
//       const response = await authFetch('/questionnaire/admin/all-responses?page=0&limit=10000');
      
//       if (!response.ok) {
//         throw new Error('Failed to load dashboard statistics');
//       }

//       const data = await response.json();
//       const allResponses = data.responses || [];

//       // Calculate statistics
//       const uniqueUsers = new Set(allResponses.map(r => r.user_id)).size;
//       const recentResponses = allResponses
//         .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
//         .slice(0, 5);

//       setStats({
//         totalResponses: data.pagination?.total || allResponses.length,
//         totalUsers: uniqueUsers,
//         recentResponses: recentResponses
//       });
//     } catch (err) {
//       console.error('Statistics error:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load table data (with pagination and search) - runs on search/pagination change
//   const loadTableData = async () => {
//     try {
//       setTableLoading(true);
//       setError(null);

//       // Build query string with pagination and search
//       const queryParams = new URLSearchParams({
//         page: page.toString(),
//         limit: rowsPerPage.toString()
//       });
      
//       // Add search parameter if search query exists
//       if (searchQuery.trim()) {
//         queryParams.append('search', searchQuery.trim());
//       }

//       // Fetch questionnaire responses with pagination and search
//       const response = await authFetch(
//         `/questionnaire/admin/all-responses?${queryParams.toString()}`
//       );
      
//       if (!response.ok) {
//         throw new Error('Failed to load table data');
//       }

//       const data = await response.json();
//       const allResponses = data.responses || [];

//       // Set pagination data from backend response
//       if (data.pagination) {
//         setPaginationData(data.pagination);
//       }

//       setResponses(allResponses);
//     } catch (err) {
//       console.error('Table data error:', err);
//       setError(err.message);
//     } finally {
//       setTableLoading(false);
//     }
//   };

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleString();
//   };

//   const getScoreFromResponse = (responseData) => {
//     try {
//       const data = typeof responseData === 'string' 
//         ? JSON.parse(responseData) 
//         : responseData;
      
//       // Check for issScore, handle 0 as valid value
//       const score = data.issScore ?? data.scores?.issScore ?? null;
//       return score !== null && score !== undefined ? score : 'N/A';
//     } catch {
//       return 'N/A';
//     }
//   };

//   const handleModifyResponses = () => {
//     // Smooth scroll to All Responses table
//     if (allResponsesRef.current) {
//       allResponsesRef.current.scrollIntoView({ 
//         behavior: 'smooth', 
//         block: 'start' 
//       });
//     }
//   };

//   const handleViewResponse = (response) => {
//     navigate("/STJohnquestionnaire", { 
//       state: { 
//         responseData: response.response_data,
//         responseId: response.id,
//         isEditing: true 
//       } 
//     });
//   };

//   const handleRefresh = () => {
//     loadStatistics();
//     loadTableData();
//   };

//   // Use useRef to store the debounce timeout
//   const searchTimeoutRef = useRef(null);
//   const MIN_SEARCH_LENGTH = 2; // Minimum characters before searching

//   // Optimized search handler with proper debouncing
//   const handleSearchInput = useCallback((e) => {
//     const value = e.target.value;
//     setSearchInput(value); // Update input immediately for UI responsiveness
    
//     // Clear previous timeout
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }
    
//     // If search is cleared, reset immediately
//     if (value.trim() === '') {
//       setSearchQuery('');
//       setPage(0);
//       return;
//     }
    
//     // Only search if minimum length met
//     if (value.trim().length < MIN_SEARCH_LENGTH) {
//       return; // Don't search yet, wait for more characters
//     }
    
//     // Set new timeout - only fires after user stops typing for 500ms
//     searchTimeoutRef.current = setTimeout(() => {
//       setSearchQuery(value);
//       setPage(0); // Reset to first page when searching
//     }, 500); // 500ms delay
//   }, []);

//   // Cleanup timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }
//     };
//   }, []);

//   if (!user) {
//     return (
//       <Container maxWidth="md" sx={{ py: 4 }}>
//         <Alert severity="warning">
//           Please log in to access the admin dashboard.
//         </Alert>
//       </Container>
//     );
//   }

//   return (<>
//     <Navbar />
//     <Container maxWidth="lg" sx={{ py: 4 }}>
      
//       {/* Header */}
//       <Box sx={{ mb: 4 }}>
//         <Typography variant="h4" component="h1" gutterBottom>
//           <Dashboard sx={{ mr: 2, verticalAlign: 'bottom' }} />
//           Admin Dashboard
//         </Typography>
//         <Typography variant="subtitle1" color="text.secondary">
//           Manage questionnaire responses and export data
//         </Typography>
//       </Box>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
//           {error}
//         </Alert>
//       )}

//       {loading ? (
//         <Box display="flex" justifyContent="center" py={8}>
//           <CircularProgress />
//         </Box>
//       ) : (
//         <>
//           {/* Statistics Cards */}
//           <Grid container spacing={3} sx={{ mb: 4 }}>
//             <Grid item xs={12} sm={6} md={4}>
//               <Card>
//                 <CardContent>
//                   <Box display="flex" alignItems="center" justifyContent="space-between">
//                     <Box>
//                       <Typography color="text.secondary" gutterBottom>
//                         Total Responses
//                       </Typography>
//                       <Typography variant="h4">
//                         {stats.totalResponses}
//                       </Typography>
//                     </Box>
//                     <Assessment color="primary" sx={{ fontSize: 40 }} />
//                   </Box>
//                 </CardContent>
//               </Card>
//             </Grid>

//             {/* <Grid item xs={12} sm={6} md={4}>
//               <Card>
//                 <CardContent>
//                   <Box display="flex" alignItems="center" justifyContent="space-between">
//                     <Box>
//                       <Typography color="text.secondary" gutterBottom>
//                         Total Users
//                       </Typography>
//                       <Typography variant="h4">
//                         {stats.totalUsers}
//                       </Typography>
//                     </Box>
//                     <People color="primary" sx={{ fontSize: 40 }} />
//                   </Box>
//                 </CardContent>
//               </Card>
//             </Grid> */}

//             <Grid item xs={12} sm={6} md={4}>
//               <Card>
//                 <CardContent>
//                   <Box display="flex" alignItems="center" justifyContent="space-between">
//                     <Box>
//                       <Typography color="text.secondary" gutterBottom>
//                         Export Data
//                       </Typography>
//                       <Typography variant="body2" sx={{ mb: 2 }}>
//                         Download all responses
//                       </Typography>
//                       <ExcelExportButton 
//                         fileName="questionnaire_responses_admin"
//                         size="small"
//                         variant="outlined"
//                         onExportStart={(format) => logger.info(`Admin export started: ${format}`)}
//                         onExportComplete={(format, fileName) => {
//                           logger.success(`Admin export completed: ${fileName}`);
//                         }}
//                         onExportError={(error) => {
//                           setError(`Export failed: ${error}`);
//                         }}
//                       />
//                     </Box>
//                     <Download color="primary" sx={{ fontSize: 40 }} />
//                   </Box>
//                 </CardContent>
//               </Card>
//             </Grid>

//             <Grid item xs={12} sm={6} md={4}>
//               <Card>
//                 <CardContent>
//                   <Box display="flex" alignItems="center" justifyContent="space-between">
//                     <Box>
//                       <Typography color="text.secondary" gutterBottom>
//                         View All/ Edit Responses
//                       </Typography>
//                       <Typography variant="body2" sx={{ mb: 2 }}>
//                         Modify Patient Responses
//                       </Typography>
//                       <Button
//                         variant="outlined"
//                         size="small"
//                         onClick={handleModifyResponses}
//                       >
//                         Edit Responses
//                       </Button>
//                     </Box>
//                     <People color="primary" sx={{ fontSize: 40 }} />
//                   </Box>
//                 </CardContent>
//               </Card>
//             </Grid>
//           </Grid>

//           {/* Recent Responses */}
//           <Paper sx={{ mb: 4 }}>
//             <Box sx={{ p: 3 }}>
//               <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//                 <Typography variant="h6">
//                   Recent Responses
//                 </Typography>
//                 <Button
//                   startIcon={<Refresh />}
//                   onClick={handleRefresh}
//                   size="small"
//                 >
//                   Refresh
//                 </Button>
//               </Box>
              
//               {stats.recentResponses.length === 0 ? (
//                 <Typography color="text.secondary" align="center" py={4}>
//                   No responses found
//                 </Typography>
//               ) : (
//                 <Grid container spacing={2}>
//                   {stats.recentResponses.map((response) => (
//                     <Grid item xs={12} key={response.id}>
//                       <Card variant="outlined">
//                         <CardContent>
//                           <Box display="flex" justifyContent="space-between" alignItems="start">
//                             <Box>
//                               <Typography variant="subtitle2">
//                                 {response.response_data.name || response.response_data.email || 'Unknown User'}
//                               </Typography>
//                               <Typography variant="body2" color="text.secondary">
//                                 Score: {getScoreFromResponse(response.response_data)}
//                               </Typography>
//                               <Typography variant="caption" color="text.secondary">
//                                 {formatDate(response.created_at)}
//                               </Typography>
//                             </Box>
//                             <Chip 
//                               size="small" 
//                               label="Completed" 
//                               color="success"
//                               variant="outlined"
//                             />
//                           </Box>
//                         </CardContent>
//                       </Card>
//                     </Grid>
//                   ))}
//                 </Grid>
//               )}
//             </Box>
//           </Paper>

//           {/* Search Bar */}
//           <Box sx={{ mb: 2 }} ref={allResponsesRef}>
//             <TextField
//               label="Search by Hospital ID, Name, Email, or Phone"
//               variant="outlined"
//               fullWidth
//               value={searchInput}
//               onChange={handleSearchInput}
//               helperText="Type at least 2 characters to search. Search triggers 0.5s after you stop typing."
//             />
//           </Box>

//           {/* All Responses Table */}
//           <Paper >
//             <Box sx={{ p: 3 }}>
//               <Typography variant="h6" gutterBottom>
//                 All Questionnaire Responses
//               </Typography>
              
//               {tableLoading ? (
//                 <Box display="flex" justifyContent="center" py={4}>
//                   <CircularProgress size={30} />
//                 </Box>
//               ) : (
//                 <>
//                   <TableContainer>
//                     <Table>
//                       <TableHead>
//                         <TableRow>
//                           <TableCell>Hospital ID</TableCell>
//                           <TableCell>Patient Name</TableCell>
//                           <TableCell>Patient Email</TableCell>
//                           <TableCell>ISS Score</TableCell>
//                           <TableCell>Date</TableCell>
//                           <TableCell align="center">Actions</TableCell>
//                         </TableRow>
//                       </TableHead>
//                       <TableBody>
//                         {responses.map((response) => (
//                           <TableRow key={response.id}>
//                             <TableCell>{response.response_data.hospital_id}</TableCell>
//                             <TableCell>
//                               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                                 {response.response_data.name || 'N/A'}
//                                 <InlineOCRUpload
//                                   patientId={response.response_data.hospital_id}
//                                   patientName={response.response_data.name || 'N/A'}
//                                   onUploadSuccess={(data) => {
//                                     logger.success(`OCR upload successful for ${data.patientName}`);
//                                   }}
//                                 />
//                               </Box>
//                             </TableCell>
//                             <TableCell>{response.response_data.email || '-'}</TableCell>
//                             <TableCell>{getScoreFromResponse(response.response_data)}</TableCell>
//                             <TableCell>{formatDate(response.created_at)}</TableCell>
//                             <TableCell align="center">
//                           <Tooltip title="Edit/View Response">
//                             <IconButton size="small" onClick={() => handleViewResponse(response)}>
//                               <Visibility />
//                             </IconButton>
//                           </Tooltip>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>

//               <TablePagination
//                 rowsPerPageOptions={[5, 10, 25, 50]}
//                 component="div"
//                 count={paginationData.total}
//                 rowsPerPage={rowsPerPage}
//                 page={page}
//                 onPageChange={handleChangePage}
//                 onRowsPerPageChange={handleChangeRowsPerPage}
//               />
//                 </>
//               )}
//             </Box>
//           </Paper>
//         </>
//       )}
//     </Container>
//                 </>
//   );
// };

// export default AdminDashboard;