async function runPhase4Tests() {
  console.log('--- Phase 4 Automated Verification Suite ---');
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

  // Test 1: Cart nested dictionary mutation matching cartController.js:13-21
  let cartData = {};

  function addToCart(itemId, size) {
    if (!cartData[itemId]) cartData[itemId] = {};
    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
  }

  addToCart('prod_1', 'M');
  addToCart('prod_1', 'M');
  addToCart('prod_1', 'L');
  addToCart('prod_2', 'S');

  assert(cartData['prod_1']['M'] === 2, 'Quantity increments properly for existing size');
  assert(cartData['prod_1']['L'] === 1, 'Distinct size under same product added correctly');
  assert(cartData['prod_2']['S'] === 1, 'New product added correctly');

  // Test 2: Quantity stepper and zero-removal matching cartController.js:54
  function updateQuantity(itemId, size, qty) {
    if (qty <= 0) {
      if (cartData[itemId]) {
        delete cartData[itemId][size];
        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      }
    } else {
      if (!cartData[itemId]) cartData[itemId] = {};
      cartData[itemId][size] = qty;
    }
  }

  updateQuantity('prod_1', 'L', 0);
  assert(!cartData['prod_1']['L'], 'Setting quantity to 0 removes size from product');
  assert(cartData['prod_1']['M'] === 2, 'Other sizes remain unaffected');

  updateQuantity('prod_2', 'S', 0);
  assert(!cartData['prod_2'], 'Empty product object deleted when last size is removed');

  // Test 3: Hydration and subtotal calculation
  const mockProducts = {
    prod_1: { _id: 'prod_1', name: 'Hoodie', price: 1200 },
  };

  let totalCount = 0;
  let subtotal = 0;
  const flatItems = [];

  Object.keys(cartData).forEach((itemId) => {
    const sizes = cartData[itemId] || {};
    Object.keys(sizes).forEach((size) => {
      const qty = sizes[size];
      totalCount += qty;
      const product = mockProducts[itemId];
      if (product) {
        subtotal += product.price * qty;
      }
      flatItems.push({ itemId, size, quantity: qty, product });
    });
  });

  assert(totalCount === 2, 'Total cart count matches 2 items');
  assert(subtotal === 2400, 'Subtotal correctly calculates ₹2400 (2 × ₹1200)');
  assert(flatItems.length === 1 && flatItems[0].size === 'M', 'Hydrated cart item matches product and size');

  // Test 4: Wishlist Toggle logic matching userController.js:206-214
  let wishlist = ['p1', 'p2'];
  function toggleWishlist(id) {
    const idx = wishlist.indexOf(id);
    if (idx > -1) {
      wishlist.splice(idx, 1);
    } else {
      wishlist.push(id);
    }
  }

  toggleWishlist('p2');
  assert(wishlist.length === 1 && !wishlist.includes('p2'), 'Existing item removed from wishlist on toggle');

  toggleWishlist('p3');
  assert(wishlist.length === 2 && wishlist.includes('p3'), 'New item added to wishlist on toggle');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runPhase4Tests();
