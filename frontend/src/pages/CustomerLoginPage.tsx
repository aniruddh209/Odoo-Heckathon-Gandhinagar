import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { portalLogin, isLoading } = useAuth();

  const [quoteId, setQuoteId] = useState(searchParams.get('quoteId') || 'q-demo-001');
  const [token, setToken] = useState(searchParams.get('token') || 'token-secure-portal-sample');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('A secure portal access token is required.');
      return;
    }

    try {
      portalLogin(quoteId.trim(), token.trim());
      if (quoteId) {
        navigate(`/portal/quotes/${quoteId.trim()}`);
      } else {
        navigate('/portal/quotes');
      }
    } catch (err: unknown) {
      setError('Unable to authenticate into customer portal. Please check the access link sent to your email.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2.5">
          <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            DealFlow<span className="text-blue-500">Portal</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-white">Customer Negotiation Access</h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Secure, zero-leak portal to review proposals, negotiate line items, and execute orders.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-xl border border-slate-700/80 rounded-2xl sm:px-10 text-white">
          {error && (
            <div className="mb-4">
              <Alert variant="danger" message={error} onClose={() => setError(null)} />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Quotation Reference / ID
              </label>
              <input
                type="text"
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                placeholder="e.g., Q-2026-0042"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Security Access Token / Magic Link
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter access token from your invite email"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <Button type="submit" className="w-full justify-center bg-blue-600 hover:bg-blue-700" size="lg" isLoading={isLoading}>
              Enter Secure Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200">
              Staff Member? Return to Internal DealFlow360 Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
