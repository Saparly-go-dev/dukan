const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// --- Senäler ---
const pad = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const longDate = d => lang === 'en' ? `${t('months')[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : `${d.getDate()} ${t('months')[d.getMonth()]} ${d.getFullYear()}`;
const dayMonth = d => lang === 'en' ? `${t('months')[d.getMonth()]} ${d.getDate()}` : `${d.getDate()} ${t('months')[d.getMonth()]}`;
const shortDate = d => lang === 'en' ? `${t('monthsShort')[d.getMonth()]} ${d.getDate()}` : `${d.getDate()} ${t('monthsShort')[d.getMonth()]}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const TODAY = dayKey(new Date());

// --- Maglumatlar (brauzerde saklanýar) ---
const STORE_KEY = 'dukan-data-v1';

function seedData() {
  const products = [
    { id: 1, name: 'Ak tüwi 1 kg', code: 'HR-001', category: 'Azyk önümleri', price: 18, stock: 48 },
    { id: 2, name: 'Günebakar ýagy 1 l', code: 'HR-002', category: 'Azyk önümleri', price: 28, stock: 4 },
    { id: 3, name: 'Gök çaý 100 g', code: 'HR-003', category: 'Içgiler', price: 15, stock: 32 },
    { id: 4, name: 'Şeker 1 kg', code: 'HR-004', category: 'Azyk önümleri', price: 12, stock: 65 },
    { id: 5, name: 'Süýt 1 l', code: 'HR-005', category: 'Azyk önümleri', price: 10, stock: 3 },
    { id: 6, name: 'Suw 1,5 l', code: 'HR-006', category: 'Içgiler', price: 4, stock: 120 },
    { id: 7, name: 'El sabyny 100 g', code: 'HR-007', category: 'Arassaçylyk', price: 6, stock: 0 },
    { id: 8, name: 'Depder 48 sahypa', code: 'HR-008', category: 'Kanselýariýa', price: 8, stock: 42 }
  ];
  const sales = [
    { id: 1041, date: TODAY, time: '09:12', items: [{ name: 'Ak tüwi 1 kg', qty: 2, price: 18 }, { name: 'Gök çaý 100 g', qty: 1, price: 15 }], total: 51 },
    { id: 1042, date: TODAY, time: '10:05', items: [{ name: 'Şeker 1 kg', qty: 3, price: 12 }, { name: 'Suw 1,5 l', qty: 6, price: 4 }], total: 60 },
    { id: 1043, date: TODAY, time: '11:30', items: [{ name: 'Günebakar ýagy 1 l', qty: 2, price: 28 }, { name: 'Süýt 1 l', qty: 2, price: 10 }], total: 76 },
    { id: 1044, date: TODAY, time: '12:45', items: [{ name: 'Depder 48 sahypa', qty: 5, price: 8 }, { name: 'Gök çaý 100 g', qty: 2, price: 15 }], total: 70 }
  ];
  // Öňki 6 günüň satuw möçberleri (grafik üçin başlangyç maglumat)
  const history = {};
  [185, 240, 198, 315, 280, 345].forEach((v, i) => { history[dayKey(daysAgo(6 - i))] = v; });
  return { products, sales, history };
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    if (data && Array.isArray(data.products) && Array.isArray(data.sales)) return { history: {}, ...data };
  } catch {}
  return seedData();
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ products, sales, history })); } catch {}
}

let { products, sales, history } = load();
let editing = null, cart = [];

// --- Görkezmek ---
function getFiltered() {
  const q = $('search').value.trim().toLocaleLowerCase(), cat = $('category').value, st = $('status').value;
  return products.filter(p =>
    (!q || (p.name + ' ' + p.code).toLocaleLowerCase().includes(q)) &&
    (!cat || p.category === cat) &&
    (!st || (st === 'low' ? p.stock <= 5 : st === 'out' ? p.stock === 0 : p.stock > 5)));
}

function stockState(p) {
  return p.stock === 0 ? ['out', t('status.out')] : p.stock <= 5 ? ['low', t('status.low')] : ['', t('status.ok')];
}

