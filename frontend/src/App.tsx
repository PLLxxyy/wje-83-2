import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ConcertDetail from './pages/ConcertDetail';
import Profile from './pages/Profile';
import CreateReview from './pages/CreateReview';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/concert/:id" element={<ConcertDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/create-review" element={<CreateReview />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
