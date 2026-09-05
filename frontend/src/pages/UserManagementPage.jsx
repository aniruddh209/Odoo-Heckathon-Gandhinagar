import React, { useState, useEffect } from 'react';
import { userApi, adminApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Button,
  DataTable,
  Modal,
  Input,
  Select,
  PageHeader,
  SkeletonDashboard,
  ErrorAlert,
} from '../components/ui';
import {
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  UserCheck,
  UserX,
  Mail,
} from 'lucide-react';

export const UserManagementPage = () => {
  const { user: currentUser, isAdmin, isSalesManager } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [salesTeams, setSalesTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(isSalesManager && !isAdmin ? 'SalesRep' : 'SalesRep');
  const [salesTeamId, setSalesTeamId] = useState('');
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [manualPassword, setManualPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Temporary Password Reveal Modal
  const [createdCredential, setCreatedCredential] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [uRes, teamsRes] = await Promise.all([
        userApi.getUsers(),
        isAdmin ? adminApi.getSalesTeams() : Promise.resolve([]),
      ]);

      const uList = Array.isArray(uRes) ? uRes : uRes?.value || [];
      const tList = Array.isArray(teamsRes) ? teamsRes : teamsRes?.value || [];

      setUsers(uList);
      setSalesTeams(tList);
      if (tList.length > 0) {
        setSalesTeamId(tList[0].id.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to load user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await userApi.toggleStatus(user.id);
      toast.success(
        res.isActive ? 'User Activated' : 'User Disabled',
        `${user.fullName} is now ${res.isActive ? 'active' : 'disabled'}.`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: res.isActive } : u))
      );
    } catch (err) {
      toast.error('Action Failed', err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        salesTeamId: salesTeamId ? parseInt(salesTeamId, 10) : null,
        temporaryPassword: autoGeneratePassword ? null : manualPassword.trim() || null,
        mustChangePassword,
      };

      const res = await userApi.createUser(payload);

      toast.success('User Created', `${fullName} has been added.`);
      setIsCreateModalOpen(false);

      // Reset form
      setFullName('');
      setEmail('');
      setManualPassword('');
      setAutoGeneratePassword(true);

      // If a temporary password was returned, show the secure modal
      if (res.temporaryPassword) {
        setCreatedCredential({
          fullName: res.user.fullName,
          email: res.user.email,
          role: res.user.role,
          temporaryPassword: res.temporaryPassword,
        });
      }

      await loadData();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdCredential) return;
    const text = `DealFlow360 Account Credentials:\nURL: ${window.location.origin}/login\nEmail: ${createdCredential.email}\nTemporary Password: ${createdCredential.temporaryPassword}\nRole: ${createdCredential.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const columns = [
    {
      header: 'Full Name & Email',
      accessor: 'fullName',
      render: (u) => (
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            {u.fullName}
            {u.id === currentUser?.id && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold">You</span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-400" />
            {u.email}
          </span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (u) => {
        const badgeStyles = {
          Admin: 'bg-purple-50 text-purple-700 border-purple-200',
          SalesManager: 'bg-blue-50 text-blue-700 border-blue-200',
          SalesRep: 'bg-sky-50 text-sky-700 border-sky-200',
          FinanceOperations: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          Customer: 'bg-amber-50 text-amber-700 border-amber-200',
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles[u.role] || 'bg-slate-100 text-slate-700'}`}>
            {u.role}
          </span>
        );
      },
    },
    {
      header: 'Team / Scope',
      accessor: 'salesTeamName',
      render: (u) => (
        <span className="text-xs text-slate-600">
          {u.salesTeamName || (u.customerName ? `Client: ${u.customerName}` : 'Global Corporate')}
        </span>
      ),
    },
    {
      header: 'Account Status',
      accessor: 'isActive',
      render: (u) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          u.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {u.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
          {u.isActive ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Password Policy',
      accessor: 'mustChangePassword',
      render: (u) => (
        <span className={`text-xs ${u.mustChangePassword ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
          {u.mustChangePassword ? 'Must Reset' : 'Verified'}
        </span>
      ),
    },
    {
      header: 'Last Login',
      accessor: 'lastLoginAtUtc',
      render: (u) => (
        <span className="text-xs text-slate-500">
          {u.lastLoginAtUtc ? new Date(u.lastLoginAtUtc).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (u) => {
        if (u.id === currentUser?.id) return <span className="text-xs text-slate-400">—</span>;
        // Sales manager cannot toggle status of non-reps or users outside team
        if (isSalesManager && !isAdmin && u.role !== 'SalesRep') {
          return <span className="text-xs text-slate-400">—</span>;
        }

        return (
          <Button
            variant={u.isActive ? 'outline' : 'primary'}
            size="xs"
            onClick={() => handleToggleStatus(u)}
          >
            {u.isActive ? 'Disable' : 'Activate'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="User & Identity Management"
        subtitle="Role-governed directory, credentials provisioning, and account lifecycle control."
        badge={`${users.length} Users`}
        actions={
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
              Refresh
            </Button>
            {(isAdmin || isSalesManager) && (
              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Add User
              </Button>
            )}
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Role Notice for Sales Manager */}
      {isSalesManager && !isAdmin && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-800">
          <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Sales Manager Permission Scope:</span> You are authorized to provision and manage Sales Representatives within your assigned sales organization. Administrative, Financial, and Management roles are provisioned by Platform Administrators.
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'SalesRep', 'SalesManager', 'FinanceOperations', 'Admin', 'Customer'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r === 'All' ? 'All Roles' : r}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Users Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        emptyMessage="No users matched"
        emptyDescription="Try adjusting your search criteria or filter options."
      />

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New User"
        description={
          isSalesManager && !isAdmin
            ? 'Add a new Sales Representative to your sales team with generated credentials.'
            : 'Provision an enterprise user with assigned role, team, and security credentials.'
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. John Doe"
          />

          <Input
            label="Corporate Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="j.doe@dealflow360.io"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assigned Role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={
                isSalesManager && !isAdmin
                  ? [{ value: 'SalesRep', label: 'Sales Representative' }]
                  : [
                      { value: 'SalesRep', label: 'Sales Representative' },
                      { value: 'SalesManager', label: 'Sales Manager' },
                      { value: 'FinanceOperations', label: 'Finance & Operations' },
                      { value: 'Admin', label: 'Administrator' },
                      { value: 'Customer', label: 'Customer Portal' },
                    ]
              }
            />

            {(role === 'SalesRep' || role === 'SalesManager') && (
              <Select
                label="Sales Team"
                value={salesTeamId}
                onChange={(e) => setSalesTeamId(e.target.value)}
                options={
                  salesTeams.length > 0
                    ? salesTeams.map((t) => ({ value: t.id, label: t.name }))
                    : [{ value: '', label: 'Default / Auto-Assign' }]
                }
              />
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={autoGeneratePassword}
                onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-generate cryptographically secure temporary password (14 characters)
            </label>

            {!autoGeneratePassword && (
              <Input
                label="Initial Temporary Password"
                type="password"
                required={!autoGeneratePassword}
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder="Minimum 8 characters with numbers & symbols"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Force password reset upon first login (Recommended)
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Temporary Password / Credentials Modal */}
      {createdCredential && (
        <Modal
          isOpen={true}
          onClose={() => setCreatedCredential(null)}
          title="Account Provisioned Successfully"
          description="Credentials have been generated and securely committed to Microsoft SQL Server."
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Important Security Notice:</span> This temporary password will only be displayed once. Please copy and deliver it to the user through your secure company channel.
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">User:</span>
                <span className="text-white font-semibold">{createdCredential.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Email / Login:</span>
                <span className="text-white">{createdCredential.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Role:</span>
                <span className="text-blue-400 font-semibold">{createdCredential.role}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Temporary Password:</span>
                <span className="text-emerald-400 font-bold text-sm tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                  {createdCredential.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={copyToClipboard}
              >
                {copied ? 'Copied to Clipboard' : 'Copy All Credentials'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreatedCredential(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;
