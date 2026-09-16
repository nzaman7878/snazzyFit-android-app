// scripts/test-phase6.mjs
import fs from 'fs';
import path from 'path';

console.log('=== Running Phase 6 Verification (Android Polish & Build Readiness) ===\n');

let failed = false;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Validate app.json configuration
const appJsonPath = path.resolve('app.json');
assert(fs.existsSync(appJsonPath), 'app.json exists');
const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

assert(appConfig.expo?.android?.package === 'com.snazzyfit.app', 'Android package is com.snazzyfit.app');
assert(
  appConfig.expo?.android?.permissions?.includes('INTERNET') &&
  appConfig.expo?.android?.permissions?.includes('ACCESS_NETWORK_STATE'),
  'Android permissions include INTERNET and ACCESS_NETWORK_STATE'
);
assert(appConfig.expo?.plugins?.includes('expo-secure-store'), 'expo-secure-store plugin registered');

// 2. Validate package.json dependencies
const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
assert(!!deps['@react-native-community/netinfo'], '@react-native-community/netinfo dependency installed');
assert(!!deps['expo-secure-store'], 'expo-secure-store dependency installed');
assert(!!deps['@tanstack/react-query'], '@tanstack/react-query dependency installed');
assert(!!deps['axios'], 'axios dependency installed');

// 3. Verify key file paths across all phases
const criticalFiles = [
  'src/services/api/client.ts',
  'src/services/storage/tokenStorage.ts',
  'src/context/AuthContext.tsx',
  'src/context/CartContext.tsx',
  'src/components/ui/OfflineBanner.tsx',
  'src/app/_layout.tsx',
  'src/app/(auth)/login.tsx',
  'src/app/(auth)/register.tsx',
  'src/app/explore.tsx',
  'src/app/product/[id].tsx',
  'src/app/cart.tsx',
  'src/app/wishlist.tsx',
  'src/app/checkout/index.tsx',
  'src/app/orders/index.tsx',
  'docs/API_INTEGRATION_GUIDE.md',
];

criticalFiles.forEach((file) => {
  assert(fs.existsSync(path.resolve(file)), `File exists: ${file}`);
});

if (failed) {
  console.error('\n❌ Phase 6 verification failed!');
  process.exit(1);
} else {
  console.log('\n🎉 All Phase 6 verifications passed successfully!');
}
