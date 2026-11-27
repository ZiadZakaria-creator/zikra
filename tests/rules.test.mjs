// Security rules tests (run: cd tests && npm i && npm run rules)
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-zikra',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 }
});

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'admins/admin1'), { email: 'a@zikra.test' });
  await setDoc(doc(db, 'settings/store'), { shippingFees: { cairo: 85, alex: 120, aswan: 200 } });
  await setDoc(doc(db, 'products/p1'), { name: '007' });
  await setDoc(doc(db, 'coupons/ZIKRA10'), { percent: 10, active: true, expiresAt: Timestamp.fromDate(new Date(Date.now() + 864e5)) });
  await setDoc(doc(db, 'coupons/OLD'), { percent: 10, active: true, expiresAt: Timestamp.fromDate(new Date(Date.now() - 864e5)) });
  await setDoc(doc(db, 'coupons/OFF'), { percent: 10, active: false, expiresAt: Timestamp.fromDate(new Date(Date.now() + 864e5)) });
});

const guest = env.unauthenticatedContext().firestore();
const admin = env.authenticatedContext('admin1').firestore();
const stranger = env.authenticatedContext('someone').firestore();

let n = 0;
const order = (over = {}) => {
  n++;
  const id = `ZK-261127-AB${'CDEFGHJK'[n % 8]}${'MNPQRSTU'[Math.floor(n / 8) % 8]}`;
  return {
    id, createdAt: serverTimestamp(), status: 'new',
    customer: { name: 'أحمد', phone: '01012345678', phone2: '' },
    address: { gov: 'cairo', govName: 'القاهرة', zone: '', zoneName: 'مدينة نصر', street: 'شارع عباس العقاد', landmark: '' },
    items: [{ id: 'p1', name: '007', size: 50, price: 650, qty: 1, total: 650, tester: true }],
    subtotal: 650, shipping: 85, discount: 0, coupon: '', total: 735, payment: 'cod', notes: '',
    ...over
  };
};
const create = (db, o) => setDoc(doc(db, 'orders', o.id), o);

const results = [];
async function t(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' → ' + e.message.split('\n')[0]]); } }

await t('guest can create a valid order', () => assertSucceeds(create(guest, order())));
await t('guest can create order with valid coupon', () => assertSucceeds(create(guest, order({ coupon: 'ZIKRA10', discount: 65, total: 670 }))));
await t('guest can create wallet order to Aswan', () => assertSucceeds(create(guest, order({ address: { gov: 'aswan', govName: 'أسوان', zone: '', zoneName: 'المدينة', street: 'كورنيش النيل', landmark: '' }, shipping: 200, total: 850, payment: 'wallet' }))));
await t('reject wrong shipping fee', () => assertFails(create(guest, order({ shipping: 10, total: 660 }))));
await t('reject unknown governorate', () => assertFails(create(guest, order({ address: { gov: 'mars', govName: 'x', zone: '', zoneName: 'yy', street: 'street 12', landmark: '' } }))));
await t('reject wrong total', () => assertFails(create(guest, order({ total: 1 }))));
await t('reject discount without coupon', () => assertFails(create(guest, order({ discount: 100, total: 635 }))));
await t('reject expired coupon', () => assertFails(create(guest, order({ coupon: 'OLD', discount: 65, total: 670 }))));
await t('reject disabled coupon', () => assertFails(create(guest, order({ coupon: 'OFF', discount: 65, total: 670 }))));
await t('reject inflated coupon discount', () => assertFails(create(guest, order({ coupon: 'ZIKRA10', discount: 300, total: 435 }))));
await t('reject non-existing coupon', () => assertFails(create(guest, order({ coupon: 'FAKE', discount: 65, total: 670 }))));
await t('reject bad phone', () => assertFails(create(guest, order({ customer: { name: 'أحمد', phone: '0123', phone2: '' } }))));
await t('reject status other than new', () => assertFails(create(guest, order({ status: 'delivered' }))));
await t('reject client-set createdAt', () => assertFails(create(guest, order({ createdAt: Timestamp.fromDate(new Date(2020, 0, 1)) }))));
await t('reject extra fields', () => assertFails(create(guest, order({ isPaid: true }))));
await t('reject bad order id', () => assertFails(setDoc(doc(guest, 'orders/hack'), { ...order(), id: 'hack' })));
await t('reject empty items', () => assertFails(create(guest, order({ items: [] }))));
await t('guest cannot overwrite an existing order', async () => { const o = order(); await create(guest, o); await assertFails(create(guest, { ...o, notes: 'x' })); });
await t('guest cannot read orders', () => assertFails(getDocs(collection(guest, 'orders'))));
await t('signed-in non-admin cannot read orders', () => assertFails(getDocs(collection(stranger, 'orders'))));
await t('admin can read orders', () => assertSucceeds(getDocs(collection(admin, 'orders'))));
await t('admin can update order status', async () => { const o = order(); await create(guest, o); await assertSucceeds(updateDoc(doc(admin, 'orders', o.id), { status: 'confirmed' })); });
await t('guest can read products', () => assertSucceeds(getDoc(doc(guest, 'products/p1'))));
await t('guest cannot write products', () => assertFails(setDoc(doc(guest, 'products/p2'), { name: 'x' })));
await t('non-admin cannot write products', () => assertFails(setDoc(doc(stranger, 'products/p2'), { name: 'x' })));
await t('admin can write products', () => assertSucceeds(setDoc(doc(admin, 'products/p2'), { name: 'x' })));
await t('guest cannot change settings', () => assertFails(setDoc(doc(guest, 'settings/store'), { shippingFees: { cairo: 0 } })));
await t('guest can get one coupon', () => assertSucceeds(getDoc(doc(guest, 'coupons/ZIKRA10'))));
await t('guest cannot list coupons', () => assertFails(getDocs(collection(guest, 'coupons'))));
await t('guest cannot create coupons', () => assertFails(setDoc(doc(guest, 'coupons/FREE'), { percent: 100, active: true })));
await t('nobody can make themselves admin', () => assertFails(setDoc(doc(stranger, 'admins/someone'), { email: 'x' })));

await env.cleanup();
for (const [s, name] of results) console.log(s, name);
const failed = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
