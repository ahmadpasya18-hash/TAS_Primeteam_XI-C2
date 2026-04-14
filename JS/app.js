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
  user: JSON.parse(localStorage.getItem('user') || 'null')
};

function setActiveNav(route) {
  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });
}

function normalizeProduct(item) {
  return {
    id: item.produk_id,
    name: item.produk_name,
    price: item.produk_price,
    stock: item.produk_stock,
    category: item.produk_category,
    image: item.produk_image,
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
    view.innerHTML = '<div class="card">Tidak dapat memuat data. Pastikan file JSON berada di folder DATA dan jalankan dengan Live Server.</div>';
  }
}

function el(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  return wrapper.firstElementChild;
}

function renderHeader(title) {
  header.innerHTML = `<h1>${title}</h1>`;
}

function renderHome() {
  renderHeader('Home');
  setActiveNav('home');
  view.innerHTML = `
    <div class="banner card">
      <div>
        <strong>Temukan produk lokal</strong>
        <p class="small">Mitra sekolah siap melayani Anda.</p>
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
          <img class="product-thumb" src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/320x240?text=No+Image'" />
          <div class="product-meta">
            <h3>${product.name}</h3>
            <p>${product.price} • ${product.category}</p>
          </div>
        </div>
      `);
      item.addEventListener('click', () => navigate(`product/${product.id}`));
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
  renderHeader('Produk');
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
          <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/320x240?text=No+Image'" />
          <div>
            <h3>${product.name}</h3>
            <p class="small">${product.price}</p>
          </div>
        </div>
      `);
      card.addEventListener('click', () => navigate(`product/${product.id}`));
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

function renderPartners() {
  renderHeader('Mitra');
  setActiveNav('mitra');
  view.innerHTML = `
    <div class="card">
      <h2>Daftar mitra</h2>
      <div class="partner-list" id="partnerList"></div>
    </div>
  `;

  const list = document.getElementById('partnerList');
  state.partners.forEach((partner) => {
    const item = el(`
      <div class="partner" data-id="${partner.id}">
        <div class="partner-thumb"></div>
        <div class="partner-meta">
          <h3>${partner.name}</h3>
          <p>${partner.category}</p>
        </div>
      </div>
    `);
    item.addEventListener('click', () => navigate(`mitra/${partner.id}`));
    list.appendChild(item);
  });
}

function renderProductDetail(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) {
    view.innerHTML = '<div class="card">Produk tidak ditemukan.</div>';
    return;
  }
  renderHeader(product.name);
  setActiveNav('');
  const partner = state.partners.find((item) => item.id === product.partnerId);
  view.innerHTML = `
    <div class="card">
      <img class="card-image" src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/320x240?text=No+Image'" />
      <h2>${product.name}</h2>
      <p class="small">${product.price} • ${product.category}</p>
      <p class="small">Stok: ${product.stock}</p>
      <p class="small">Sekolah: ${product.school}</p>
      <div class="actions">
        ${partner ? `<button class="btn btn-secondary" id="partnerButton">Lihat Mitra</button>` : ''}
        <button class="btn btn-primary" id="orderButton">Pesan</button>
      </div>
    </div>
  `;

  if (partner) {
    document.getElementById('partnerButton').addEventListener('click', () => navigate(`mitra/${partner.id}`));
  }
}

function renderPartnerDetail(id) {
  const partner = state.partners.find((item) => item.id === id);
  if (!partner) {
    view.innerHTML = '<div class="card">Mitra tidak ditemukan.</div>';
    return;
  }
  renderHeader(partner.name);
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
        <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/320x240?text=No+Image'" />
        <div>
          <h3>${product.name}</h3>
          <p class="small">${product.price}</p>
        </div>
      </div>
    `);
    item.addEventListener('click', () => navigate(`product/${product.id}`));
    grid.appendChild(item);
  });
}

function renderLogin() {
  renderHeader('Login');
  setActiveNav('akun');
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
  renderHeader('Register');
  setActiveNav('akun');
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
  renderHeader('Profil');
  setActiveNav('akun');
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
  return hash || 'home';
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
  } else if (route === 'home') {
    renderHome();
  } else if (route === 'produk') {
    renderProducts();
  } else if (route === 'mitra') {
    renderPartners();
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
    if (route === 'akun' && !state.user) {
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
    navigate('home');
  } else {
    router();
  }
})();
