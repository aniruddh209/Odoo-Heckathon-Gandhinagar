import React, { useState, useEffect } from 'react';
import { billingApi } from '../api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Repeat, Plus } from 'lucide-react';

export const AdminSubscriptionsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [periodicPrice, setPeriodicPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await billingApi.getSubscriptionPlans();
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await billingApi.createSubscriptionPlan({
        Name: name,
        BillingFrequency: frequency,
        PeriodicPrice: periodicPrice,
        Description: description,
        IsActive: true,
      });
      setIsModalOpen(false);
      setName('');
      setPeriodicPrice(0);
      setDescription('');
      setAlertMessage({ type: 'success', text: 'Subscription plan created.' });
      fetchPlans();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to create plan.' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription & SLA Plan Master</h1>
          <p className="text-xs text-slate-500">
            Configure recurring SaaS tiers, maintenance agreements, and periodic billing rules
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Plan Tier
        </Button>
      </div>

      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.text}
          onClose={() => setAlertMessage(null)}
        />
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Repeat className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Recurring Contract Blueprints</h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
            {plans.length} Defined Plans
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Plan Name</th>
                <th className="py-3.5 px-4">Cadence</th>
                <th className="py-3.5 px-4 text-right">Periodic Rate</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <LoadingSpinner size="md" />
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    No recurring subscription plans configured.
                  </td>
                </tr>
              ) : (
                plans.map((p) => {
                  const planName = p.Name || p.name;
                  const freq = p.BillingFrequency || p.billingInterval || 'Monthly';
                  const rate = p.PeriodicPrice ?? p.periodicPrice ?? 0;
                  const desc = p.Description || p.description;

                  return (
                    <tr key={p.Id || p.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{planName}</td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 capitalize">
                        {freq}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${rate.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{desc || '-'}</td>
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
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Subscription Plan" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Plan Name" placeholder="e.g. Enterprise SLA 24/7 Gold" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select
            label="Billing Cadence"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            options={[
              { value: 'Monthly', label: 'Monthly' },
              { value: 'Quarterly', label: 'Quarterly' },
              { value: 'Annual', label: 'Annual' },
            ]}
          />
          <Input
            label="Periodic Price ($)"
            type="number"
            step="0.01"
            value={periodicPrice}
            onChange={(e) => setPeriodicPrice(parseFloat(e.target.value) || 0)}
            required
          />
          <Input
            label="Plan Features / Description"
            placeholder="e.g. 4-hour on-site dispatch, dedicated TAM, weekly telemetry..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
