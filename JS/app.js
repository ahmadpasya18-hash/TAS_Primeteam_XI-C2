const view = document.getElementById('view');
const header = document.getElementById('header');
const navButtons = document.querySelectorAll('.nav-btn');
const DATA_PATHS = {
  products: './DATA/Tabel Produk_rows.json',
  partners: './DATA/Tabel Mitra_rows.json'
};

const state = {
  products: [],
  partners: [],
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  history: JSON.parse(localStorage.getItem('history') || '[]')
};

function setActiveNav(route) {
  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });
}

function normalizeImageUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  const googleDriveMatch = trimmed.match(/drive\.google\.com\/d\/([a-zA-Z0-9_-]+)/);
  const googleDriveUcmatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  const lh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  const id = googleDriveMatch?.[1] || googleDriveUcmatch?.[1] || lh3Match?.[1];
  if (id) {
    return `https://lh3.googleusercontent.com/d/${id}`;
  }
  return trimmed;
}

function normalizeProduct(item) {
  return {
    id: item.produk_id,
    name: item.produk_name,
    price: item.produk_price,
    stock: item.produk_stock,
    category: item.produk_category,
    image: normalizeImageUrl(item.produk_image),
    partnerId: item.mitra_id,
    school: item.sekolah
  };
}

function normalizePartner(item) {
  return {
    id: item.mitra_id,
    name: item.mitra_name,
    owner: item.owner_name,
    email: item.email_owner,
    address: item.address_owner,
    category: item.kategori,
    school: item.sekolah
  };
}

async function loadData() {
  try {
    const [productsRaw, partnersRaw] = await Promise.all([
      fetch(encodeURI(DATA_PATHS.products)).then((res) => res.json()),
      fetch(encodeURI(DATA_PATHS.partners)).then((res) => res.json())
    ]);
    state.products = productsRaw.map(normalizeProduct);
    state.partners = partnersRaw.map(normalizePartner);
  } catch (error) {
    console.error('Gagal memuat data:', error);
    // Fallback data dummy
    state.products = [
      { id: 'dummy1', name: 'Produk Dummy 1', price: 'Rp10.000', image: 'https://via.placeholder.com/300x200?text=Dummy1', category: 'Food', partnerId: 'dummy_partner' }
    ];
    state.partners = [
      { id: 'dummy_partner', name: 'Mitra Dummy', category: 'Food & Beverage', address: 'Alamat Dummy' }
    ];
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
}

function saveHistory() {
  localStorage.setItem('history', JSON.stringify(state.history));
}

function animateClick(element) {
  element.classList.add('click-animate');
  element.addEventListener('animationend', () => {
    element.classList.remove('click-animate');
  }, { once: true });
}

function addToCart(product) {
  const existing = state.cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  alert(`${product.name} ditambahkan ke keranjang.`);
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
}

function checkoutCart() {
  if (state.cart.length === 0) {
    alert('Keranjang kosong.');
    return;
  }
  const now = new Date().toLocaleString('id-ID');
  state.history.push({ purchasedAt: now, items: [...state.cart] });
  state.cart = [];
  saveCart();
  saveHistory();
  navigate('riwayat');
}

function el(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  return wrapper.firstElementChild;
}

function renderHeader(title, route) {
  document.getElementById('header-title').textContent = title;
  const indicator = document.getElementById('header-indicator');
  const colors = {
    beranda: '#ACD3F0',
    keranjang: '#F59E0B',
    riwayat: '#10B981',
    profile: '#8B5CF6'
  };
  indicator.style.background = colors[route] || '#ACD3F0';
}

function renderHome() {
  renderHeader('Produk', 'produk');
  setActiveNav('produk');
  view.innerHTML = `
    <div class="banner card">
      <div>
        <strong class="banner-title">KANTIN BU SURYATI</strong>
        <p class="small">Buka halaman produk dengan cepat dan penuh gaya.</p>
        <div class="banner-decor">
          <span>🍎</span>
          <span>🍔</span>
          <span>🥤</span>
          <span>🍰</span>
        </div>
      </div>
    </div>
    <div class="search-bar">
      <input id="searchInput" placeholder="Cari produk..." />
    </div>
    <div class="card">
      <h2>Produk populer</h2>
      <div class="product-list" id="productList"></div>
    </div>
  `;

  const list = document.getElementById('productList');
  const renderItems = (items) => {
    list.innerHTML = '';
    items.slice(0, 8).forEach((product) => {
      const item = el(`
        <div class="product" data-id="${product.id}">
          <img class="product-thumb" src="${product.image}" alt="${product.name}" />
          <div class="product-meta">
            <h3>${product.name}</h3>
            <p>${product.price} • ${product.category}</p>
          </div>
        </div>
      `);
      item.addEventListener('click', () => {
        animateClick(item);
        setTimeout(() => navigate(`product/${product.id}`), 120);
      });
      list.appendChild(item);
    });
  };

  renderItems(state.products);
  document.getElementById('searchInput').addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    const filtered = state.products.filter((product) => product.name.toLowerCase().includes(query));
    renderItems(filtered);
  });
}

