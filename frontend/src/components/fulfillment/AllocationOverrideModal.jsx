import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { AlertCircle } from 'lucide-react';

export const AllocationOverrideModal = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  warehouses = [],
  onConfirm,
  isSubmitting = false,
}) => {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.Id || '');
  const [orderLineId, setOrderLineId] = useState('');
  const [allocatedQuantity, setAllocatedQuantity] = useState(1);
  const [overrideReason, setOverrideReason] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError('An audit justification reason is mandatory for manual warehouse overrides.');
      return;
    }

    onConfirm({
      OrderId: orderId,
      OrderLineId: orderLineId || undefined,
      WarehouseId: warehouseId,
      AllocatedQuantity: allocatedQuantity,
      OverrideReason: overrideReason.trim(),
    });
  };

  const handleClose = () => {
    setOverrideReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Manual Warehouse Override — Order ${orderNumber}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Select
          label="Target Warehouse Location"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          options={warehouses.map((w) => ({
            value: w.Id,
            label: `${w.Name} (${w.Code}) - ${w.City || 'Main Hub'}`,
          }))}
          required
        />

        <Input
          label="Override Allocation Quantity"
          type="number"
          min="1"
          value={allocatedQuantity}
          onChange={(e) => setAllocatedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Audit Reason for Manual Routing <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={3}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Customer VIP emergency consignment, local pickup requested by site manager..."
            value={overrideReason}
            onChange={(e) => {
              setOverrideReason(e.target.value);
              if (error) setError(null);
            }}
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Apply Override
          </Button>
        </div>
      </form>
    </Modal>
  );
};
