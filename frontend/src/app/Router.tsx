import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { EffectSettingsProvider } from '../effects';
import Layout from './Layout/Layout';
import { Login } from '../auth';
import { ChatPage } from '../chat';
import LandingPage from './LandingPage/LandingPage';

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EffectSettingsProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes with layout */}
            <Route path="/app" element={<Layout />}>
              <Route path="chat" element={<ChatPage />} />
              <Route index element={<Navigate to="/app/chat" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </EffectSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Router;