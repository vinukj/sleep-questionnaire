import * as React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { text: "Home", path: "/home" },
    ...((currentUser?.isAdmin || currentUser?.user?.isAdmin) ? [{ text: "Admin Dashboard", path: "/admin" }] : []),
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "#f8fcfe", // light clean background
          color: "black",
          px: { xs: 2, md: 8 },
          borderBottom: "1px solid #e0e0e0", // subtle bottom border
        }}
      >
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          {/* Mobile Hamburger */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setOpen(true)}
              aria-label="open navigation menu"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo / Title */}
          <Typography
            variant="h6"
            onClick={() => navigate("/home")}
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            St.John's
          </Typography>

          {/* Desktop Menu */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 4, alignItems: "center" }}>
              {menuItems.map(({ text, path }) => (
                <Button
                  key={text}
                  onClick={() => navigate(path)}
                  sx={{
                    fontWeight: 500,
                    textTransform: "none",
                    color: "black",
                    "&:hover": { color: "#1976d2", bgcolor: "transparent" },
                  }}
                >
                  {text}
                </Button>
              ))}
              <Button
                onClick={handleLogout}
                sx={{
                  fontWeight: 500,
                  textTransform: "none",
                  color: "black",
                  "&:hover": { color: "red", bgcolor: "transparent" },
                }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 250, bgcolor: "#ffffff" },
        }}
      >
        <Box
          sx={{
            p: 2,
            fontWeight: "bold",
            fontSize: "1.1rem",
            color: "#0d47a1",
          }}
        >
          Menu
        </Box>
        <List>
          {menuItems.map(({ text, path }) => (
            <ListItemButton
              key={text}
              onClick={() => {
                navigate(path);
                setOpen(false);
              }}
              sx={{
                "&:hover": { bgcolor: "rgba(25,118,210,0.08)" },
              }}
            >
              <ListItemText
                primary={text}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          ))}
          <ListItemButton
            onClick={() => {
              handleLogout();
              setOpen(false);
            }}
            sx={{
              "&:hover": { bgcolor: "rgba(255,0,0,0.08)" },
            }}
          >
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontWeight: 500,
                color: "error.main",
              }}
            />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}
