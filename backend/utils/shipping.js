/**
 * Default shipping tiers (order amount range → shipping price).
 */
export const DEFAULT_SHIPPING_TIERS = [
  { minAmount: 0, maxAmount: 2999, charge: 250 },
  { minAmount: 3000, maxAmount: 5999, charge: 150 },
  { minAmount: 6000, maxAmount: null, charge: 0 },
];

export const DEFAULT_SHIPPING_SETTINGS = {
  enabled: true,
  tiers: DEFAULT_SHIPPING_TIERS,
};

const toNonNeg = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Convert legacy threshold fields into range tiers. */
export const legacyToTiers = (raw = {}) => {
  const baseCharge = toNonNeg(raw.baseCharge, 250);
  const midTierThreshold = toNonNeg(raw.midTierThreshold, 3000);
  const midTierCharge = toNonNeg(raw.midTierCharge, 150);
  const freeShippingThreshold = toNonNeg(raw.freeShippingThreshold, 6000);

  return [
    {
      minAmount: 0,
      maxAmount: Math.max(0, midTierThreshold - 1),
      charge: baseCharge,
    },
    {
      minAmount: midTierThreshold,
      maxAmount: Math.max(midTierThreshold, freeShippingThreshold - 1),
      charge: midTierCharge,
    },
    {
      minAmount: freeShippingThreshold,
      maxAmount: null,
      charge: 0,
    },
  ];
};

const normalizeTier = (tiers) => {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return DEFAULT_SHIPPING_TIERS.map((t) => ({ ...t }));
  }

  return tiers
    .map((tier) => {
      const minAmount = toNonNeg(tier.minAmount, 0);
      const maxRaw = tier.maxAmount;
      const maxAmount =
        maxRaw === null || maxRaw === undefined || maxRaw === ''
          ? null
          : toNonNeg(maxRaw, null);
      const charge = toNonNeg(tier.charge, 0);
      return { minAmount, maxAmount, charge };
    })
    .sort((a, b) => a.minAmount - b.minAmount);
};

/**
 * Normalize vendor shippingSettings (fill defaults).
 * Supports new `tiers` and legacy threshold fields.
 */
export const normalizeShippingSettings = (raw = {}) => {
  const enabled = raw.enabled !== false;
  let tiers;

  if (Array.isArray(raw.tiers) && raw.tiers.length > 0) {
    tiers = normalizeTier(raw.tiers);
  } else if (
    raw.baseCharge != null ||
    raw.midTierThreshold != null ||
    raw.freeShippingThreshold != null
  ) {
    tiers = normalizeTier(legacyToTiers(raw));
  } else {
    tiers = DEFAULT_SHIPPING_TIERS.map((t) => ({ ...t }));
  }

  return { enabled, tiers };
};

/**
 * Calculate shipping from order amount + vendor settings.
 * @param {number} orderAmount - typically cart total (excl. GST)
 * @param {object} [settings] - vendor.shippingSettings
 * @returns {number}
 */
export const calculateShippingCharges = (orderAmount, settings) => {
  const cfg = normalizeShippingSettings(settings || {});
  if (!cfg.enabled) return 0;

  const amount = Number(orderAmount) || 0;
  const match = cfg.tiers.find((tier) => {
    const minOk = amount >= tier.minAmount;
    const maxOk = tier.maxAmount == null || amount <= tier.maxAmount;
    return minOk && maxOk;
  });

  if (match) return match.charge;

  // Fallback: use last tier if amount is above all ranges
  const last = cfg.tiers[cfg.tiers.length - 1];
  return last ? last.charge : 0;
};
