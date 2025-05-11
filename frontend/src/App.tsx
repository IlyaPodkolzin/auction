import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateLot from './pages/CreateLot';
import LotDetails from './pages/LotDetails';
import MyLots from './pages/MyLots';
import MyBids from './pages/MyBids';

const theme = createTheme({
  // ... your theme configuration
});

const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Router {...router}>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/lots/create" element={<CreateLot />} />
              <Route path="/lots/:id" element={<LotDetails />} />
              <Route path="/my-lots" element={<MyLots />} />
              <Route path="/my-bids" element={<MyBids />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 