function renderProducts() {
  const list = getFiltered();
  $('productRows').innerHTML = list.map(p => {
    const [cls, label] = stockState(p);
    return `<tr>
      <td><div class="product-name"><span class="initial">${esc(p.name.slice(0, 2).toUpperCase())}</span><div><b>${esc(p.name)}</b><small>${esc(p.code)}</small></div></div></td>
      <td class="category">${esc(catName(p.category))}</td>
      <td class="price">${money(p.price)} <small>TMT</small></td>
      <td class="stock-number">${p.stock} <span style="color:#a0acc0;font-weight:400">${t('unit.pcs')}</span></td>
      <td><span class="pill ${cls}">${label}</span></td>
      <td><button class="edit" data-edit="${p.id}" aria-label="${esc(t('aria.edit', { name: p.name }))}">✎</button></td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" class="empty">${t('inv.empty')}</td></tr>`;
  $('results').textContent = t('inv.results', { total: products.length, shown: list.length });
}

function dayRevenue(key) {
  return (history[key] || 0) + sales.filter(s => s.date === key).reduce((a, s) => a + s.total, 0);
}

function render() {
  const todaySales = sales.filter(s => s.date === TODAY);
  const revenue = todaySales.reduce((a, s) => a + s.total, 0);
  const low = products.filter(p => p.stock <= 5);

  $('revenue').innerHTML = money(revenue) + ' <em>TMT</em>';
  $('revenueNote').textContent = longDate(new Date());
  $('saleCount').innerHTML = `${todaySales.length} <em>${plural(todaySales.length, 'unit.sale')}</em>`;
  $('stock').innerHTML = `${products.reduce((a, p) => a + p.stock, 0)} <em>${t('unit.pcs')}</em>`;
  $('varieties').textContent = `${products.length} ${plural(products.length, 'unit.variety')}`;
  $('lowCount').innerHTML = `${low.length} <em>${plural(low.length, 'unit.item')}</em>`;
  $('navCount').textContent = products.length;

  $('lowList').innerHTML = low.slice(0, 3).map(p =>
    `<div class="low-item"><span class="initial">${esc(p.name.slice(0, 2).toUpperCase())}</span><div>${esc(p.name)}<small>${esc(p.code)}</small></div><strong>${p.stock} ${t('unit.pcs')}</strong></div>`
  ).join('') || `<p class="empty">${t('low.none')}</p>`;

  renderChart();
  renderProducts();

  $('saleRows').innerHTML = [...sales].reverse().map(s =>
    `<tr>
      <td class="price">#ST-${s.id}</td>
      <td>${s.date === TODAY ? t('today') : shortDate(fromKey(s.date))}, ${s.time}</td>
      <td>${s.items.map(i => esc(i.name)).join(', ')}</td>
      <td>${s.items.reduce((a, i) => a + i.qty, 0)} ${t('unit.pcs')}</td>
      <td class="price">${money(s.total)} TMT</td>
      <td><span class="pill">${t('sale.done')}</span></td>
    </tr>`).join('') || `<tr><td colspan="6" class="empty">${t('sales.empty')}</td></tr>`;
}

function renderChart() {
  const days = [6, 5, 4, 3, 2, 1, 0].map(daysAgo);
  const values = days.map(d => dayRevenue(dayKey(d)));
  const max = Math.max(400, Math.ceil(Math.max(...values) / 100) * 100);
  const points = values.map((v, i) => [48 + i * 77, 145 - v / max * 115]);
  const line = points.map(p => p.join(',')).join(' ');

  const grid = [0, 1, 2, 3, 4].map(i =>
    `<line x1="42" x2="520" y1="${145 - i * 29}" y2="${145 - i * 29}" stroke="#edf1f8" stroke-dasharray="4 5"/>` +
    `<text x="0" y="${149 - i * 29}" fill="#a6b2c5" font-family="Arial" font-size="10">${Math.round(i * max / 4)}</text>`).join('');
  const dots = points.map((p, i) =>
    `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 6 ? 4 : 2.5}" fill="#4b72ed" stroke="white" stroke-width="2"><title>${longDate(days[i])}: ${money(values[i])} TMT</title></circle>` +
    `<text x="${p[0]}" y="172" text-anchor="middle" fill="#a0adc2" font-family="Arial" font-size="10">${shortDate(days[i])}</text>`).join('');

  $('chart').innerHTML = `<svg viewBox="0 0 540 180" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5078f5" stop-opacity=".14"/><stop offset="1" stop-color="#5078f5" stop-opacity="0"/></linearGradient></defs>
    ${grid}
    <polygon points="48,145 ${line} 510,145" fill="url(#fill)"/>
    <polyline points="${line}" fill="none" stroke="#4b72ed" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}
  </svg>`;
  $('weekTotal').textContent = money(values.reduce((a, b) => a + b, 0)) + ' TMT';
  $('weekRange').textContent = `${dayMonth(days[0])} – ${dayMonth(days[6])}`;
  $('chart').setAttribute('aria-label', values.map((v, i) => `${longDate(days[i])}: ${money(v)} TMT`).join('; '));
}

let currentView = 'overview';

function setView(v) {
  currentView = v;
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  $('overview').hidden = v !== 'overview';
  $('inventory').hidden = v === 'sales';
  $('sales').hidden = v !== 'sales';
  $('crumb').textContent = t(`nav.${v}`);
  $('title').textContent = t(`view.${v}.title`);
  $('intro').textContent = t(`view.${v}.intro`);
}

let toastTimer;
function toast(t) {
  $('toast').textContent = t;
  $('toast').style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').style.display = 'none', 3200);
}

// --- Harytlar ---
function openProduct(id = null) {
  editing = id;
  $('productForm').reset();
  $('productError').textContent = '';
  $('productHeading').textContent = t(id ? 'pd.edit' : 'pd.new');
  $('deleteProduct').hidden = !id;
  const p = products.find(p => p.id === id);
  if (p) for (const key of ['name', 'code', 'category', 'price', 'stock']) $('productForm').elements[key].value = p[key];
  $('productDialog').showModal();
}

$('productForm').onsubmit = e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const p = { ...data, id: editing ?? Date.now(), name: data.name.trim(), code: data.code.trim(), price: Math.round(Number(data.price) * 100) / 100, stock: Number(data.stock) };
  if (!p.name || !p.code || !Number.isFinite(p.price) || p.price <= 0 || !Number.isInteger(p.stock) || p.stock < 0) {
    $('productError').textContent = t('err.invalid');
    return;
  }
  if (products.some(x => x.id !== p.id && x.code.toLowerCase() === p.code.toLowerCase())) {
    $('productError').textContent = t('err.code');
    return;
  }
  if (editing) products = products.map(x => x.id === editing ? p : x);
  else products.push(p);
  save();
  $('productDialog').close();
  render();
  toast(t('toast.saved'));
};

$('deleteProduct').onclick = () => {
  const p = products.find(p => p.id === editing);
  if (!p || !confirm(t('confirm.delete', { name: p.name }))) return;
  products = products.filter(x => x.id !== editing);
  save();
  $('productDialog').close();
  render();
  toast(t('toast.deleted'));
};

// --- Satuw ---
function renderCart() {
  $('cart').innerHTML = cart.map(i => {
    const p = products.find(p => p.id === i.id);
    return `<div class="cart-line"><div>${esc(p.name)}<small>${i.qty} × ${money(p.price)} TMT</small></div><strong>${money(p.price * i.qty)}</strong><button data-remove="${i.id}" aria-label="${esc(t('aria.remove', { name: p.name }))}">×</button></div>`;
  }).join('') || `<p class="empty">${t('cart.empty')}</p>`;
  $('cartTotal').textContent = money(cart.reduce((a, i) => a + products.find(p => p.id === i.id).price * i.qty, 0)) + ' TMT';
  $('complete').disabled = !cart.length;
}

function openSale() {
  cart = [];
  $('saleError').textContent = '';
  $('saleProduct').innerHTML = products.filter(p => p.stock > 0).map(p =>
    `<option value="${p.id}">${esc(p.name)} · ${money(p.price)} TMT · ${p.stock} ${t('unit.pcs')}</option>`).join('');
  $('quantity').value = 1;
  renderCart();
  $('saleDialog').showModal();
}

$('cartForm').onsubmit = e => {
  e.preventDefault();
  const id = Number($('saleProduct').value), qty = Number($('quantity').value);
  const p = products.find(p => p.id === id), line = cart.find(i => i.id === id);
  if (!p || !Number.isInteger(qty) || qty < 1) { $('saleError').textContent = t('err.pick'); return; }
  if (qty + (line?.qty || 0) > p.stock) { $('saleError').textContent = t('err.onlyN', { n: p.stock }); return; }
  if (line) line.qty += qty; else cart.push({ id, qty });
  $('saleError').textContent = '';
  renderCart();
};

$('cart').onclick = e => {
  const b = e.target.closest('[data-remove]');
  if (b) { cart = cart.filter(i => i.id !== Number(b.dataset.remove)); renderCart(); }
};

$('complete').onclick = () => {
  if (!cart.length) return;
  if (cart.some(i => i.qty > products.find(p => p.id === i.id).stock)) { $('saleError').textContent = t('err.notEnough'); return; }
  const items = cart.map(i => { const p = products.find(p => p.id === i.id); return { name: p.name, qty: i.qty, price: p.price }; });
  const total = Math.round(items.reduce((a, i) => a + i.qty * i.price, 0) * 100) / 100;
  cart.forEach(i => products.find(p => p.id === i.id).stock -= i.qty);
  const now = new Date();
  sales.push({ id: Math.max(1040, ...sales.map(s => s.id)) + 1, date: dayKey(now), time: `${pad(now.getHours())}:${pad(now.getMinutes())}`, items, total });
  cart = [];
  save();
  $('saleDialog').close();
  render();
  toast(t('toast.sale'));
};

// --- Wakalar ---
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => $(b.dataset.close).close());
$('addProduct').onclick = () => openProduct();
$('productRows').onclick = e => { const b = e.target.closest('[data-edit]'); if (b) openProduct(Number(b.dataset.edit)); };
$('newSale').onclick = openSale;
$('search').oninput = renderProducts;
$('category').onchange = renderProducts;
$('status').onchange = renderProducts;
$('showLow').onclick = () => {
  setView('products');
  $('status').value = 'low';
  $('search').value = '';
  $('category').value = '';
  renderProducts();
};

// --- Dil ---
function fillCategorySelects() {
  for (const [id, first] of [['category', t('filter.allCat')], ['productCategory', null]]) {
    const sel = $(id), value = sel.value;
    sel.innerHTML = (first !== null ? `<option value="">${esc(first)}</option>` : '') +
      Object.keys(CATEGORIES).map(c => `<option value="${esc(c)}">${esc(catName(c))}</option>`).join('');
    sel.value = value || (first !== null ? '' : Object.keys(CATEGORIES)[0]);
  }
}

function applyLanguage() {
  applyStatic();
  fillCategorySelects();
  setView(currentView);
  $('today').textContent = longDate(new Date());
  render();
}

document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
  lang = b.dataset.lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  applyLanguage();
});

$('year').textContent = new Date().getFullYear();
applyLanguage();
