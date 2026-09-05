import React, { useState, useEffect } from 'react';
import { productApi } from '../../api/productApi.js';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Input } from '../common/Input.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { Search, Package } from 'lucide-react';

export const AddProductModal = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Manual server-state fetching using native React useEffect
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);
    productApi.getProducts({ PageNumber: 1, PageSize: 20, SearchTerm: searchTerm || undefined })
      .then((res) => {
        if (isMounted) {
          setProducts(res?.Items || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load products', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, searchTerm]);

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    if (prod.Variants && prod.Variants.length > 0) {
      setSelectedVariant(prod.Variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const request = {
      ProductId: selectedProduct.Id || selectedProduct.id,
      ProductVariantId: selectedVariant ? (selectedVariant.Id || selectedVariant.id) : undefined,
      Quantity: quantity,
      DiscountPercentage: discountPercent,
      DiscountReason: discountReason.trim() || undefined,
    };

    onAddProduct(request);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
    setDiscountPercent(0);
    setDiscountReason('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Add Line Item to Quotation"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Search Products</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by product name, SKU, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Product List */}
        <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-6 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">No products found</div>
          ) : (
            products.map((prod) => {
              const isSelected = selectedProduct?.Id === prod.Id || selectedProduct?.id === prod.id;
              return (
                <div
                  key={prod.Id || prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 rounded text-slate-600">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{prod.Name || prod.name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        SKU: {prod.Sku || prod.sku} | Base: ${(prod.BasePrice ?? prod.basePrice ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {prod.Variants && prod.Variants.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {prod.Variants.length} variants
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Variant selection if product has variants */}
        {selectedProduct && selectedProduct.Variants && selectedProduct.Variants.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Variant</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedVariant?.Id || selectedVariant?.id || ''}
              onChange={(e) => {
                const v = selectedProduct.Variants?.find((x) => (x.Id || x.id) === e.target.value);
                if (v) setSelectedVariant(v);
              }}
            >
              {selectedProduct.Variants.map((v) => (
                <option key={v.Id || v.id} value={v.Id || v.id}>
                  {v.VariantName || v.variantName} ({v.Sku || v.sku}) - Price Delta: ${(v.PriceAdjustment ?? v.priceExtra ?? 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity & Discount Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            required
          />
          <Input
            label="Discount (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
          />
        </div>

        {discountPercent > 0 && (
          <Input
            label="Discount Justification / Reason"
            placeholder="e.g., Enterprise volume tier concession, competitive match..."
            value={discountReason}
            onChange={(e) => setDiscountReason(e.target.value)}
          />
        )}

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedProduct}>
            Add to Quotation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
