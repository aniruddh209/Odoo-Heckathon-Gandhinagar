import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { Layers, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('sales.rep@dealflow360.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ Email: email, Password: password });
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed. Please verify credentials.');
      } else {
        setError('Login failed. Please verify credentials.');
      }
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2.5">
          <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Layers className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            DealFlow<span className="text-blue-600">360</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Commercial Quoting, Margin Governance & Multi-Warehouse Fulfillment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4">
              <Alert variant="danger" message={error} onClose={() => setError(null)} />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-700">
                  Remember session
                </label>
              </div>

              <div className="text-xs">
                <a href="#forgot" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button type="submit" className="w-full justify-center" size="lg" isLoading={isLoading}>
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Persona Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Quick Switch Persona (Development)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('sales.rep@dealflow360.com')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 text-slate-700"
              >
                <div className="font-semibold text-slate-800">Sales Rep</div>
                <div className="text-[10px] text-slate-400">Quotes & Orders</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sales.mgr@dealflow360.com')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 text-slate-700"
              >
                <div className="font-semibold text-slate-800">Sales Manager</div>
                <div className="text-[10px] text-slate-400">Tier 1 Approvals</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('finance.ops@dealflow360.com')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 text-slate-700"
              >
                <div className="font-semibold text-slate-800">Finance & Ops</div>
                <div className="text-[10px] text-slate-400">Tier 2 & Invoicing</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@dealflow360.com')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 text-slate-700"
              >
                <div className="font-semibold text-slate-800">System Admin</div>
                <div className="text-[10px] text-slate-400">Master Config</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need an account?{' '}
            <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
              Create staff account
            </Link>
          </div>

          <div className="mt-3 text-center text-xs">
            <Link to="/portal/login" className="text-slate-400 hover:text-slate-600">
              Are you a client? Access Customer Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
