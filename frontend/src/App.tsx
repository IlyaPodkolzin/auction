import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateLot from './pages/CreateLot';
import LotDetails from './pages/LotDetails';
import MyLots from './pages/MyLots';
import MyBids from './pages/MyBids';
import ProtectedRoute from './components/ProtectedRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/my-lots"
                element={
                  <ProtectedRoute>
                    <MyLots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-lot"
                element={
                  <ProtectedRoute>
                    <CreateLot />
                  </ProtectedRoute>
                }
              />
              <Route path="/lots/:id" element={<LotDetails />} />
              <Route
                path="/my-bids"
                element={
                  <ProtectedRoute>
                    <MyBids />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 