import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVendorProfile } from '../../hooks/useVendorQueries';
import { vendorAccountService } from '../../services/vendorService';
import {
  DEFAULT_SHIPPING_TIERS,
  normalizeShippingSettings,
} from '../../utils/shipping';

const emptyTier = () => DEFAULT_SHIPPING_TIERS.map((t) => ({ ...t }));

const StoreSettings = () => {
  const queryClient = useQueryClient();
  const { data: profileData, isLoading, error } = useVendorProfile();
  const vendor = profileData?.data;

  const [enabled, setEnabled] = useState(true);
  const [tiers, setTiers] = useState(emptyTier);
  const [message, setMessage] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!vendor) return;
    const normalized = normalizeShippingSettings(vendor.shippingSettings || {});
    setEnabled(normalized.enabled);
    setTiers(
      (normalized.tiers || emptyTier()).map((t) => ({
        minAmount: t.minAmount ?? 0,
        maxAmount: t.maxAmount ?? '',
        charge: t.charge ?? 0,
      }))
    );
  }, [vendor]);

  const saveMutation = useMutation({
    mutationFn: (payload) => vendorAccountService.updateShippingSettings(payload),
    onSuccess: (res) => {
      setMessage(res?.message || 'Shipping settings saved');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['vendor', 'profile'] });
      if (res?.data) {
        const normalized = normalizeShippingSettings(res.data);
        setEnabled(normalized.enabled);
        setTiers(
          (normalized.tiers || emptyTier()).map((t) => ({
            minAmount: t.minAmount ?? 0,
            maxAmount: t.maxAmount ?? '',
            charge: t.charge ?? 0,
          }))
        );
      }
    },
    onError: (err) => {
      setMessage(null);
      setFormError(
        err?.response?.data?.message || err?.message || 'Failed to save settings'
      );
    },
  });

  const updateTier = (index, field, value) => {
    setTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
    setMessage(null);
    setFormError(null);
  };

  const addTier = () => {
    setTiers((prev) => {
      const last = prev[prev.length - 1];
      const nextMin =
        last?.maxAmount !== '' && last?.maxAmount != null
          ? Number(last.maxAmount) + 1
          : Number(last?.minAmount || 0) + 1;
      return [
        ...prev,
        { minAmount: nextMin, maxAmount: '', charge: 0 },
      ];
    });
    setMessage(null);
    setFormError(null);
  };

  const removeTier = (index) => {
    setTiers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setMessage(null);
    setFormError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payloadTiers = tiers.map((tier) => ({
      minAmount: Number(tier.minAmount) || 0,
      maxAmount:
        tier.maxAmount === '' || tier.maxAmount === null || tier.maxAmount === undefined
          ? null
          : Number(tier.maxAmount),
      charge: Number(tier.charge) || 0,
    }));

    for (const tier of payloadTiers) {
      if (tier.maxAmount != null && tier.maxAmount < tier.minAmount) {
        setFormError(
          `Invalid range: "To" must be ≥ "From" (₹${tier.minAmount})`
        );
        return;
      }
    }

    saveMutation.mutate(
      normalizeShippingSettings({
        enabled: Boolean(enabled),
        tiers: payloadTiers,
      })
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 text-red-600 text-sm">
        Failed to load store settings. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Store Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Set shipping price by order amount range (cart total before GST).
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4 max-w-3xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-900">Shipping by order amount</h3>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(enabled)}
              onChange={(e) => {
                setEnabled(e.target.checked);
                setMessage(null);
                setFormError(null);
              }}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            Enabled
          </label>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Order amount from (₹)</th>
                <th className="px-3 py-2 text-left font-medium">Order amount to (₹)</th>
                <th className="px-3 py-2 text-left font-medium">Shipping price (₹)</th>
                <th className="px-3 py-2 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tiers.map((tier, index) => (
                <tr key={index} className={!enabled ? 'opacity-60' : ''}>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!enabled}
                      value={tier.minAmount}
                      onChange={(e) => updateTier(index, 'minAmount', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!enabled}
                      value={tier.maxAmount === null ? '' : tier.maxAmount}
                      onChange={(e) => updateTier(index, 'maxAmount', e.target.value)}
                      placeholder="No limit"
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!enabled}
                      value={tier.charge}
                      onChange={(e) => updateTier(index, 'charge', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                      required
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={!enabled || tiers.length <= 1}
                      onClick={() => removeTier(index)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium disabled:opacity-40"
                      title="Remove range"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500">
          Leave &quot;To&quot; empty for no upper limit (e.g. ₹6000+). Use shipping price 0 for free.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={!enabled}
            onClick={addTier}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            + Add range
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save settings'}
          </button>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
      </form>
    </div>
  );
};

export default StoreSettings;
