import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

interface UserStats {
  totalLots: number;
  soldLots: number;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  profileImage: string | null;
  role: string;
}

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userResponse, statsResponse] = await Promise.all([
          axios.get(`/api/users/${id}`),
          axios.get(`/api/users/${id}/stats`)
        ]);
        setUser(userResponse.data);
        setStats(statsResponse.data);
        setIsOwnProfile(currentUser?.id === id);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Не удалось загрузить данные пользователя');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/users/${id}`);
      setDeleteDialogOpen(false);
      if (currentUser?.id === id) {
        logout();
        navigate('/');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.error || 'Не удалось удалить пользователя');
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container>
        <Typography variant="h5" color="error">
          Пользователь не найден
        </Typography>
      </Container>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            src={user.profileImage ? `${process.env.REACT_APP_API_URL}/uploads/${user.profileImage}` : undefined}
            sx={{ width: 100, height: 100, mr: 2 }}
          >
            {user.name?.[0] || '?'}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {user.name || 'Аноним'}
            </Typography>
            {user.email && (isOwnProfile || isAdmin) && (
              <Typography variant="body1" color="text.secondary">
                Email: {user.email}
              </Typography>
            )}
            {isAdmin && (
              <Typography variant="body2" color="text.secondary">
                Роль: {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
              </Typography>
            )}
          </Box>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Статистика
          </Typography>
          <Typography variant="body1">
            Всего лотов: {stats?.totalLots || 0}
          </Typography>
          <Typography variant="body1">
            Проданных лотов: {stats?.soldLots || 0}
          </Typography>
        </Box>

        {(isOwnProfile || isAdmin) && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
          >
            {isOwnProfile ? 'Удалить аккаунт' : 'Удалить пользователя'}
          </Button>
        )}
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          {isOwnProfile ? 'Удаление аккаунта' : 'Удаление пользователя'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {isOwnProfile
              ? 'Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить.'
              : 'Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отменить</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 