function renderProducts() {
  renderHeader('Produk', 'produk');
  setActiveNav('produk');
  const categories = Array.from(new Set(state.products.map((p) => p.category)));
  view.innerHTML = `
    <div class="card">
      <h2>Filter & kategori</h2>
      <div class="actions" id="categoryButtons"></div>
    </div>
    <div class="grid" id="productGrid"></div>
  `;

  const renderGrid = (items) => {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    items.forEach((product) => {
      const card = el(`
        <div class="grid-item" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" />
          <div>
            <h3>${product.name}</h3>
            <p class="small">${product.price}</p>
          </div>
        </div>
      `);
      card.addEventListener('click', () => {
        animateClick(card);
        setTimeout(() => navigate(`product/${product.id}`), 120);
      });
      grid.appendChild(card);
    });
  };

  const categoryButtons = document.getElementById('categoryButtons');
  categoryButtons.innerHTML = `<button class="btn btn-primary" data-category="all">Semua</button>` +
    categories.map((category) => `<button class="btn btn-secondary" data-category="${category}">${category}</button>`).join('');

  categoryButtons.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      const filtered = category === 'all' ? state.products : state.products.filter((p) => p.category === category);
      renderGrid(filtered);
    });
  });

  renderGrid(state.products);
}

function renderCart() {
  renderHeader('Keranjang', 'keranjang');
  setActiveNav('keranjang');
  view.innerHTML = `
    <div class="card">
      <h2>Keranjang Anda</h2>
      <div id="cartList"></div>
      <div class="actions" id="cartActions"></div>
    </div>
  `;

  const cartList = document.getElementById('cartList');
  if (state.cart.length === 0) {
    cartList.innerHTML = '<p class="small">Keranjang kosong.</p>';
  } else {
    state.cart.forEach((item) => {
      const row = el(`
        <div class="product">
          <img class="product-thumb" src="${item.image}" alt="${item.name}" />
          <div class="product-meta">
            <h3>${item.name}</h3>
            <p>${item.price} x ${item.quantity}</p>
            <button class="btn btn-secondary" data-id="${item.id}">Hapus</button>
          </div>
        </div>
      `);
      row.querySelector('button').addEventListener('click', () => removeFromCart(item.id));
      cartList.appendChild(row);
    });
  }

  const cartActions = document.getElementById('cartActions');
  cartActions.innerHTML = '<button class="btn btn-primary" id="checkoutButton">Checkout</button>';
  document.getElementById('checkoutButton').addEventListener('click', checkoutCart);
}

function renderHistory() {
  renderHeader('Riwayat', 'riwayat');
  setActiveNav('riwayat');
  view.innerHTML = `
    <div class="card">
      <h2>Riwayat Pembelian</h2>
      <div id="historyList"></div>
    </div>
  `;

  const historyList = document.getElementById('historyList');
  if (state.history.length === 0) {
    historyList.innerHTML = '<p class="small">Belum ada riwayat pembelian.</p>';
    return;
  }

  state.history.slice().reverse().forEach((entry) => {
    const item = el(`
      <div class="card">
        <h3>${entry.purchasedAt}</h3>
        <div class="product-list"></div>
      </div>
    `);
    const productList = item.querySelector('.product-list');
    entry.items.forEach((cartItem) => {
      const row = el(`
        <div class="product">
          <img class="product-thumb" src="${cartItem.image}" alt="${cartItem.name}" />
          <div class="product-meta">
            <h3>${cartItem.name}</h3>
            <p>${cartItem.price} x ${cartItem.quantity}</p>
          </div>
        </div>
      `);
      productList.appendChild(row);
    });
    historyList.appendChild(item);
  });
}

function renderProductDetail(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) {
    view.innerHTML = '<div class="card">Produk tidak ditemukan.</div>';
    return;
  }
  renderHeader(product.name, 'produk');
  setActiveNav('');
  const partner = state.partners.find((item) => item.id === product.partnerId);
  view.innerHTML = `
    <div class="card">
      <img class="card-image" src="${product.image}" alt="${product.name}" />
      <h2>${product.name}</h2>
      <p class="small">${product.price} • ${product.category}</p>
      <p class="small">Stok: ${product.stock}</p>
      <p class="small">Sekolah: ${product.school}</p>
      <div class="actions">
        ${partner ? `<button class="btn btn-secondary" id="partnerButton">Lihat Mitra</button>` : ''}
        <button class="btn btn-primary" id="orderButton">Tambah Keranjang</button>
      </div>
    </div>
  `;

  if (partner) {
    document.getElementById('partnerButton').addEventListener('click', () => navigate(`mitra/${partner.id}`));
  }
  document.getElementById('orderButton').addEventListener('click', () => {
    addToCart(product);
  });
}

