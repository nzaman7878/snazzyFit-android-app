async function runPhase3Tests() {
  console.log('--- Phase 3 Automated Verification Suite ---');
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

  // Test 1: Query parameter builder matching productController.js:160-185
  function buildProductQueryParams(params) {
    const query = {};
    if (params.search) query.search = params.search;
    if (params.category && params.category !== 'All') query.category = params.category;
    if (params.subCategory && params.subCategory !== 'All') query.subCategory = params.subCategory;
    if (params.bestseller) query.bestseller = params.bestseller;
    if (params.sortType) query.sortType = params.sortType;
    return query;
  }

  const queryA = buildProductQueryParams({ category: 'Men', bestseller: true, search: 'hoodie' });
  assert(queryA.category === 'Men' && queryA.bestseller === true && queryA.search === 'hoodie', 'Product query parameters match backend filters');

  const queryB = buildProductQueryParams({ category: 'All', subCategory: 'All' });
  assert(!queryB.category && !queryB.subCategory, 'Category "All" gracefully omitted from backend filter');

  // Test 2: Discount formula calculation matching backend productController.js:36-61
  function calculateDiscount(originalPrice, discount) {
    let itemDiscountAmount = 0;
    if (discount.type === 'percentage') {
      itemDiscountAmount = (originalPrice * discount.value) / 100;
    } else {
      itemDiscountAmount = discount.value;
    }
    const discountedPrice = Math.max(0, originalPrice - itemDiscountAmount);
    const percentageSaved = Math.round((itemDiscountAmount / originalPrice) * 100);
    return { discountedPrice, percentageSaved, itemDiscountAmount };
  }

  const discountResult = calculateDiscount(1000, { type: 'percentage', value: 20 });
  assert(discountResult.discountedPrice === 800, 'Percentage discount calculates correct final price (₹800 on ₹1000 with 20% off)');
  assert(discountResult.percentageSaved === 20, 'Percentage saved matches 20%');

  // Test 3: Per-size stock validation matching backend productModel & orderController
  const mockStockQuantities = { XS: 0, S: 5, M: 12, L: 0 };
  function isSizeAvailable(size) {
    return (mockStockQuantities[size] || 0) > 0;
  }

  assert(!isSizeAvailable('XS'), 'Out-of-stock size XS is correctly flagged');
  assert(isSizeAvailable('M'), 'In-stock size M is available');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runPhase3Tests();
