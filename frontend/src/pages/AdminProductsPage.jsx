import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  DataTable,
  Modal,
  Input,
  Select,
  Textarea,
  PageHeader,
  ErrorAlert,
  StatusBadge,
} from '../components/ui';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Power,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const AdminProductsPage = () => {
  const toast = useToast();

  // Primary Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '' = all, 'active', 'inactive'

  // Modal State for Add / Edit Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productType, setProductType] = useState('OneTime');
  const [basePrice, setBasePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [taxRate, setTaxRate] = useState('18.00');
  const [unit, setUnit] = useState('Each');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Real Products and Categories from SQL Server via ASP.NET Core API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        adminApi.getProducts(),
        adminApi.getCategories(),
      ]);

      const prodList = Array.isArray(prodRes) ? prodRes : prodRes?.items || prodRes?.value || [];
      const catList = Array.isArray(catRes) ? catRes : catRes?.items || catRes?.value || [];

      setProducts(prodList);
      setCategories(catList);

      if (catList.length > 0 && !categoryId) {
        setCategoryId(catList[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Unable to load products from database.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku('');
    setName('');
    setDescription('');
    if (categories.length > 0) {
      setCategoryId(categories[0].id.toString());
    }
    setProductType('OneTime');
    setBasePrice('');
    setCostPrice('');
    setTaxRate('18.00');
    setUnit('Each');
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setSku(p.sku || '');
    setName(p.name || '');
    setDescription(p.description || '');

    // Resolve category ID from categories list matching name or default
    const matchedCategory = categories.find((c) => c.name === p.categoryName);
    setCategoryId(matchedCategory ? matchedCategory.id.toString() : (categories[0]?.id?.toString() || ''));

    setProductType(p.productType || 'OneTime');
    setBasePrice(p.basePrice?.toString() || '0');
    setCostPrice(p.costPrice?.toString() || '0');
    setTaxRate(p.taxRate?.toString() || '18.00');
    setUnit(p.unit || 'Each');
    setIsActive(p.isActive !== undefined ? p.isActive : true);
    setIsModalOpen(true);
  };

  // Save (Create or Update) Product via Real API
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      toast.error('Validation Error', 'SKU and Product Name are required.');
      return;
    }

    const parsedCategoryId = parseInt(categoryId, 10);
    if (isNaN(parsedCategoryId)) {
      toast.error('Validation Error', 'Please select a valid category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || null,
        categoryId: parsedCategoryId,
        productType,
        basePrice: parseFloat(basePrice) || 0,
        costPrice: parseFloat(costPrice) || 0,
        taxRate: parseFloat(taxRate) || 18.0,
        unit: unit.trim() || 'Each',
      };

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, {
          ...payload,
          isActive,
        });
        toast.success('Product Updated', `"${name}" [${sku}] updated successfully.`);
      } else {
        await adminApi.createProduct(payload);
        toast.success('Product Created', `"${name}" [${sku}] added to catalog.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to save product:', err);
      toast.error(editingProduct ? 'Update Failed' : 'Creation Failed', err.message || 'Error persisting product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active/Inactive Status via Real API
  const handleToggleStatus = async (p) => {
    try {
      await adminApi.toggleProductStatus(p.id);
      toast.success(
        p.isActive ? 'Product Deactivated' : 'Product Activated',
        `"${p.name}" status updated to ${p.isActive ? 'Inactive' : 'Active'}.`
      );
      await loadData();
    } catch (err) {
      console.error('Failed to toggle product status:', err);
      toast.error('Status Update Failed', err.message || 'Could not update product status.');
    }
  };

  // Filtered Real Products
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.categoryName?.toLowerCase().includes(term);

    const matchesCategory =
      !filterCategory ||
      p.categoryName?.toLowerCase() === filterCategory.toLowerCase();

    const matchesStatus =
      filterStatus === '' ||
      (filterStatus === 'active' && p.isActive) ||
      (filterStatus === 'inactive' && !p.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Table Column Definitions
  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      render: (p) => (
        <div className="max-w-md">
          <span className="font-semibold text-slate-900 block text-xs leading-snug">
            {p.name}
          </span>
          {p.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {p.description}
            </p>
          )}
          <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
            {p.productType === 'Subscription' ? 'Recurring Subscription' : 'One-Time Hardware / Service'}
          </span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'categoryName',
      render: (p) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {p.categoryName || 'General'}
        </span>
      ),
    },
    {
      header: 'SKU',
      accessor: 'sku',
      render: (p) => (
        <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50/80 px-2 py-1 rounded border border-blue-200/80">
          {p.sku}
        </span>
      ),
    },
    {
      header: 'Price',
      accessor: 'basePrice',
      align: 'right',
      render: (p) => (
        <div className="text-right">
          <span className="font-mono font-bold text-xs text-slate-900">
            {formatCurrency(p.basePrice || 0, 'INR')}
          </span>
          {p.costPrice > 0 && (
            <div className="text-[10px] font-mono text-slate-400">
              Cost: {formatCurrency(p.costPrice, 'INR')}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      align: 'center',
      render: (p) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            p.isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              p.isActive ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          {p.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="xs"
            icon={Edit2}
            onClick={() => handleOpenEdit(p)}
            className="h-7 px-2.5 text-xs font-medium text-slate-700 hover:text-slate-900 border-slate-200"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="xs"
            icon={Power}
            onClick={() => handleToggleStatus(p)}
            className={`h-7 px-2.5 text-xs font-medium transition-colors ${
              p.isActive
                ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200'
                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200'
            }`}
          >
            {p.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Clean Page Header */}
      <PageHeader
        title="Products"
        subtitle="Manage master commercial product catalog, SKU designations, unit pricing, and status."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadData}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenAdd}
            >
              Add Product
            </Button>
          </div>
        }
      />

      {/* Error Alert with Retry */}
      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Clean Search and Filter Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by SKU, name, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="w-48">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((c) => ({
                value: c.name,
                label: c.name,
              })),
            ]}
          />
        </div>

        {/* Status Filter */}
        <div className="w-40">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ]}
          />
        </div>

        {/* Reset Filters */}
        {(searchTerm || filterCategory || filterStatus) && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
              setFilterStatus('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Focused Product Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        skeletonRows={6}
        emptyMessage={
          products.length === 0
            ? 'No products in catalog'
            : 'No products match search criteria'
        }
        emptyDescription={
          products.length === 0
            ? 'Products added to the system will appear here. Get started by adding your first product.'
            : 'Try adjusting your search query or filter options to locate the product.'
        }
        emptyAction={
          products.length === 0 ? (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenAdd}
            >
              Add Product
            </Button>
          ) : undefined
        }
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add Product'}
        description={
          editingProduct
            ? 'Update SKU identification, unit base price, or commercial metadata.'
            : 'Enter SKU code, classification, and base unit pricing for the new product.'
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              required
              placeholder="e.g. HW-SRV-01"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
            <Select
              label="Category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </div>

          <Input
            label="Product Title"
            required
            placeholder="e.g. Enterprise Rack Server 2U"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Product Type"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              options={[
                { value: 'OneTime', label: 'One-Time Hardware / Service' },
                { value: 'Subscription', label: 'Recurring Subscription' },
              ]}
            />
            <Input
              label="Unit of Measurement"
              placeholder="e.g. Each, License, Month"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Base Price (₹)"
              type="number"
              step="0.01"
              min="0"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
            <Input
              label="Cost Price (₹)"
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>

          <Textarea
            label="Description (Optional)"
            placeholder="Enter commercial details, specifications, or warranty terms..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {editingProduct && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Active Status (product visible in quote builder & catalog)</span>
              </label>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProductsPage;
