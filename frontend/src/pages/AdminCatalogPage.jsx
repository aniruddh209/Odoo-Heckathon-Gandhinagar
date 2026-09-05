import React, { useState, useEffect } from 'react';
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
  SkeletonDashboard,
  ErrorAlert,
  StatusBadge,
} from '../components/ui';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Edit2,
  CheckCircle,
  XCircle,
  Layers,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const AdminCatalogPage = ({ defaultTab = 'products' }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab); // 'products' or 'pricing'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customerTiers, setCustomerTiers] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for Products
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Add / Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productSku, setProductSku] = useState('');
  const [productName, setProductName] = useState('');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productType, setProductType] = useState('OneTime');
  const [productBasePrice, setProductBasePrice] = useState('');
  const [productCostPrice, setProductCostPrice] = useState('');
  const [productTaxRate, setProductTaxRate] = useState('18.00');
  const [productUnit, setProductUnit] = useState('Each');
  const [productDescription, setProductDescription] = useState('');
  const [isProductSubmitting, setIsProductSubmitting] = useState(false);

  // Variant Modal State
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  const [variantsList, setVariantsList] = useState([]);
  const [isVariantsLoading, setIsVariantsLoading] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [isVariantSubmitting, setIsVariantSubmitting] = useState(false);

  // Price List Modals & Overrides State
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState(null);
  const [plName, setPlName] = useState('');
  const [plCurrency, setPlCurrency] = useState('USD');
  const [plTierId, setPlTierId] = useState('');
  const [isPlSubmitting, setIsPlSubmitting] = useState(false);

  // Manage Overrides for a selected Price List
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const [overrideProductId, setOverrideProductId] = useState('');
  const [overrideUnitPrice, setOverrideUnitPrice] = useState('');
  const [isOverrideSubmitting, setIsOverrideSubmitting] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pRes, cRes, tRes, plRes] = await Promise.all([
        adminApi.getProducts(),
        adminApi.getCategories(),
        adminApi.getCustomerTiers(),
        adminApi.getPriceLists(),
      ]);

      const pList = Array.isArray(pRes) ? pRes : pRes?.value || [];
      const cList = Array.isArray(cRes) ? cRes : cRes?.value || [];
      const tList = Array.isArray(tRes) ? tRes : tRes?.value || [];
      const plList = Array.isArray(plRes) ? plRes : plRes?.value || [];

      setProducts(pList);
      setCategories(cList);
      setCustomerTiers(tList);
      setPriceLists(plList);

      if (cList.length > 0 && !productCategoryId) setProductCategoryId(cList[0].id.toString());
      if (plList.length > 0 && !selectedPriceList) setSelectedPriceList(plList[0]);
    } catch (err) {
      setError(err.message || 'Failed to load master catalog and price lists.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Product Handlers ───────────────────────────────────────
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductSku('');
    setProductName('');
    if (categories.length > 0) setProductCategoryId(categories[0].id.toString());
    setProductType('OneTime');
    setProductBasePrice('');
    setProductCostPrice('');
    setProductTaxRate('18.00');
    setProductUnit('Each');
    setProductDescription('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProductSku(p.sku);
    setProductName(p.name);
    const cat = categories.find((c) => c.name === p.categoryName);
    setProductCategoryId(cat ? cat.id.toString() : (categories[0]?.id?.toString() || ''));
    setProductType(p.productType || 'OneTime');
    setProductBasePrice(p.basePrice?.toString() || '');
    setProductCostPrice(p.costPrice?.toString() || '');
    setProductTaxRate(p.taxRate?.toString() || '18.00');
    setProductUnit(p.unit || 'Each');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productSku.trim() || !productName.trim()) return;

    setIsProductSubmitting(true);
    try {
      const payload = {
        sku: productSku.trim(),
        name: productName.trim(),
        categoryId: parseInt(productCategoryId, 10),
        productType,
        basePrice: parseFloat(productBasePrice) || 0,
        costPrice: parseFloat(productCostPrice) || 0,
        taxRate: parseFloat(productTaxRate) || 18,
        unit: productUnit || 'Each',
      };

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, {
          ...payload,
          isActive: editingProduct.isActive !== undefined ? editingProduct.isActive : true,
        });
        toast.success('Product Updated', `${productName} updated successfully.`);
      } else {
        await adminApi.createProduct(payload);
        toast.success('Product Created', `${productName} [${productSku}] added to catalog.`);
      }

      setIsProductModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(editingProduct ? 'Update Failed' : 'Creation Failed', err.message);
    } finally {
      setIsProductSubmitting(false);
    }
  };

  const handleToggleProductStatus = async (p) => {
    try {
      await adminApi.toggleProductStatus(p.id);
      toast.success(
        p.isActive ? 'Product Deactivated' : 'Product Activated',
        `${p.name} [${p.sku}] status has been updated.`
      );
      await loadData();
    } catch (err) {
      toast.error('Status Update Failed', err.message);
    }
  };

  // ─── Price List Handlers ────────────────────────────────────
  const handleOpenAddPriceList = () => {
    setEditingPriceList(null);
    setPlName('');
    setPlCurrency('USD');
    setPlTierId('');
    setIsPriceListModalOpen(true);
  };

  const handleOpenEditPriceList = (pl) => {
    setEditingPriceList(pl);
    setPlName(pl.name);
    setPlCurrency(pl.currencyCode || 'USD');
    setPlTierId(pl.tierId ? pl.tierId.toString() : '');
    setIsPriceListModalOpen(true);
  };

  const handleSavePriceList = async (e) => {
    e.preventDefault();
    if (!plName.trim()) return;

    setIsPlSubmitting(true);
    try {
      const payload = {
        name: plName.trim(),
        currencyCode: plCurrency,
        tierId: plTierId ? parseInt(plTierId, 10) : null,
      };

      if (editingPriceList) {
        await adminApi.updatePriceList(editingPriceList.id, {
          ...payload,
          isActive: editingPriceList.isActive !== undefined ? editingPriceList.isActive : true,
        });
        toast.success('Price List Updated', `${plName} updated successfully.`);
      } else {
        await adminApi.createPriceList(payload);
        toast.success('Price List Created', `Price list ${plName} added.`);
      }

      setIsPriceListModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error('Operation Failed', err.message);
    } finally {
      setIsPlSubmitting(false);
    }
  };

  const handleTogglePriceListStatus = async (pl) => {
    try {
      await adminApi.togglePriceListStatus(pl.id);
      toast.success(
        pl.isActive ? 'Price List Deactivated' : 'Price List Activated',
        `${pl.name} is now ${pl.isActive ? 'inactive' : 'active'}.`
      );
      await loadData();
    } catch (err) {
      toast.error('Status Update Failed', err.message);
    }
  };

  const handleUpsertOverride = async (e) => {
    e.preventDefault();
    if (!selectedPriceList || !overrideProductId || !overrideUnitPrice) return;

    setIsOverrideSubmitting(true);
    try {
      await adminApi.upsertPriceListItem(selectedPriceList.id, {
        productId: parseInt(overrideProductId, 10),
        unitPrice: parseFloat(overrideUnitPrice),
        currencyCode: selectedPriceList.currencyCode || 'USD',
      });

      toast.success('Price Override Saved', 'Contracted product price override saved in price list.');
      setOverrideProductId('');
      setOverrideUnitPrice('');

      // Refresh selected price list
      const updatedPl = await adminApi.getPriceListById(selectedPriceList.id);
      setSelectedPriceList(updatedPl);
      await loadData();
    } catch (err) {
      toast.error('Failed to Save Override', err.message);
    } finally {
      setIsOverrideSubmitting(false);
    }
  };

  const handleDeleteOverride = async (productId) => {
    if (!selectedPriceList) return;
    try {
      await adminApi.deletePriceListItem(selectedPriceList.id, productId);
      toast.success('Override Removed', 'Product price override removed from catalog.');
      const updatedPl = await adminApi.getPriceListById(selectedPriceList.id);
      setSelectedPriceList(updatedPl);
      await loadData();
    } catch (err) {
      toast.error('Failed to Remove Override', err.message);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      !filterCategory ||
      p.categoryName?.toLowerCase() === filterCategory.toLowerCase();
    const matchesActive =
      filterActive === '' ||
      (filterActive === 'active' && p.isActive) ||
      (filterActive === 'inactive' && !p.isActive);

    return matchesSearch && matchesCat && matchesActive;
  });

  const productColumns = [
    {
      header: 'SKU Code',
      accessor: 'sku',
      render: (p) => <span className="font-mono font-bold text-xs text-blue-600">{p.sku}</span>,
    },
    {
      header: 'Product Name',
      accessor: 'name',
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-900 block">{p.name}</span>
          {p.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 italic max-w-xs">{p.description}</p>
          )}
          <span className="text-[10px] text-slate-400 font-mono">{p.productType}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'categoryName',
      render: (p) => <span className="text-slate-700 text-xs">{p.categoryName || 'General'}</span>,
    },
    {
      header: 'Base Price',
      accessor: 'basePrice',
      render: (p) => (
        <span className="font-bold text-slate-900 font-mono">
          ${(p.basePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Cost Price',
      accessor: 'costPrice',
      render: (p) => (
        <span className="font-mono text-slate-500 text-xs">
          ${(p.costPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Margin',
      accessor: 'margin',
      render: (p) => {
        const margin = p.basePrice > 0 ? ((p.basePrice - p.costPrice) / p.basePrice) * 100 : 0;
        return (
          <span className={`font-mono text-xs font-bold ${margin >= 30 ? 'text-emerald-700' : margin >= 15 ? 'text-amber-700' : 'text-rose-700'}`}>
            {margin.toFixed(1)}%
          </span>
        );
      },
    },
    {
      header: 'Tax Rate',
      accessor: 'taxRate',
      render: (p) => <span className="text-slate-600 font-mono text-xs">{p.taxRate}%</span>,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            p.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {p.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            icon={Layers}
            onClick={() => handleOpenVariantsModal(p)}
            className="text-xs py-1 px-2 h-7 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200"
          >
            Variants
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEditProduct(p)}
            className="text-xs py-1 px-2 h-7"
          >
            Edit
          </Button>
          <Button
            variant={p.isActive ? 'danger' : 'outline'}
            size="sm"
            onClick={() => handleToggleProductStatus(p)}
            className="text-xs py-1 px-2 h-7"
          >
            {p.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const priceListColumns = [
    {
      header: 'Price List Name',
      accessor: 'name',
      render: (pl) => (
        <div>
          <span className="font-bold text-slate-900 block">{pl.name}</span>
          <span className="text-xs text-slate-500 font-mono">{pl.currencyCode}</span>
        </div>
      ),
    },
    {
      header: 'Customer Tier',
      accessor: 'tierName',
      render: (pl) => (
        <span className="text-xs font-semibold text-purple-700">
          {pl.tierName ? `${pl.tierName} Tier` : 'Global Default'}
        </span>
      ),
    },
    {
      header: 'Price Overrides',
      accessor: 'itemsCount',
      render: (pl) => (
        <span className="font-mono text-xs text-slate-700 font-semibold">
          {pl.items?.length || 0} product(s)
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (pl) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            pl.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {pl.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (pl) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant={selectedPriceList?.id === pl.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPriceList(pl)}
            className="text-xs py-1 px-2 h-7"
          >
            {selectedPriceList?.id === pl.id ? 'Viewing Overrides' : 'Manage Overrides'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEditPriceList(pl)}
            className="text-xs py-1 px-2 h-7"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTogglePriceListStatus(pl)}
            className="text-xs py-1 px-2 h-7"
          >
            {pl.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <PageHeader
        title="Products & Contracted Pricing"
        subtitle="Master SKU catalog, product categorization, and contracted tier price list definitions."
        badge={`${products.length} Products`}
        actions={
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
              Refresh
            </Button>
            {activeTab === 'products' ? (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddProduct}>
                Add Product
              </Button>
            ) : (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddPriceList}>
                Add Price List
              </Button>
            )}
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Master Products ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pricing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Contracted Price Lists ({priceLists.length})
        </button>
      </div>

      {/* Tab 1: Products */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by SKU or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-1.5 px-3 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="py-1.5 px-3 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>

            {(searchTerm || filterCategory || filterActive) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterActive('');
                }}
                className="text-xs py-1 px-2 h-7 text-slate-500"
              >
                Reset Filters
              </Button>
            )}
          </div>

          <DataTable
            columns={productColumns}
            data={filteredProducts}
            emptyMessage="No products match criteria"
            emptyDescription="Adjust filters or add a new product."
          />
        </div>
      )}

      {/* Tab 2: Price Lists & Overrides */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <DataTable
            columns={priceListColumns}
            data={priceLists}
            emptyMessage="No price lists defined"
            emptyDescription="Create a price list to configure contracted customer tier pricing."
          />

          {/* Selected Price List Overrides Panel */}
          {selectedPriceList && (
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Product Price Overrides: {selectedPriceList.name} ({selectedPriceList.currencyCode})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Contracted rates configured in this price list supersede default product base pricing in quotations.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
                  {selectedPriceList.tierName ? `Assigned to ${selectedPriceList.tierName} Tier` : 'Global Default'}
                </span>
              </div>

              {/* Add Override Form */}
              <form onSubmit={handleUpsertOverride} className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Product</label>
                  <select
                    value={overrideProductId}
                    onChange={(e) => setOverrideProductId(e.target.value)}
                    required
                    className="w-full py-1.5 px-3 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} — Default: ${p.basePrice?.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-40">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contracted Price ({selectedPriceList.currencyCode})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 1999.00"
                    value={overrideUnitPrice}
                    onChange={(e) => setOverrideUnitPrice(e.target.value)}
                    className="w-full py-1.5 px-3 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <Button type="submit" variant="primary" size="sm" isLoading={isOverrideSubmitting} className="h-8">
                  Save Override
                </Button>
              </form>

              {/* Overrides Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Contracted Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPriceList.items && selectedPriceList.items.length > 0 ? (
                      selectedPriceList.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-blue-600">{item.productSKU}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.productName}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 text-right">
                            ${item.unitPrice?.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDeleteOverride(item.productId)}
                              className="text-[11px] py-0.5 px-2 h-6"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-slate-500 italic">
                          No product price overrides configured in this price list. All products fall back to base catalog prices.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Modal (Add / Edit) */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add Product to Master Catalog'}
        description="Configure unit base price, cost price, SKU, and taxation rules."
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              required
              placeholder="e.g. HW-SRV-01"
              value={productSku}
              onChange={(e) => setProductSku(e.target.value)}
            />
            <Select
              label="Category"
              required
              value={productCategoryId}
              onChange={(e) => setProductCategoryId(e.target.value)}
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
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
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
              placeholder="e.g. Each, User/Month, License"
              value={productUnit}
              onChange={(e) => setProductUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Base Price ($)"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={productBasePrice}
              onChange={(e) => setProductBasePrice(e.target.value)}
            />
            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              min="0"
              required
              value={productCostPrice}
              onChange={(e) => setProductCostPrice(e.target.value)}
            />
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              value={productTaxRate}
              onChange={(e) => setProductTaxRate(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isProductSubmitting}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Price List Modal (Add / Edit) */}
      <Modal
        isOpen={isPriceListModalOpen}
        onClose={() => setIsPriceListModalOpen(false)}
        title={editingPriceList ? `Edit Price List: ${editingPriceList.name}` : 'Create Contracted Price List'}
        description="Bind price catalogs to specific customer tiers or platform defaults."
      >
        <form onSubmit={handleSavePriceList} className="space-y-4">
          <Input
            label="Price List Name"
            required
            placeholder="e.g. Enterprise Global USD, Partner Gold"
            value={plName}
            onChange={(e) => setPlName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Currency"
              required
              value={plCurrency}
              onChange={(e) => setPlCurrency(e.target.value)}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'INR', label: 'INR (₹)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
              ]}
            />

            <Select
              label="Applicable Customer Tier (Optional)"
              value={plTierId}
              onChange={(e) => setPlTierId(e.target.value)}
              options={[
                { value: '', label: 'Global (Any Tier)' },
                ...customerTiers.map((t) => ({
                  value: t.id,
                  label: `${t.name} Tier`,
                })),
              ]}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsPriceListModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isPlSubmitting}>
              {editingPriceList ? 'Save Changes' : 'Create Price List'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Variants Modal (Section 4 A2) */}
      <Modal
        isOpen={isVariantsModalOpen}
        onClose={() => setIsVariantsModalOpen(false)}
        title={`Product Variants: ${selectedProductForVariants?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-800">SKU: {selectedProductForVariants?.sku}</span>
              <span className="text-slate-500 ml-3">Base Price: ${selectedProductForVariants?.basePrice?.toFixed(2)}</span>
            </div>
            <span className="text-slate-500 text-[11px]">Storage/RAM/tier modifiers</span>
          </div>

          {/* Form to add variant */}
          <form onSubmit={handleCreateVariant} className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-700">Add New Variant</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Variant Name"
                placeholder="e.g. 32GB RAM / 1TB SSD"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                required
              />
              <Input
                label="Additional Price ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newVariantPrice}
                onChange={(e) => setNewVariantPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="xs" icon={Plus} disabled={isVariantSubmitting}>
                {isVariantSubmitting ? 'Adding...' : 'Add Variant'}
              </Button>
            </div>
          </form>

          {/* Existing variants list */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-700 mb-2">
              Existing Variants ({variantsList.length})
            </h4>
            {variantsList.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center border border-dashed rounded-lg bg-slate-50">
                No variants defined for this product yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {variantsList.map((v) => (
                  <div key={v.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{v.name}</span>
                      <span className="ml-2 font-mono text-emerald-700 font-bold">
                        (+${v.additionalPrice?.toFixed(2)})
                      </span>
                      <span className="ml-2 text-slate-400">
                        Total: ${((selectedProductForVariants?.basePrice || 0) + (v.additionalPrice || 0)).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="xs"
                      icon={Trash2}
                      onClick={() => handleDeleteVariant(v.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsVariantsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCatalogPage;
