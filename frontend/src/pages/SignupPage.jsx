import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, Modal, ErrorAlert } from '../components/ui';
import {
  Zap,
  Building2,
  Mail,
  Phone,
  User,
  KeyRound,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Check,
  FileCheck,
  MessageSquare,
  Receipt,
} from 'lucide-react';

export const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Real-time password validation criteria
  const passwordCriteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'Passwords match', met: password.length > 0 && password === confirmPassword },
  ];

  const allCriteriaMet = passwordCriteria.every((c) => c.met);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!companyName.trim()) {
      setError('Please provide your company or account name.');
      return;
    }

    if (!email.trim()) {
      setError('Please provide a valid work email.');
      return;
    }

    if (!allCriteriaMet) {
      setError('Please ensure your password satisfies all security requirements.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password,
        confirmPassword,
      };

      const res = await signup(payload);

      setSuccessData({
        fullName: res.user.fullName,
        companyName: companyName.trim(),
        email: res.user.email,
        role: res.user.role,
      });

      toast.success('Account Created', 'Welcome to DealFlow360 Customer Portal.');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToPortal = () => {
    navigate('/portal/my-account', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      {/* Left Column: Value Proposition & Brand Story (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-linear-to-br from-slate-50 to-blue-50/50 border-r border-slate-200 relative overflow-hidden">
        {/* Subtle radial ambient background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-4 h-4 fill-blue-600 text-blue-600" />
            DealFlow360 Client Portal
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Seamless B2B Commercial Collaboration & Negotiation
          </h1>
          <p className="mt-3 text-sm text-slate-600 max-w-lg leading-relaxed">
            Directly review transparent proposals, negotiate terms with mathematical clarity, track milestone delivery, and confirm orders in a single enterprise workspace.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-4 my-8 relative z-10">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0 mt-0.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transparent Commercial Proposals</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review interactive quotations detailing equipment, services, and multi-tier volume discounts tailored to your account.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interactive Line-Item Clarification</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Discuss specific line items directly with your sales executive and submit counter-discount requests with instant feedback.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 shrink-0 mt-0.5">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Order Tracking & Unified Invoices</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor multi-warehouse inventory allocation, view delivery milestones, and reconcile commercial invoices seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>MSSQL Encrypted • Zero-Leak Tenant Isolation</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">v2.5 Production</span>
        </div>
      </div>

      {/* Right Column: Customer Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Header */}
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
                <Zap className="w-4 h-4 fill-white text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">DealFlow<span className="text-blue-600">360</span></span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Customer Account
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Register your organization to collaborate on proposals and manage commercial agreements.
            </p>
          </div>

          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section 1: Contact & Company */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Contact Full Name"
                  labelClassName="text-slate-700 font-medium"
                  required
                  icon={User}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  autoComplete="name"
                />

                <Input
                  label="Company / Account Name"
                  labelClassName="text-slate-700 font-medium"
                  required
                  icon={Building2}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Global Inc."
                  autoComplete="organization"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Work Email"
                  labelClassName="text-slate-700 font-medium"
                  type="email"
                  required
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  autoComplete="email"
                />

                <Input
                  label="Phone Number"
                  labelClassName="text-slate-700 font-medium"
                  type="tel"
                  icon={Phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0199"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Section 2: Security Credentials */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="relative">
                <Input
                  label="Password"
                  labelClassName="text-slate-700 font-medium"
                  type={showPassword ? 'text' : 'password'}
                  required
                  icon={KeyRound}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
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

              <div className="relative">
                <Input
                  label="Confirm Password"
                  labelClassName="text-slate-700 font-medium"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  icon={Lock}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[29px] text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Quality Checklist */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider mb-1">
                  Password Requirements:
                </span>
                {passwordCriteria.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {c.met ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={c.met ? 'text-slate-900' : 'text-slate-500'}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Button */}
            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                size="md"
                isLoading={isLoading}
                icon={ArrowRight}
                disabled={!allCriteriaMet}
              >
                Create Customer Account
              </Button>
            </div>
          </form>

          {/* Footer Link to Login */}
          <div className="pt-4 text-center text-xs text-slate-500 border-t border-slate-200">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 ml-1"
            >
              Sign In to Platform
            </Link>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <Modal
          isOpen={true}
          onClose={handleProceedToPortal}
          title="Account Provisioned Successfully"
          description="Your customer portal account has been created and verified in Microsoft SQL Server."
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-950">Welcome, {successData.fullName}!</p>
                <p className="text-emerald-800 mt-1">
                  Your organization <span className="font-semibold">{successData.companyName}</span> is now registered on DealFlow360. You have immediate access to your customer commercial portal.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 text-slate-900 p-4 rounded-xl space-y-2 text-xs font-mono border border-slate-200">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Account Name:</span>
                <span className="text-slate-900 font-semibold">{successData.companyName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Login Email:</span>
                <span className="text-slate-900">{successData.email}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Access Scope:</span>
                <span className="text-emerald-600 font-semibold">{successData.role} Portal</span>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleProceedToPortal}
                icon={ArrowRight}
              >
                Proceed to Customer Portal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SignupPage;
