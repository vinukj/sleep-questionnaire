import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/variables.css";
import "../styles/components.css";
import "../styles/Navbar.css";

// Icon Components
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Logo component
const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15C35 15 25 25 25 40C25 50 30 58 38 62V75C38 80 42 85 50 85C58 85 62 80 62 75V62C70 58 75 50 75 40C75 25 65 15 50 15Z" 
      stroke="#3b82f6" strokeWidth="3" fill="none"/>
    <path d="M40 35C40 35 45 30 50 35C55 40 60 35 60 35" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    <path d="M35 45C35 45 42 40 50 45C58 50 65 45 65 45" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    <text x="68" y="20" fill="#3b82f6" fontSize="10" fontWeight="bold">z</text>
    <text x="75" y="15" fill="#3b82f6" fontSize="8" fontWeight="bold">z</text>
    <text x="80" y="10" fill="#60a5fa" fontSize="6" fontWeight="bold">z</text>
  </svg>
);

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  }, []);

  // Toggle dark mode
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    document.body.style.overflow = '';
  };

  const isActive = (path) => location.pathname === path;

  const isAdmin = currentUser?.isAdmin || currentUser?.user?.isAdmin;

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header__container">
          {/* Logo */}
          <button onClick={() => navigate("/home")} className="header__logo">
            <Logo />
            <span className="header__logo-text">
              Sleep<span className="header__logo-brand">Maitrix</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="nav" aria-label="Main navigation">
            <ul className="nav__list">
              <li className="nav__item">
                <button
                  onClick={() => navigate("/home")}
                  className={`nav__link ${isActive("/home") ? "nav__link--active" : ""}`}
                >
                  <HomeIcon />
                  Home
                </button>
              </li>
              {isAdmin && (
                <li className="nav__item">
                  <button
                    onClick={() => navigate("/admin")}
                    className={`nav__link ${isActive("/admin") ? "nav__link--active" : ""}`}
                  >
                    <DashboardIcon />
                    Admin Dashboard
                  </button>
                </li>
              )}
              <li className="nav__item">
                <button
                  onClick={() => navigate("/ocr-upload")}
                  className={`nav__link ${isActive("/ocr-upload") ? "nav__link--active" : ""}`}
                >
                  <UploadIcon />
                  Upload Report
                </button>
              </li>
              <li className="nav__item">
                <button onClick={handleLogout} className="nav__link nav__link--danger">
                  <LogoutIcon />
                  Logout
                </button>
              </li>
            </ul>

            {/* Dark Mode Toggle */}
            <button
              className="btn--icon"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={`mobile-menu-btn ${drawerOpen ? 'mobile-menu-btn--open' : ''}`}
            onClick={drawerOpen ? closeDrawer : openDrawer}
            aria-label="Toggle mobile menu"
            aria-expanded={drawerOpen}
          >
            <span className="mobile-menu-btn__line"></span>
            <span className="mobile-menu-btn__line"></span>
            <span className="mobile-menu-btn__line"></span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div className={`drawer-menu ${drawerOpen ? 'drawer-menu--open' : ''}`}>
        <div className="drawer-menu__header">
          <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>Menu</span>
          <button className="drawer-menu__close" onClick={closeDrawer} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>
        <div className="drawer-menu__body">
          <nav className="drawer-menu__nav">
            <button
              onClick={() => { navigate("/home"); closeDrawer(); }}
              className={`drawer-menu__link ${isActive("/home") ? 'drawer-menu__link--active' : ''}`}
            >
              <HomeIcon />
              Home
            </button>
            {isAdmin && (
              <button
                onClick={() => { navigate("/admin"); closeDrawer(); }}
                className={`drawer-menu__link ${isActive("/admin") ? 'drawer-menu__link--active' : ''}`}
              >
                <DashboardIcon />
                Admin Dashboard
              </button>
            )}
            <button
              onClick={() => { navigate("/ocr-upload"); closeDrawer(); }}
              className={`drawer-menu__link ${isActive("/ocr-upload") ? 'drawer-menu__link--active' : ''}`}
            >
              <UploadIcon />
              Upload Report
            </button>
            <button
              onClick={() => { handleLogout(); closeDrawer(); }}
              className="drawer-menu__link"
              style={{ color: '#ef4444' }}
            >
              <LogoutIcon />
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`backdrop ${drawerOpen ? 'backdrop--visible' : ''}`}
        onClick={closeDrawer}
      ></div>
    </>
  );
}
