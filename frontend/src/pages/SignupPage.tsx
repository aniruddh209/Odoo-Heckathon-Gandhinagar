import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Alert } from '../components/common/Alert';
import { Layers, ArrowRight } from 'lucide-react';
import { Role } from '../types';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.SalesRep);
  const [department, setDepartment] = useState('Commercial Sales');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signup({
        FullName: fullName,
        Email: email,
        Password: password,
        Role: role,
        Department: department,
      });
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
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
        <h2 className="mt-6 text-center text-2xl font-bold text-slate-900">Register Staff Account</h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Join your organization's deal velocity and fulfillment workflow
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
              label="Full Name"
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
              placeholder="Sarah Jenkins"
              required
            />

            <Input
              label="Corporate Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="s.jenkins@company.com"
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

            <Select
              label="Assigned Business Role"
              value={role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as Role)}
              options={[
                { value: Role.SalesRep, label: 'Sales Representative (Quoting & Accounts)' },
                { value: Role.SalesManager, label: 'Sales Manager (Tier 1 Approvals)' },
                { value: Role.FinanceOperations, label: 'Finance & Operations (Tier 2 & Invoicing)' },
                { value: Role.Admin, label: 'System Administrator (Master Configuration)' },
              ]}
              required
            />

            <Input
              label="Department / Unit"
              value={department}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartment(e.target.value)}
              placeholder="Enterprise Solutions"
            />

            <Button type="submit" className="w-full justify-center" size="lg" isLoading={isLoading}>
              Complete Registration
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
