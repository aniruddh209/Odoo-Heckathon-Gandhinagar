import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Workspace Not Found</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested route or operational resource does not exist in DealFlow360.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
