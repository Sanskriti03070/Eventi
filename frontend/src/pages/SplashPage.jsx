import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function SplashPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate('/home', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div
      data-testid="splash-screen"
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#DC143C' }}
    >
      <h1
        data-testid="splash-logo"
        className="font-logo text-white text-6xl font-bold tracking-wide"
      >
        Eventi
      </h1>
    </div>
  );
}
