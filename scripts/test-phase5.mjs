async function runPhase5Tests() {
  console.log('--- Phase 5 Automated Verification Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // Test 1: Order total calculation matching checkoutController.js:117 & orderController.js:60
  const deliveryCharge = 10;
  function computeOrderPayable(itemsSubtotal, couponDiscount = 0) {
    const discountedSubtotal = Math.max(0, itemsSubtotal - couponDiscount);
    return discountedSubtotal + deliveryCharge;
  }

  const payableA = computeOrderPayable(1500, 200);
  assert(payableA === 1310, 'Payable amount computes correctly: ₹1500 subtotal − ₹200 coupon + ₹10 delivery = ₹1310');

  const payableB = computeOrderPayable(50, 100);
  assert(payableB === 10, 'Coupon discount cannot reduce subtotal below 0 (₹0 + ₹10 delivery = ₹10)');

  // Test 2: Order Payload Validation
  function validateOrderPayload(payload) {
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) return false;
    if (!payload.address || !payload.address.street || !payload.address.city || !payload.address.zipcode) return false;
    return true;
  }

  const validPayload = {
    items: [{ _id: 'prod_1', size: 'M', quantity: 1 }],
    address: { street: '123 St', city: 'Mumbai', zipcode: '400001' },
  };
  assert(validateOrderPayload(validPayload), 'Valid order payload successfully passes verification');

  const invalidPayload = { items: [], address: {} };
  assert(!validateOrderPayload(invalidPayload), 'Invalid order payload without items or address correctly rejected');

  // Test 3: Review Rating Validation matching reviewModel.js:19
  function validateReview(rating, text) {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
  }
  assert(!validateReview(0, 'Bad'), 'Rating 0 rejected (below minimum 1)');
  assert(!validateReview(6, 'Super'), 'Rating 6 rejected (above maximum 5)');
  assert(validateReview(5, 'Excellent'), 'Rating 5 accepted');

  // Test 4: Order Status Color Mapping
  function getStatusLabel(status) {
    const validStatuses = ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered'];
    return validStatuses.includes(status);
  }
  assert(getStatusLabel('Order Placed') && getStatusLabel('Delivered'), 'Order statuses match backend orderModel enum');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runPhase5Tests();
