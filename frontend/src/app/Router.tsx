import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { EffectSettingsProvider } from '../effects';
import Layout from './Layout/Layout';
import { Login } from '../auth';
import { ChatPage } from '../chat';

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EffectSettingsProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes with layout */}
            <Route path="/" element={<Layout />}>
              <Route path="chat" element={<ChatPage />} />
              <Route index element={<Navigate to="/chat" replace />} />
            </Route>
            
            {/* Catch all - redirect to chat */}
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </EffectSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Router;