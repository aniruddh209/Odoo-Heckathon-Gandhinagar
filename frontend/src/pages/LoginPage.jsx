import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api';
import { Button, Input, Modal, ErrorAlert } from '../components/ui';
import {
  Zap,
  KeyRound,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Cpu,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQuickCredentials, setShowQuickCredentials] = useState(false);

  // Forced Password Change State
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const quickRoles = [
    { role: 'Admin', email: 'admin@dealflow360.io', password: 'Admin@123', name: 'Arjun Mehta (Admin)', badge: 'Full Platform Access' },
    { role: 'Sales Manager', email: 'manager@dealflow360.io', password: 'Manager@123', name: 'Rohan Sharma', badge: 'Approvals & Team Mgmt' },
    { role: 'Sales Rep', email: 'rep@dealflow360.io', password: 'Rep@123', name: 'Priya Patel', badge: 'CPQ & Deal Pipeline' },
    { role: 'Finance', email: 'finance@dealflow360.io', password: 'Finance@123', name: 'Sneha Iyer', badge: 'Gross Margin & Invoicing' },
    { role: 'Customer', email: 'customer@dealflow360.io', password: 'Customer@123', name: 'Rahul Verma (Sharma Tech)', badge: 'Client Portal Collaboration' },
  ];

  const handleSelectQuickRole = (item) => {
    setEmail(item.email);
    setPassword(item.password);
    setError(null);
  };

  const getRoleLandingRoute = (role) => {
    switch (role) {
      case 'Customer':
        return '/portal/my-account';
      case 'SalesRep':
      case 'SalesManager':
      case 'FinanceOperations':
      case 'Admin':
      default:
        return '/dashboard';
    }
  };

  const isRouteAllowedForRole = (pathname, role) => {
    if (!pathname || pathname === '/login' || pathname === '/signup') return false;

    // Customer portal accounts are strictly for Customer
    if (pathname.startsWith('/portal/my-account') || pathname.startsWith('/portal/quotations')) {
      return role === 'Customer';
    }

    // Public / Magic link quote portal is accessible
    if (pathname.startsWith('/portal/quote/')) {
      return true;
    }

    // Customer cannot access internal CRM routes
    if (role === 'Customer') {
      return false;
    }

    // Internal role restrictions
    if (pathname.startsWith('/admin') || pathname.startsWith('/workspace/users')) {
      return role === 'Admin' || role === 'SalesManager';
    }

    if (pathname.startsWith('/workspace/approvals') || pathname.startsWith('/workspace/deal-health')) {
      return role === 'SalesManager' || role === 'FinanceOperations' || role === 'Admin';
    }

    if (pathname.startsWith('/workspace/reports')) {
      return role === 'SalesManager' || role === 'FinanceOperations' || role === 'Admin';
    }

    if (pathname.startsWith('/workspace/inquiries') || pathname.startsWith('/workspace/sales-connections')) {
      return role === 'SalesRep' || role === 'SalesManager' || role === 'Admin';
    }

    return true;
  };

  const handleLoginSuccess = (authenticatedUser) => {
    const from = location.state?.from?.pathname;
    const defaultRoute = getRoleLandingRoute(authenticatedUser.role);

    // Only honour 'from' if it is verified as authorized for the newly authenticated user's role
    if (from && isRouteAllowedForRole(from, authenticatedUser.role)) {
      navigate(from, { replace: true });
    } else {
      navigate(defaultRoute, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login({ email, password });

      if (res.user.mustChangePassword) {
        setPendingUser(res.user);
        setCurrentPassword(password);
        setRequirePasswordChange(true);
        toast.info('Action Required', 'Please set a new secure password for your account.');
      } else {
        toast.success('Welcome Back', `Authenticated as ${res.user.fullName} (${res.user.role})`);
        handleLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setChangeError(null);

    if (newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setChangeError('New password cannot be the same as the temporary password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      toast.success('Password Updated', 'Your new password is now active.');
      setRequirePasswordChange(false);
      handleLoginSuccess(pendingUser);
    } catch (err) {
      setChangeError(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      {/* Left Column: Brand Story & Intelligence Telemetry (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-linear-to-br from-slate-50 to-blue-50/50 border-r border-slate-200 relative overflow-hidden">
        {/* Ambient radial lighting */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-4 h-4 fill-blue-600 text-blue-600" />
            DealFlow360 Enterprise CRM
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Autonomous, Self-Governing Sales Operations Platform
          </h1>
          <p className="mt-3 text-sm text-slate-600 max-w-lg leading-relaxed">
            Uniting CPQ algorithmic pricing, real-time gross margin preservation, cascading approval matrices, and live customer collaboration in a single unified architecture.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-4 my-8 relative z-10">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">13 Self-Governing Engines</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated CPQ pricing models, multi-factor tier discount matrix, dynamic margin guardrails, and automated SLA monitors.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Real-Time Gross Margin Protection</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mathematical floor enforcement prevents margin leakage, automatically escalating out-of-bounds quotations to Sales Management or Finance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Zero-Leak Commercial Portal</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct B2B client collaboration, line-item inquiries, counter-discount negotiation, and digital acceptance under strict tenant isolation.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>MSSQL Encrypted • Production Identity & RBAC</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">v2.5 Production</span>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-12 lg:px-16 py-8 sm:py-12 overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Header */}
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
                <Zap className="w-4 h-4 fill-white text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                DealFlow<span className="text-blue-600">360</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Platform
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Authenticate with your corporate credentials or customer portal account.
            </p>
          </div>

          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work or Portal Email"
              labelClassName="text-slate-700 font-medium"
              type="email"
              required
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                labelClassName="text-slate-700 font-medium"
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

          {/* Quick Demo Role Selector */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowQuickCredentials(!showQuickCredentials)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between text-xs text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Quick Demo Role Switcher
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                  showQuickCredentials ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showQuickCredentials && (
              <div className="mt-2 p-3 bg-white shadow-sm border border-slate-200 rounded-xl space-y-1.5">
                <p className="text-[11px] text-slate-500 mb-2">
                  Click any verified seed profile to populate credentials:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {quickRoles.map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleSelectQuickRole(item)}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-xs"
                    >
                      <div className="min-w-0 truncate">
                        <span className="font-semibold text-slate-900 mr-1.5">{item.role}:</span>
                        <span className="text-slate-600 truncate">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-blue-600 font-mono shrink-0">
                        {item.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Register / Self-Service Link */}
          <div className="pt-4 text-center text-xs text-slate-500 border-t border-slate-200">
            Need a client portal account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 ml-1"
            >
              Register Your Organization
            </Link>
          </div>
        </div>
      </div>

      {/* Forced Password Reset Modal */}
      {requirePasswordChange && (
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Update Temporary Password"
          description="Your administrator or system policy requires you to set a personal password before continuing."
        >
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            {changeError && <ErrorAlert message={changeError} />}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                Welcome <span className="font-semibold">{pendingUser?.fullName}</span>! Please create a new password with at least 8 characters.
              </div>
            </div>

            <Input
              label="Temporary Password"
              type="password"
              required
              icon={KeyRound}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter the temporary password you logged in with"
            />

            <Input
              label="New Password"
              type="password"
              required
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isChangingPassword}
                icon={CheckCircle2}
              >
                Set Password & Continue
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LoginPage;
