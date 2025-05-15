import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';
import { 
  AccountCircle as AccountIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  List as ListIcon,
  Gavel as GavelIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const mobileMenuItems = [
    { text: 'Создать лот', icon: <AddIcon />, path: '/create-lot' },
    { text: 'Мои лоты', icon: <ListIcon />, path: '/my-lots' },
    { text: 'Мои ставки', icon: <GavelIcon />, path: '/my-bids' },
    { text: 'Профиль', icon: <PersonIcon />, path: `/profile/${user?.id}` }
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          Антикварный аукцион
        </Typography>

        {isAuthenticated ? (
          <>
            {isMobile ? (
              <>
                <Notifications />
                <IconButton
                  color="inherit"
                  onClick={handleMobileMenuToggle}
                  edge="end"
                >
                  <MenuIcon />
                </IconButton>
                <Drawer
                  anchor="right"
                  open={mobileMenuOpen}
                  onClose={handleMobileMenuClose}
                >
                  <Box sx={{ width: 250 }}>
                    <List>
                      {mobileMenuItems.map((item) => (
                        <ListItem
                          button
                          key={item.text}
                          onClick={() => handleNavigation(item.path)}
                        >
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <ListItemText primary={item.text} />
                        </ListItem>
                      ))}
                      <Divider />
                      <ListItem button onClick={handleLogout}>
                        <ListItemText primary="Выйти" />
                      </ListItem>
                    </List>
                  </Box>
                </Drawer>
              </>
            ) : (
              <>
                <Notifications />
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/create-lot"
                  sx={{ mr: 2 }}
                >
                  Создать лот
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/my-lots"
                  sx={{ mr: 2 }}
                >
                  Мои лоты
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/my-bids"
                  sx={{ mr: 2 }}
                >
                  Мои ставки
                </Button>
                {user && (
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to={`/profile/${user.id}`}
                    startIcon={<AccountIcon />}
                  >
                    Профиль
                  </Button>
                )}
              </>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar
                  src={user?.profileImage || undefined}
                  alt={user?.name || 'Пользователь'}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>
                  <Typography variant="body2">
                    {user?.name || user?.email}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  Выйти
                </MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <Button
            color="inherit"
            component={RouterLink}
            to="/login"
          >
            Войти
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 