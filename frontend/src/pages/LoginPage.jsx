import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, ErrorAlert } from '../components/ui';
import { Zap, KeyRound, Mail, UserCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('rep@dealflow360.io');
  const [password, setPassword] = useState('Rep@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const demoAccounts = [
    {
      role: 'Sales Representative',
      email: 'rep@dealflow360.io',
      pass: 'Rep@123',
      badge: 'Core Rep',
      desc: 'Builds quotes, triggers margin rules & upsells',
    },
    {
      role: 'Sales Manager',
      email: 'manager@dealflow360.io',
      pass: 'Manager@123',
      badge: 'Approver',
      desc: 'Reviews discount violations & deal health radar',
    },
    {
      role: 'Finance & Operations',
      email: 'finance@dealflow360.io',
      pass: 'Finance@123',
      badge: 'Fulfillment',
      desc: 'Manages warehouse split, billing & invoices',
    },
    {
      role: 'Administrator',
      email: 'admin@dealflow360.io',
      pass: 'Admin@123',
      badge: 'Full Access',
      desc: 'Catalog, pricing rules, approval matrices',
    },
    {
      role: 'Customer Portal',
      email: 'customer@dealflow360.io',
      pass: 'Customer@123',
      badge: 'Client Portal',
      desc: 'Zero-leak customer negotiation & confirmations',
    },
  ];

  const handleSelectDemo = (account) => {
    setEmail(account.email);
    setPassword(account.pass);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login({ email, password });
      toast.success('Welcome Back', `Authenticated as ${res.user.fullName} (${res.user.role})`);

      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (res.user.role === 'Customer') {
        navigate('/portal/my-account', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-3">
          <Zap className="w-6 h-6 fill-white text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          DealFlow<span className="text-blue-400">360</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Intelligent, Self-Governing Sales Operations Platform
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5">
              <ErrorAlert message={error} />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Work Email"
              type="email"
              required
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rep@dealflow360.io"
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                icon={KeyRound}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[29px] text-slate-400 hover:text-slate-600 focus:outline-hidden"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                size="md"
                isLoading={isLoading}
                icon={ArrowRight}
              >
                Sign In to Platform
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quick Demo Personas
              </span>
              <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                1-Click Select
              </span>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((account) => {
                const isSelected = email === account.email;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleSelectDemo(account)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{account.role}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {account.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{account.desc}</p>
                    </div>
                    <UserCheck className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Powered by real ASP.NET Core Web API & Microsoft SQL Server.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
