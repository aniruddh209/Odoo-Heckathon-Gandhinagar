import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  DataTable,
  Modal,
  Input,
  Select,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import { Package, Plus, RefreshCw, Layers } from 'lucide-react';

export const AdminCatalogPage = () => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productType, setProductType] = useState('OneTime');
  const [basePrice, setBasePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [taxRate, setTaxRate] = useState('18.00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pRes, cRes] = await Promise.all([
        adminApi.getProducts(),
        adminApi.getCategories(),
      ]);

      const pList = Array.isArray(pRes) ? pRes : pRes?.value || [];
      const cList = Array.isArray(cRes) ? cRes : cRes?.value || [];

      setProducts(pList);
      setCategories(cList);
      if (cList.length > 0) setCategoryId(cList[0].id.toString());
    } catch (err) {
      setError(err.message || 'Failed to load master catalog data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await adminApi.createProduct({
        sku,
        name,
        categoryId: parseInt(categoryId, 10),
        productType,
        basePrice: parseFloat(basePrice) || 0,
        costPrice: parseFloat(costPrice) || 0,
        taxRate: parseFloat(taxRate) || 18,
        unit: 'Each',
      });

      toast.success('Product Added', `${name} [${sku}] added to catalog.`);
      setIsProductModalOpen(false);
      setSku('');
      setName('');
      setBasePrice('');
      setCostPrice('');
      await loadCatalog();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Querying master product catalog..." size="lg" />;
  }

  const columns = [
    { header: 'SKU', accessor: 'sku', render: (p) => <span className="font-mono font-bold text-xs text-blue-600">{p.sku}</span> },
    { header: 'Product Name', accessor: 'name', render: (p) => <span className="font-semibold text-slate-900">{p.name}</span> },
    { header: 'Category', accessor: 'categoryName', render: (p) => <span className="text-slate-600">{p.categoryName || 'General'}</span> },
    {
      header: 'Type',
      accessor: 'productType',
      render: (p) => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${p.productType === 'Subscription' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'}`}>
          {p.productType}
        </span>
      ),
    },
    { header: 'Base Price', accessor: 'basePrice', render: (p) => <span className="font-bold text-slate-900 font-mono">${(p.basePrice || 0).toFixed(2)}</span> },
    { header: 'Cost Price', accessor: 'costPrice', render: (p) => <span className="font-mono text-slate-500">${(p.costPrice || 0).toFixed(2)}</span> },
    { header: 'Tax Rate', accessor: 'taxRate', render: (p) => <span className="text-slate-600 font-mono">{p.taxRate}%</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Master Product Catalog &amp; Price Lists</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise products, hardware SKUs, one-time services, and recurring subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadCatalog}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsProductModalOpen(true)}
          >
            Add Product
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadCatalog} />}

      <DataTable
        columns={columns}
        data={products}
        emptyMessage="No products in master catalog"
        emptyDescription="Create a product to populate catalog pricing."
      />

      {/* Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Add Product to Master Catalog"
        description="Configure unit base price, cost price, and taxation."
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Product Type"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              options={[
                { value: 'OneTime', label: 'One-Time Hardware/Service' },
                { value: 'Subscription', label: 'Recurring Subscription' },
              ]}
            />
            <Input
              label="Base Price ($)"
              type="number"
              step="0.01"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              required
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCatalogPage;
