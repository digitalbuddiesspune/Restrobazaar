/**
 * Minimum calendar days an order must stay pending to count as "Total Pending".
 * 1 = includes yesterday (and older), so they are not missed under today's queue.
 */
export const AGED_PENDING_DAYS = 1;

/**
 * Calendar days since order was created (local timezone).
 */
export const getDaysPending = (createdAt) => {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;

  const startOfCreated = new Date(
    created.getFullYear(),
    created.getMonth(),
    created.getDate()
  );
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = startOfToday.getTime() - startOfCreated.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
};

/**
 * Pending order older than today (includes yesterday) — used so older queue items are not missed.
 * Threshold defaults to 2 days; pass minDays=1 to include yesterday.
 */
export const isAgedPendingOrder = (order, minDays = AGED_PENDING_DAYS) => {
  const status = (order?.orderStatus || order?.Order_status || 'pending').toLowerCase();
  if (status !== 'pending') return false;
  return getDaysPending(order.createdAt || order.order_date_and_time) >= minDays;
};

export const filterAgedPendingOrders = (orders = [], minDays = AGED_PENDING_DAYS) =>
  orders
    .filter((order) => isAgedPendingOrder(order, minDays))
    .sort(
      (a, b) =>
        new Date(a.createdAt || a.order_date_and_time) -
        new Date(b.createdAt || b.order_date_and_time)
    );

export const countAgedPendingOrders = (orders = [], minDays = AGED_PENDING_DAYS) =>
  orders.filter((order) => isAgedPendingOrder(order, minDays)).length;
