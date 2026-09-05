import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api';
import { Button, Input, Modal, ErrorAlert } from '../components/ui';
import { Zap, KeyRound, Mail, ArrowRight, Eye, EyeOff, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';

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

  // Forced Password Change State
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLoginSuccess = (user) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
    } else if (user.role === 'Customer') {
      navigate('/portal/my-account', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
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
              label="Work or Portal Email"
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

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Production Identity System</span>
            <span className="font-mono text-[11px] text-slate-400">ASP.NET Core • MSSQL</span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          DealFlow360 Enterprise CRM • High-Security Role-Based Access
        </p>
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
