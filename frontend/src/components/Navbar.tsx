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
  MenuItem
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();

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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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