import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>({ totalLots: 0, soldLots: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = window.location.pathname.split('/').pop();
        const [userResponse, statsResponse] = await Promise.all([
          axios.get(`/api/users/${userId}`),
          axios.get(`/api/users/${userId}/stats`)
        ]);

        setUser(userResponse.data);
        setStats(statsResponse.data);
        setIsOwnProfile(currentUser?.id === userId);
      } catch (err) {
        setError('Не удалось загрузить данные пользователя');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser?.id]);

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`/api/users/${user?.id}`);
      setDeleteDialogOpen(false);
      logout();
      navigate('/');
    } catch (err) {
      setError('Не удалось удалить аккаунт');
      console.error('Error deleting account:', err);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Пользователь не найден</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Avatar
              src={user.profileImage ? `${process.env.REACT_APP_API_URL}/uploads/${user.profileImage}` : undefined}
              sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              {user.name}
            </Typography>
            {isOwnProfile && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Статистика
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{stats.totalLots}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Всего лотов
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{stats.soldLots}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Проданных лотов
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {isOwnProfile && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography variant="h6" color="error" gutterBottom>
                    Опасная зона
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Удалить аккаунт
                  </Button>
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Удаление аккаунта</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить.
            Все ваши лоты и ставки будут удалены.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleDeleteAccount} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 