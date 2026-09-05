import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { FileQuestion, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 mb-2">404 — Page Not Located</h1>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        The workspace route or resource you are attempting to access does not exist or has been relocated.
      </p>
      <Button onClick={() => navigate('/')}>
        <Home className="w-4 h-4 mr-2" />
        Return to Overview
      </Button>
    </div>
  );
};
