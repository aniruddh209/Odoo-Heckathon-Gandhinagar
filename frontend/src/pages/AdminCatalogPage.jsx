import React, { useState, useEffect } from 'react';
import { adminApi, salesConnectionApi } from '../api';
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
  IndianRupee,
  Edit2,
  CheckCircle,
  XCircle,
  Layers,
  Trash2,
  ExternalLink,
  Building2,
  UserCheck,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

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
  const [plCurrency, setPlCurrency] = useState('INR');
  const [plTierId, setPlTierId] = useState('');
  const [isPlSubmitting, setIsPlSubmitting] = useState(false);

  // Manage Overrides for a selected Price List
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const [overrideProductId, setOverrideProductId] = useState('');
  const [overrideUnitPrice, setOverrideUnitPrice] = useState('');
  const [isOverrideSubmitting, setIsOverrideSubmitting] = useState(false);

  // Companies and Sales Assignments State
  const [companies, setCompanies] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);

  // Company Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [compCode, setCompCode] = useState('');
  const [compName, setCompName] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [isCompSubmitting, setIsCompSubmitting] = useState(false);

  // Assignment Modal State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [asCompanyId, setAsCompanyId] = useState('');
  const [asRepId, setAsRepId] = useState('');
  const [asCategoryId, setAsCategoryId] = useState('');
  const [asProductId, setAsProductId] = useState('');
  const [asPriority, setAsPriority] = useState('10');
  const [asIsDefault, setAsIsDefault] = useState(false);
  const [asNotes, setAsNotes] = useState('');
  const [isAsSubmitting, setIsAsSubmitting] = useState(false);

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
      const [pRes, cRes, tRes, plRes, compRes, asRes, uRes] = await Promise.all([
        adminApi.getProducts(),
        adminApi.getCategories(),
        adminApi.getCustomerTiers(),
        adminApi.getPriceLists(),
        salesConnectionApi.getAllCompaniesAdmin(),
        salesConnectionApi.getSalesAssignments(),
        adminApi.getUsers(),
      ]);

      const pList = Array.isArray(pRes) ? pRes : pRes?.value || [];
      const cList = Array.isArray(cRes) ? cRes : cRes?.value || [];
      const tList = Array.isArray(tRes) ? tRes : tRes?.value || [];
      const plList = Array.isArray(plRes) ? plRes : plRes?.value || [];
      const compList = Array.isArray(compRes) ? compRes : compRes?.value || [];
      const asList = Array.isArray(asRes) ? asRes : asRes?.value || [];
      const uList = Array.isArray(uRes) ? uRes : uRes?.value || [];

      setProducts(pList);
      setCategories(cList);
      setCustomerTiers(tList);
      setPriceLists(plList);
      setCompanies(compList);
      setAssignments(asList);
      setUsers(uList);

      if (cList.length > 0 && !productCategoryId) setProductCategoryId(cList[0].id.toString());
      if (plList.length > 0 && !selectedPriceList) setSelectedPriceList(plList[0]);
      if (compList.length > 0 && !asCompanyId) setAsCompanyId(compList[0].id.toString());
      if (uList.length > 0 && !asRepId) {
        const firstRep = uList.find(u => u.role === 'SalesRep' || u.role === 'SalesManager') || uList[0];
        setAsRepId(firstRep.id.toString());
      }
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

  // ─── Variant Handlers ───────────────────────────────────────
  const handleOpenVariantsModal = async (p) => {
    setSelectedProductForVariants(p);
    setIsVariantsModalOpen(true);
    setIsVariantsLoading(true);
    try {
      const res = await adminApi.getProductVariants(p.id);
      setVariantsList(Array.isArray(res) ? res : res?.items || []);
    } catch {
      setVariantsList([]);
    } finally {
      setIsVariantsLoading(false);
    }
  };

  const handleCreateVariant = async (e) => {
    e.preventDefault();
    if (!selectedProductForVariants || !newVariantName.trim()) return;
    setIsVariantSubmitting(true);
    try {
      await adminApi.createProductVariant(selectedProductForVariants.id, {
        name: newVariantName.trim(),
        additionalPrice: parseFloat(newVariantPrice) || 0,
      });
      toast.success('Variant Added', `${newVariantName} added to product.`);
      setNewVariantName('');
      setNewVariantPrice('');
      const res = await adminApi.getProductVariants(selectedProductForVariants.id);
      setVariantsList(Array.isArray(res) ? res : res?.items || []);
    } catch (err) {
      toast.error('Failed to Add Variant', err.message);
    } finally {
      setIsVariantSubmitting(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!selectedProductForVariants) return;
    try {
      await adminApi.deleteProductVariant(selectedProductForVariants.id, variantId);
      toast.success('Variant Deleted', 'Product variant removed.');
      const res = await adminApi.getProductVariants(selectedProductForVariants.id);
      setVariantsList(Array.isArray(res) ? res : res?.items || []);
    } catch (err) {
      toast.error('Failed to Delete Variant', err.message);
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
        currencyCode: selectedPriceList.currencyCode || 'INR',
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

  // Company Management Handlers
  const handleOpenAddCompany = () => {
    setCompCode('');
    setCompName('');
    setCompDesc('');
    setCompWebsite('');
    setCompEmail('');
    setCompPhone('');
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!compCode.trim() || !compName.trim()) return;
    setIsCompSubmitting(true);
    try {
      await salesConnectionApi.createCompany({
        code: compCode.trim().toUpperCase(),
        name: compName.trim(),
        description: compDesc.trim() || null,
        website: compWebsite.trim() || null,
        contactEmail: compEmail.trim() || null,
        contactPhone: compPhone.trim() || null,
      });
      toast.success('Company Created', `Operating company "${compName}" registered successfully.`);
      setIsCompanyModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error('Failed to Create Company', err.message);
    } finally {
      setIsCompSubmitting(false);
    }
  };

  const handleDeleteCompany = async (company) => {
    if (!window.confirm(`Are you sure you want to delete "${company.name}"?`)) return;
    try {
      await salesConnectionApi.deleteCompany(company.id);
      toast.success('Company Removed', `Company "${company.name}" deleted.`);
      await loadData();
    } catch (err) {
      toast.error('Failed to Delete Company', err.message);
    }
  };

  // Sales Assignment Handlers
  const handleOpenAddAssignment = () => {
    if (companies.length > 0) setAsCompanyId(companies[0].id.toString());
    const firstRep = users.find(u => u.role === 'SalesRep' || u.role === 'SalesManager') || users[0];
    if (firstRep) setAsRepId(firstRep.id.toString());
    setAsProductId('');
    setAsCategoryId('');
    setAsPriority('10');
    setAsIsDefault(false);
    setAsNotes('');
    setIsAssignmentModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!asCompanyId || !asRepId) {
      toast.error('Validation Error', 'Please select both an operating company and a sales representative.');
      return;
    }
    setIsAsSubmitting(true);
    try {
      await salesConnectionApi.createSalesAssignment({
        companyId: parseInt(asCompanyId, 10),
        salesRepresentativeId: parseInt(asRepId, 10),
        productId: asProductId ? parseInt(asProductId, 10) : null,
        categoryId: asCategoryId ? parseInt(asCategoryId, 10) : null,
        priority: parseInt(asPriority, 10) || 10,
        isDefault: asIsDefault,
        notes: asNotes.trim() || null,
      });
      toast.success('Routing Rule Saved', 'Sales representative routing rule configured successfully.');
      setIsAssignmentModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error('Failed to Create Rule', err.message);
    } finally {
      setIsAsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    if (!window.confirm(`Remove this routing rule for ${assignment.companyName} → ${assignment.salesRepName}?`)) return;
    try {
      await salesConnectionApi.deleteSalesAssignment(assignment.id);
      toast.success('Routing Rule Deleted', 'Sales routing rule removed.');
      await loadData();
    } catch (err) {
      toast.error('Failed to Delete Rule', err.message);
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
          {formatCurrency(p.basePrice || 0)}
        </span>
      ),
    },
    {
      header: 'Cost Price',
      accessor: 'costPrice',
      render: (p) => (
        <span className="font-mono text-slate-500 text-xs">
          {formatCurrency(p.costPrice || 0)}
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

  // Company Columns
  const companyColumns = [
    {
      header: 'Code',
      accessor: 'code',
      render: (c) => (
        <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {c.code}
        </span>
      ),
    },
    {
      header: 'Company / Brand Name',
      accessor: 'name',
      render: (c) => (
        <div>
          <span className="font-semibold text-slate-900 block">{c.name}</span>
          {c.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 italic max-w-xs">{c.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Info',
      accessor: 'contactEmail',
      render: (c) => (
        <div className="text-xs text-slate-600">
          {c.contactEmail && <div>{c.contactEmail}</div>}
          {c.contactPhone && <div className="text-slate-400 font-mono text-[11px]">{c.contactPhone}</div>}
          {!c.contactEmail && !c.contactPhone && <span className="text-slate-400 italic">No contact specified</span>}
        </div>
      ),
    },
    {
      header: 'Website',
      accessor: 'website',
      render: (c) =>
        c.website ? (
          <a
            href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            {c.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3 inline" />
          </a>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      header: 'Products',
      accessor: 'productCount',
      render: (c) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
          {c.productCount || 0} SKUs
        </span>
      ),
    },
    {
      header: 'Routing Rules',
      accessor: 'activeAssignmentsCount',
      render: (c) => (
        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
          {c.activeAssignmentsCount || 0} rules
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (c) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            c.isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {c.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (c) => (
        <Button
          variant="danger"
          size="xs"
          icon={Trash2}
          onClick={() => handleDeleteCompany(c)}
          className="text-xs py-1 px-2 h-7"
        >
          Delete
        </Button>
      ),
    },
  ];

  // Sales Assignment Routing Columns
  const assignmentColumns = [
    {
      header: 'Priority',
      accessor: 'priority',
      render: (a) => (
        <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
          P{a.priority}
        </span>
      ),
    },
    {
      header: 'Operating Company',
      accessor: 'companyName',
      render: (a) => <span className="font-semibold text-slate-900 text-xs">{a.companyName}</span>,
    },
    {
      header: 'Assigned Representative',
      accessor: 'salesRepName',
      render: (a) => (
        <div>
          <span className="font-semibold text-blue-700 text-xs block">{a.salesRepName}</span>
          <span className="text-[11px] text-slate-400 font-mono">{a.salesRepEmail}</span>
        </div>
      ),
    },
    {
      header: 'Routing Scope',
      accessor: 'scope',
      render: (a) => {
        if (a.productName) {
          return (
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Product Specific
              </span>
              <span className="block text-xs text-slate-700 mt-0.5">{a.productName}</span>
            </div>
          );
        }
        if (a.categoryName) {
          return (
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                Category Level
              </span>
              <span className="block text-xs text-slate-700 mt-0.5">{a.categoryName}</span>
            </div>
          );
        }
        if (a.isDefault) {
          return (
            <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Company Default Rep
            </span>
          );
        }
        return <span className="text-xs text-slate-500 italic">General Company Rule</span>;
      },
    },
    {
      header: 'Default Fallback',
      accessor: 'isDefault',
      render: (a) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            a.isDefault ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-400'
          }`}
        >
          {a.isDefault ? 'Fallback Rep' : 'Rule Based'}
        </span>
      ),
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (a) => (
        <span className="text-xs text-slate-500 italic max-w-xs block truncate">{a.notes || '—'}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (a) => (
        <Button
          variant="danger"
          size="xs"
          icon={Trash2}
          onClick={() => handleDeleteAssignment(a)}
          className="text-xs py-1 px-2 h-7"
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <PageHeader
        title="Products, Pricing & Sales Routing"
        subtitle="Master SKU catalog, contracted tier price list definitions, vendor companies, and deterministic sales routing rules."
        badge={
          activeTab === 'products'
            ? `${products.length} Products`
            : activeTab === 'pricing'
            ? `${priceLists.length} Price Lists`
            : activeTab === 'companies'
            ? `${companies.length} Companies`
            : `${assignments.length} Rules`
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
              Refresh
            </Button>
            {activeTab === 'products' && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddProduct}>
                Add Product
              </Button>
            )}
            {activeTab === 'pricing' && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddPriceList}>
                Add Price List
              </Button>
            )}
            {activeTab === 'companies' && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddCompany}>
                Add Company
              </Button>
            )}
            {activeTab === 'assignments' && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddAssignment}>
                Add Routing Rule
              </Button>
            )}
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
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
          className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          Contracted Price Lists ({priceLists.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('companies')}
          className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'companies'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Vendor Brands & Companies ({companies.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Sales Routing Rules ({assignments.length})
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

            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.name, label: c.name }))
              ]}
            />

            <Select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Deactivated Only' }
              ]}
            />

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
                  <Select
                    value={overrideProductId}
                    onChange={(e) => setOverrideProductId(e.target.value)}
                    options={[
                      { value: '', label: 'Choose a product...' },
                      ...products.map((p) => ({
                        value: p.id,
                        label: `[${p.sku}] ${p.name} — Default: $${p.basePrice?.toFixed(2)}`
                      }))
                    ]}
                  />
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
                            {formatCurrency(item.unitPrice, selectedPriceList.currencyCode || 'INR')}
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

      {/* Tab 3: Vendor Brands & Companies */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-900">
              <span className="font-bold block text-sm">Operating Companies & Vendor Brands</span>
              Manage company entities representing internal business divisions or external vendor brands (e.g. Dell Technologies, Samsung Electronics, Cisco Systems, Hewlett Packard Enterprise). Products and customer sales inquiries are partitioned across these entities.
            </div>
          </div>

          <DataTable
            columns={companyColumns}
            data={companies}
            emptyMessage="No companies configured"
            emptyDescription="Add an operating company or vendor brand to begin routing sales inquiries."
          />
        </div>
      )}

      {/* Tab 4: Sales Routing Rules */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="font-bold text-sm text-indigo-950">
                Deterministic 7-Level Sales Representative Routing Engine
              </span>
            </div>
            <p className="text-xs text-indigo-900">
              When a customer requests connection for a product and operating company, the system deterministically evaluates assignments in strict priority order:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] text-indigo-950 font-medium">
              <div className="bg-white/80 p-2 rounded border border-indigo-100">
                <span className="font-bold text-indigo-700">1. Customer + Product Match</span> — Direct customer key-account rule for SKU
              </div>
              <div className="bg-white/80 p-2 rounded border border-indigo-100">
                <span className="font-bold text-indigo-700">2. Customer + Company Match</span> — Customer dedicated account rep for brand
              </div>
              <div className="bg-white/80 p-2 rounded border border-indigo-100">
                <span className="font-bold text-indigo-700">3. Company + Product Match</span> — Product specialist assigned to this specific SKU
              </div>
              <div className="bg-white/80 p-2 rounded border border-indigo-100">
                <span className="font-bold text-indigo-700">4. Company + Category Match</span> — Category specialist (e.g. Server, Networking)
              </div>
              <div className="bg-white/80 p-2 rounded border border-indigo-100">
                <span className="font-bold text-indigo-700">5. Company Default Rep</span> — Dedicated fallback rep flagged for company
              </div>
              <div className="bg-white/80 p-2 rounded border border-indigo-100">
                <span className="font-bold text-indigo-700">6. Customer Assigned Rep</span> — General relationship manager for customer
              </div>
            </div>
          </div>

          <DataTable
            columns={assignmentColumns}
            data={assignments}
            emptyMessage="No routing rules configured"
            emptyDescription="Create a sales assignment rule to route customer inquiries automatically."
          />
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
              label="Base Price (₹)"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={productBasePrice}
              onChange={(e) => setProductBasePrice(e.target.value)}
            />
            <Input
              label="Cost Price (₹)"
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
              <span className="text-slate-500 ml-3">Base Price: {formatCurrency(selectedProductForVariants?.basePrice || 0)}</span>
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
                label="Additional Price (₹)"
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
                        (+{formatCurrency(v.additionalPrice || 0)})
                      </span>
                      <span className="ml-2 text-slate-400">
                        Total: {formatCurrency((selectedProductForVariants?.basePrice || 0) + (v.additionalPrice || 0))}
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

      {/* Company Modal (Add) */}
      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        title="Add Vendor Brand / Operating Company"
        description="Register a new vendor brand or division to group products and assign sales representatives."
      >
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company Code"
              required
              placeholder="e.g. CISCO, DELL, HPE"
              value={compCode}
              onChange={(e) => setCompCode(e.target.value.toUpperCase())}
            />
            <Input
              label="Company / Brand Name"
              required
              placeholder="e.g. Cisco Systems, Dell Tech"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
            />
          </div>

          <Textarea
            label="Description (Optional)"
            placeholder="Overview of operating division or vendor brand..."
            rows={2}
            value={compDesc}
            onChange={(e) => setCompDesc(e.target.value)}
          />

          <Input
            label="Official Website (Optional)"
            placeholder="e.g. https://www.cisco.com"
            value={compWebsite}
            onChange={(e) => setCompWebsite(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Email (Optional)"
              type="email"
              placeholder="sales@vendor.com"
              value={compEmail}
              onChange={(e) => setCompEmail(e.target.value)}
            />
            <Input
              label="Contact Phone (Optional)"
              placeholder="+91 (80) 4123-4567"
              value={compPhone}
              onChange={(e) => setCompPhone(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCompSubmitting}>
              Create Company
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sales Assignment Modal (Add) */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Create Sales Representative Routing Rule"
        description="Configure deterministic routing priorities to assign incoming inquiries to the right sales specialist."
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Operating Company"
              required
              value={asCompanyId}
              onChange={(e) => setAsCompanyId(e.target.value)}
              options={companies.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
              }))}
            />
            <Select
              label="Assigned Sales Representative"
              required
              value={asRepId}
              onChange={(e) => setAsRepId(e.target.value)}
              options={users.map((u) => ({
                value: u.id,
                label: `${u.fullName || u.username} (${u.role})`,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Product Specific (Optional)"
              value={asProductId}
              onChange={(e) => setAsProductId(e.target.value)}
              options={[
                { value: '', label: 'All Products in Company' },
                ...products.map((p) => ({
                  value: p.id,
                  label: `[${p.sku}] ${p.name}`,
                })),
              ]}
            />
            <Select
              label="Category Level (Optional)"
              value={asCategoryId}
              onChange={(e) => setAsCategoryId(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <Input
              label="Evaluation Priority (1 = Highest)"
              type="number"
              min="1"
              max="100"
              required
              value={asPriority}
              onChange={(e) => setAsPriority(e.target.value)}
            />
            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={asIsDefault}
                  onChange={(e) => setAsIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Mark as Default Fallback Rep for Company
              </label>
            </div>
          </div>

          <Textarea
            label="Internal Notes (Optional)"
            placeholder="Special territory notes or product specialty rationale..."
            rows={2}
            value={asNotes}
            onChange={(e) => setAsNotes(e.target.value)}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsAssignmentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isAsSubmitting}>
              Create Routing Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCatalogPage;
