import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../api';
import { AddQuotationLineRequest, ProductDto, ProductVariantDto } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Search, Package } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (request: AddQuotationLineRequest) => void;
  priceListId?: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => productApi.getProducts({ PageNumber: 1, PageSize: 20, SearchTerm: searchTerm || undefined }),
    enabled: isOpen,
  });

  const products = productsData?.Items || [];

  const handleSelectProduct = (prod: ProductDto) => {
    setSelectedProduct(prod);
    if (prod.Variants && prod.Variants.length > 0) {
      setSelectedVariant(prod.Variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const request: AddQuotationLineRequest = {
      ProductId: selectedProduct.Id,
      ProductVariantId: selectedVariant ? selectedVariant.Id : undefined,
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
            products.map((prod: ProductDto) => {
              const isSelected = selectedProduct?.Id === prod.Id;
              return (
                <div
                  key={prod.Id}
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
                      <div className="text-sm font-semibold text-slate-800">{prod.Name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        SKU: {prod.Sku} | Base: ${(prod.BasePrice ?? prod.basePrice ?? 0).toFixed(2)}
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
              value={selectedVariant?.Id || ''}
              onChange={(e) => {
                const v = selectedProduct.Variants?.find((x) => x.Id === e.target.value);
                if (v) setSelectedVariant(v);
              }}
            >
              {selectedProduct.Variants.map((v) => (
                <option key={v.Id} value={v.Id}>
                  {v.VariantName} ({v.Sku}) - Price Delta: ${(v.PriceAdjustment ?? v.priceExtra ?? 0).toFixed(2)}
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
