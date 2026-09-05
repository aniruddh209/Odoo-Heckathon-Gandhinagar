import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerApi } from '../api';
import {
  Button,
  DataTable,
  MetricCard,
  SkeletonDashboard,
  ErrorAlert,
} from '../components/ui';
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  TrendingUp,
  FileText,
  ShoppingCart,
  Receipt,
  Package,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';

export const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data360, setData360] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCustomer360();
  }, [id]);

  const loadCustomer360 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await customerApi.getCustomer360(id);
      setData360(res);
    } catch (err) {
      setError(err.message || 'Failed to load Customer 360 profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (error || !data360) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/workspace/customers')}>
          Back to Customers
        </Button>
        <ErrorAlert message={error || 'Customer not found.'} onRetry={loadCustomer360} />
      </div>
    );
  }

  const { customer, overview, quotations, orders, invoices, productHistory, activityTimeline, associatedUsers } = data360;

  const tabs = [
    { id: 'overview', label: '360 Overview', icon: Building2 },
    { id: 'quotations', label: `Quotations (${quotations?.length || 0})`, icon: FileText },
    { id: 'orders', label: `Orders (${orders?.length || 0})`, icon: ShoppingCart },
    { id: 'invoices', label: `Invoices (${invoices?.length || 0})`, icon: Receipt },
    { id: 'products', label: `Purchased Items (${productHistory?.length || 0})`, icon: Package },
    { id: 'activity', label: 'Activity Timeline', icon: Clock },
    { id: 'users', label: `Portal Users (${associatedUsers?.length || 0})`, icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/workspace/customers')}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                customer.isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {customer.isActive ? 'Active Client' : 'Inactive'}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                {customer.tierName} Tier (Max {customer.tierMaxDiscount}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer 360 Workspace • ID #{customer.id} • Account Currency: {customer.currencyCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadCustomer360}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/workspace/quotations/new', { state: { preselectedCustomerId: customer.id } })}
          >
            Create Quotation
          </Button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Lifetime Value"
          value={`$${(overview?.totalLifetimeValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          variant="emerald"
          description="Total revenue generated"
        />
        <MetricCard
          label="Active Pipeline"
          value={`$${(overview?.activeQuotationsValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={FileText}
          variant="indigo"
          description={`${overview?.activeQuotationsCount || 0} open quote(s)`}
        />
        <MetricCard
          label="Confirmed Orders"
          value={overview?.confirmedOrdersCount || 0}
          icon={ShoppingCart}
          variant="purple"
          description={`$${(overview?.confirmedOrdersValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} closed`}
        />
        <MetricCard
          label="Outstanding AR"
          value={`$${(overview?.totalOutstandingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Receipt}
          variant="amber"
          description={`${overview?.totalInvoicesCount || 0} total invoice(s)`}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-white font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Profile Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" /> Account Profile
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Primary Contact Email</span>
                <span className="font-mono text-slate-800 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {customer.email || 'Not specified'}
                </span>
              </div>
              <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Phone Number</span>
                <span className="text-slate-800 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {customer.phone || 'Not specified'}
                </span>
              </div>
              <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned Sales Rep</span>
                <span className="text-slate-800 font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {customer.assignedSalesRepName || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Commercial Tier</span>
                <span className="font-semibold text-blue-700">
                  {customer.tierName} (Max {customer.tierMaxDiscount}%)
                </span>
              </div>
              <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Billing Currency</span>
                <span className="font-mono font-medium text-slate-800">{customer.currencyCode}</span>
              </div>
              <div className="flex items-start justify-between py-1.5">
                <span className="text-slate-500">Account Onboarded</span>
                <span className="text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(customer.createdAtUtc).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Associated Users Summary */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Customer Portal Users
            </h2>
            {associatedUsers?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No login users associated with this customer yet.</p>
            ) : (
              <div className="space-y-2.5">
                {associatedUsers.map((u) => (
                  <div key={u.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{u.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {u.lastLoginAtUtc ? `Last: ${new Date(u.lastLoginAtUtc).toLocaleDateString()}` : 'Never logged in'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Snapshot */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Recent Operations
            </h2>
            {activityTimeline?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No operational events recorded.</p>
            ) : (
              <div className="space-y-3">
                {activityTimeline.slice(0, 5).map((act, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{act.title}</p>
                      <p className="text-[11px] text-slate-500">{act.description}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.timestampUtc).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotations Tab */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                header: 'Quote #',
                accessor: 'quotationNumber',
                render: (q) => (
                  <Link
                    to={`/workspace/quotations/${q.id}`}
                    className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {q.quotationNumber}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ),
              },
              {
                header: 'Date Created',
                accessor: 'createdAtUtc',
                render: (q) => (
                  <span className="text-xs text-slate-600">
                    {new Date(q.createdAtUtc).toLocaleDateString()}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: 'status',
                render: (q) => (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {q.status}
                  </span>
                ),
              },
              {
                header: 'Items',
                accessor: 'itemCount',
                render: (q) => <span className="text-xs font-medium text-slate-700">{q.itemCount || 0} line(s)</span>,
              },
              {
                header: 'Deal Margin',
                accessor: 'marginPercent',
                render: (q) => (
                  <span className={`text-xs font-semibold ${
                    q.marginPercent >= 25 ? 'text-emerald-600' : q.marginPercent >= 15 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {q.marginPercent ? `${q.marginPercent.toFixed(1)}%` : '—'}
                  </span>
                ),
              },
              {
                header: 'Total Value',
                accessor: 'totalAmount',
                render: (q) => (
                  <span className="font-bold text-slate-900 font-mono">
                    ${(q.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ),
              },
            ]}
            data={quotations || []}
            emptyMessage="No quotations generated"
            emptyDescription="Create a quotation to build a commercial proposal for this customer."
            onRowClick={(q) => navigate(`/workspace/quotations/${q.id}`)}
          />
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                header: 'Order #',
                accessor: 'orderNumber',
                render: (o) => <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>,
              },
              {
                header: 'Associated Quote',
                accessor: 'quotationNumber',
                render: (o) => (
                  <Link
                    to={`/workspace/quotations/${o.quotationId}`}
                    className="font-mono text-xs text-blue-600 hover:underline"
                  >
                    {o.quotationNumber}
                  </Link>
                ),
              },
              {
                header: 'Date Created',
                accessor: 'createdAtUtc',
                render: (o) => (
                  <span className="text-xs text-slate-600">
                    {new Date(o.createdAtUtc).toLocaleDateString()}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: 'status',
                render: (o) => (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {o.status}
                  </span>
                ),
              },
              {
                header: 'Order Total',
                accessor: 'totalAmount',
                render: (o) => (
                  <span className="font-bold text-slate-900 font-mono">
                    ${(o.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ),
              },
            ]}
            data={orders || []}
            emptyMessage="No confirmed orders"
            emptyDescription="Confirmed quotations automatically create production sales orders."
          />
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                header: 'Invoice #',
                accessor: 'invoiceNumber',
                render: (inv) => <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>,
              },
              {
                header: 'Date Created',
                accessor: 'createdAtUtc',
                render: (inv) => (
                  <span className="text-xs text-slate-600">
                    {new Date(inv.createdAtUtc).toLocaleDateString()}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: 'status',
                render: (inv) => (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {inv.status}
                  </span>
                ),
              },
              {
                header: 'Amount Invoiced',
                accessor: 'amount',
                render: (inv) => (
                  <span className="font-bold text-slate-900 font-mono">
                    ${(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ),
              },
              {
                header: 'Amount Paid',
                accessor: 'paidAmount',
                render: (inv) => (
                  <span className="font-mono text-xs text-emerald-600 font-medium">
                    ${(inv.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ),
              },
              {
                header: 'Due Date',
                accessor: 'dueDateUtc',
                render: (inv) => (
                  <span className="text-xs text-slate-600">
                    {inv.dueDateUtc ? new Date(inv.dueDateUtc).toLocaleDateString() : '—'}
                  </span>
                ),
              },
            ]}
            data={invoices || []}
            emptyMessage="No invoices generated"
            emptyDescription="Invoices are produced when orders enter billing workflows."
          />
        </div>
      )}

      {/* Purchased Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                header: 'SKU',
                accessor: 'sku',
                render: (p) => <span className="font-mono text-xs font-semibold text-blue-600">{p.sku}</span>,
              },
              {
                header: 'Product Name',
                accessor: 'productName',
                render: (p) => <span className="font-bold text-slate-900">{p.productName}</span>,
              },
              {
                header: 'Total Units Purchased',
                accessor: 'totalQuantityPurchased',
                render: (p) => <span className="font-semibold text-slate-800">{p.totalQuantityPurchased}</span>,
              },
              {
                header: 'Total Revenue Generated',
                accessor: 'totalRevenue',
                render: (p) => (
                  <span className="font-bold text-slate-900 font-mono">
                    ${(p.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ),
              },
              {
                header: 'Last Purchase Date',
                accessor: 'lastPurchasedAtUtc',
                render: (p) => (
                  <span className="text-xs text-slate-600">
                    {p.lastPurchasedAtUtc ? new Date(p.lastPurchasedAtUtc).toLocaleDateString() : '—'}
                  </span>
                ),
              },
            ]}
            data={productHistory || []}
            emptyMessage="No product purchase history"
            emptyDescription="Items fulfilled across confirmed orders will be summarized here."
          />
        </div>
      )}

      {/* Activity Timeline Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Operational & Commercial Timeline
          </h2>
          {activityTimeline?.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No operational events recorded for this customer.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activityTimeline.map((evt, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{evt.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(evt.timestampUtc).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{evt.description}</p>
                    {evt.referenceNumber && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-700">
                        Ref: {evt.referenceNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                header: 'Full Name',
                accessor: 'fullName',
                render: (u) => <span className="font-bold text-slate-900">{u.fullName}</span>,
              },
              {
                header: 'Email / Login',
                accessor: 'email',
                render: (u) => <span className="font-mono text-xs text-slate-700">{u.email}</span>,
              },
              {
                header: 'Portal Role',
                accessor: 'role',
                render: (u) => (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {u.role}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: 'isActive',
                render: (u) => (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                ),
              },
              {
                header: 'Password Setup',
                accessor: 'mustChangePassword',
                render: (u) => (
                  <span className={`text-xs ${u.mustChangePassword ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                    {u.mustChangePassword ? 'Requires Update' : 'Established'}
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
            ]}
            data={associatedUsers || []}
            emptyMessage="No linked user accounts"
            emptyDescription="User accounts created for this customer appear here."
          />
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
