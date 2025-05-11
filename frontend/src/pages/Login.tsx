import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axios';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // First, send the Google credential to our backend
      const response = await axios.post('/api/auth/google', {
        credential: credentialResponse.credential
      });
      
      // Then use the JWT token from our backend
      await login(response.data.token);
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Добро пожаловать в Auction App
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Войдите в систему, чтобы начать делать ставки на лоты или создать свои аукционы
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 