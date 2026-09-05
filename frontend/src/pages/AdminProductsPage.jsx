import React, { useState, useEffect } from 'react';
import { productApi } from '../api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Plus, Search } from 'lucide-react';

export const AdminProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productApi.getProducts({
        PageNumber: page,
        PageSize: 10,
        SearchTerm: searchTerm || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  useEffect(() => {
    productApi.getCategories()
      .then((cats) => setCategories(cats || []))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  const handleResetForm = () => {
    setSku('');
    setName('');
    setDescription('');
    setBasePrice(0);
    setCostPrice(0);
    setCategoryId('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await productApi.createProduct({
        Sku: sku,
        Name: name,
        Description: description,
        BasePrice: basePrice,
        CostPrice: costPrice,
        CategoryId: categoryId || (categories[0]?.Id ?? ''),
        IsActive: true,
      });
      setIsModalOpen(false);
      handleResetForm();
      setAlertMessage({ type: 'success', text: 'Product created successfully.' });
      fetchProducts();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to create product.' });
    } finally {
      setIsCreating(false);
    }
  };

  const products = data?.Items || [];
  const totalPages = data?.TotalPages || 1;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product & Variant Master</h1>
          <p className="text-xs text-slate-500">
            Enterprise SKU catalog, cost price governance & matrix variants
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add New SKU
        </Button>
      </div>

      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.text}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search products by SKU or Name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Standard Cost</th>
                <th className="py-3.5 px-4 text-right">Base List Price</th>
                <th className="py-3.5 px-4 text-center">Variants</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <LoadingSpinner size="md" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No products cataloged yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const skuCode = p.Sku || p.sku;
                  const prodName = p.Name || p.name;
                  const catName = p.CategoryName || p.categoryName || 'General';
                  const cost = p.CostPrice ?? p.standardCostPrice ?? 0;
                  const base = p.BasePrice ?? p.listPrice ?? 0;
                  const variantsCount = (p.Variants || p.variants)?.length || 0;

                  return (
                    <tr key={p.Id || p.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{skuCode}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{prodName}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{catName}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        ${cost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${base.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded">
                          {variantsCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product SKU" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="SKU Code" placeholder="e.g. HW-SRV-001" value={sku} onChange={(e) => setSku(e.target.value)} required />
          <Input label="Product Name" placeholder="e.g. Enterprise Cloud Server Node" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description" placeholder="Specifications, warranty, details..." value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Cost Price ($)" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)} required />
            <Input label="Base Price ($)" type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)} required />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Save SKU
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
