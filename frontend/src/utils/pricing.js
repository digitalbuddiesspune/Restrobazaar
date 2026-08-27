/** Apply GST % on an exclusive base price. */
export function withGst(base, gstPercent = 0) {
  const amount = Number(base);
  const rate = Number(gstPercent);
  if (!Number.isFinite(amount)) return 0;
  const pct = Number.isFinite(rate) && rate > 0 ? rate : 0;
  return Number((amount * (1 + pct / 100)).toFixed(2));
}

/** Format INR for display. */
export function formatInr(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Selling price from a vendor product, including GST. */
export function productDisplayPrice(product) {
  if (!product) return null;
  const gst = product.gst || 0;
  if (product.priceType === 'single' && product.pricing?.single?.price != null) {
    return withGst(product.pricing.single.price, gst);
  }
  if (product.priceType === 'bulk' && product.pricing?.bulk?.length > 0) {
    const last = product.pricing.bulk[product.pricing.bulk.length - 1];
    return withGst(last.price, gst);
  }
  if (product.price != null) return withGst(product.price, gst);
  return null;
}

/** Compare-at / default price including GST. */
export function productDefaultPriceInclGst(product) {
  if (!product) return null;
  const base = product.defaultPrice ?? product.originalPrice;
  if (base == null) return null;
  return withGst(base, product.gst || 0);
}
