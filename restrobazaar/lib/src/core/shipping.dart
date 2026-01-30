/// Calculate shipping charges based on order amount.
double calculateShippingCharges(double orderAmount) {
  if (orderAmount >= 6000) {
    return 0;
  } else if (orderAmount >= 3000) {
    return 200;
  }
  return 300;
}