function renderPartnerDetail(id) {
  const partner = state.partners.find((item) => item.id === id);
  if (!partner) {
    view.innerHTML = '<div class="card">Mitra tidak ditemukan.</div>';
    return;
  }
  renderHeader(partner.name, 'produk');
  setActiveNav('');
  const partnerProducts = state.products.filter((product) => product.partnerId === id);
  view.innerHTML = `
    <div class="card">
      <h2>${partner.name}</h2>
      <p class="small">Pemilik: ${partner.owner}</p>
      <p class="small">Email: ${partner.email}</p>
      <p class="small">Alamat: ${partner.address}</p>
      <p class="small">Kategori: ${partner.category}</p>
      <p class="small">Sekolah: ${partner.school}</p>
    </div>
    <div class="card">
      <h2>Produk Mitra</h2>
      <div class="grid" id="partnerProducts"></div>
    </div>
  `;

  const grid = document.getElementById('partnerProducts');
  if (partnerProducts.length === 0) {
    grid.innerHTML = '<p class="small">Belum ada produk.</p>';
    return;
  }

  partnerProducts.forEach((product) => {
    const item = el(`
      <div class="grid-item" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" />
        <div>
          <h3>${product.name}</h3>
          <p class="small">${product.price}</p>
        </div>
      </div>
    `);
    item.addEventListener('click', () => {
      animateClick(item);
      setTimeout(() => navigate(`product/${product.id}`), 120);
    });
    grid.appendChild(item);
  });
}

function renderLogin() {
  renderHeader('Login', 'profile');
  setActiveNav('profile');
  view.innerHTML = `
    <div class="card">
      <h2>Masuk</h2>
      <div class="form-group">
        <input id="email" class="input" placeholder="Email" />
        <input id="password" type="password" class="input" placeholder="Password" />
      </div>
      <div class="actions">
        <button class="btn btn-primary" id="loginButton">Login</button>
        <button class="btn btn-secondary" id="registerButton">Daftar</button>
      </div>
    </div>
  `;

  document.getElementById('loginButton').addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) {
      alert('Isi email dan password.');
      return;
    }
    const user = { name: 'Pengguna', email };
    state.user = user;
    localStorage.setItem('user', JSON.stringify(user));
    navigate('profile');
  });
  document.getElementById('registerButton').addEventListener('click', () => navigate('register'));
}

function renderRegister() {
  renderHeader('Register', 'profile');
  setActiveNav('profile');
  view.innerHTML = `
    <div class="card">
      <h2>Daftar</h2>
      <div class="form-group">
        <input id="name" class="input" placeholder="Nama" />
        <input id="email" class="input" placeholder="Email" />
        <input id="password" type="password" class="input" placeholder="Password" />
      </div>
      <button class="btn btn-primary" id="registerSubmit">Daftar</button>
    </div>
  `;

  document.getElementById('registerSubmit').addEventListener('click', () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!name || !email || !password) {
      alert('Lengkapi semua data.');
      return;
    }
    const user = { name, email };
    state.user = user;
    localStorage.setItem('user', JSON.stringify(user));
    navigate('profile');
  });
}

function renderProfile() {
  if (!state.user) {
    navigate('login');
    return;
  }
  renderHeader('Profil', 'profile');
  setActiveNav('profile');
  view.innerHTML = `
    <div class="card">
      <h2>Halo, ${state.user.name}</h2>
      <p class="small">${state.user.email}</p>
      <div class="actions">
        <button class="btn" id="logoutButton">Logout</button>
      </div>
    </div>
  `;
  document.getElementById('logoutButton').addEventListener('click', () => {
    state.user = null;
    localStorage.removeItem('user');
    navigate('home');
  });
}

function parseHash() {
  const hash = window.location.hash.replace('#', '');
  return hash || 'produk';
}

function navigate(route) {
  window.location.hash = route;
}

function router() {
  const route = parseHash();
  if (route.startsWith('product/')) {
    renderProductDetail(route.split('/')[1]);
  } else if (route.startsWith('mitra/')) {
    renderPartnerDetail(route.split('/')[1]);
  } else if (route === 'produk' || route === 'home') {
    renderHome();
  } else if (route === 'keranjang') {
    renderCart();
  } else if (route === 'riwayat') {
    renderHistory();
  } else if (route === 'login') {
    renderLogin();
  } else if (route === 'register') {
    renderRegister();
  } else if (route === 'profile') {
    renderProfile();
  } else {
    renderHome();
  }
}

document.querySelectorAll('.nav-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const route = button.dataset.route;
    if (route === 'profile' && !state.user) {
      navigate('login');
      return;
    }
    navigate(route);
  });
});

window.addEventListener('hashchange', router);

(async function init() {
  await loadData();
  if (!window.location.hash) {
    navigate('produk');
  } else {
    router();
  }
})();
