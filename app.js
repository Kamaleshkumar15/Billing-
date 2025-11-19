const STORAGE_KEYS = {
  MENU: "hostelMenu",
  CART: "hostelCart",
  SALES: "hostelSales",
};

const DEFAULT_MENU = [
  {
    id: "idli",
    name: "Idli Recipe & Idli Batter",
    price: 35,
    image:
      "./image/idli.png",
  },
  {
    id: "masala-dosa",
    name: "Masala Dosa Recipe",
    price: 60,
    image:
      "./image/masala.png",
  },
  {
    id: "upma",
    name: "Upma Recipe",
    price: 40,
    image:
      "./image/upma.png",
  },
  {
    id: "sambar",
    name: "Sambar Recipe",
    price: 45,
    image:
      "./image/sambar.png",
  },
  {
    id: "rava-idli",
    name: "Rava Idli",
    price: 45,
    image:
      "./image/rava.png",
  },
  {
    id: "tomato-rasam",
    name: "Tomato Rasam",
    price: 30,
    image:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "onion-dosa",
    name: "Onion Dosa",
    price: 55,
    image:
      "./image/onion.png",
  },
  {
    id: "medu-vada",
    name: "Medu Vada",
    price: 35,
    image:
      "./image/vada.png",
  },
  {
    id: "veg-kurma",
    name: "Veg Kurma Recipe",
    price: 65,
    image:
      "./image/kumu.png",
  },
  {
    id: "kesari",
    name: "Kesari Recipe",
    price: 30,
    image:
      "./image/kesari.png",
  },
];

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error(`Failed to parse ${key}`, error);
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  clear(key) {
    localStorage.removeItem(key);
  },
};

let menuItems = [];
let cart = {};
let sales = [];
const NEW_ITEM_IMAGE =
  DEFAULT_MENU[0]?.image ||
  "https://images.pexels.com/photos/4611980/pexels-photo-4611980.jpeg?auto=compress&cs=tinysrgb&w=800";

const ui = {
  menuGrid: document.getElementById("menu-grid"),
  cartRows: document.getElementById("cart-rows"),
  emptyCart: document.getElementById("empty-cart-msg"),
  subtotal: document.getElementById("subtotal-display"),
  payBtn: document.getElementById("pay-now"),
  clearCartBtn: document.getElementById("clear-cart"),
  printBtn: document.getElementById("print-bill"),
  salesRows: document.getElementById("sales-rows"),
  monthlyTotal: document.getElementById("monthly-total"),
  yearFilter: document.getElementById("filter-year"),
  monthFilter: document.getElementById("filter-month"),
  resetFilters: document.getElementById("reset-filters"),
  menuForm: document.getElementById("menu-form"),
  menuId: document.getElementById("menu-id"),
  menuName: document.getElementById("menu-name"),
  menuPrice: document.getElementById("menu-price"),
  manageRows: document.getElementById("manage-menu-rows"),
  seedMenu: document.getElementById("seed-menu"),
  yearLabel: document.getElementById("year"),
  modalTotal: document.getElementById("modal-total"),
  customerId: document.getElementById("customer-id"),
  customerName: document.getElementById("customer-name"),
};

const payModal = new bootstrap.Modal(document.getElementById("payModal"));

document.addEventListener("DOMContentLoaded", () => {
  initializeData();
  attachEvents();
  renderMenu();
  renderCart();
  renderSales();
  populateFilters();
  ui.yearLabel.textContent = new Date().getFullYear();
});

function initializeData() {
  menuItems = storage.get(STORAGE_KEYS.MENU, DEFAULT_MENU);
  cart = storage.get(STORAGE_KEYS.CART, {});
  sales = storage.get(STORAGE_KEYS.SALES, []);
}

function attachEvents() {
  ui.clearCartBtn.addEventListener("click", () => {
    cart = {};
    storage.set(STORAGE_KEYS.CART, cart);
    renderCart();
  });

  ui.payBtn.addEventListener("click", () => {
    const totals = calculateTotals();
    if (totals.total === 0) {
      window.alert("Cart is empty. Add items before paying.");
      return;
    }
    ui.modalTotal.textContent = formatCurrency(totals.total);
    payModal.show();
  });

  document
    .getElementById("complete-payment")
    .addEventListener("click", finalizePayment);

  ui.printBtn.addEventListener("click", printBill);

  ui.resetFilters.addEventListener("click", () => {
    ui.monthFilter.value = "";
    ui.yearFilter.value = "";
    renderSales();
  });

  ui.yearFilter.addEventListener("change", renderSales);
  ui.monthFilter.addEventListener("change", renderSales);

  ui.menuForm.addEventListener("submit", handleMenuSave);
  document.getElementById("reset-form").addEventListener("click", resetMenuForm);
  ui.seedMenu.addEventListener("click", () => {
    if (confirm("Restore default menu? This will overwrite current items.")) {
      menuItems = [...DEFAULT_MENU];
      storage.set(STORAGE_KEYS.MENU, menuItems);
      renderMenu();
      renderManageTable();
    }
  });
}

function renderMenu() {
  ui.menuGrid.innerHTML = "";
  menuItems.forEach((item) => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-xl-4";
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${item.image ?? ""}" alt="${item.name}" class="card-img-top menu-img" />
        <div class="card-body d-flex flex-column">
          <div>
            <h5 class="card-title">${item.name}</h5>
            <p class="text-muted mb-3">₹${item.price.toFixed(2)}</p>
          </div>
          <button class="btn btn-primary mt-auto add-to-cart" data-id="${item.id}">
            <i class="bi bi-plus-circle"></i> Add to cart
          </button>
        </div>
      </div>`;
    ui.menuGrid.appendChild(col);
  });

  ui.menuGrid.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });

  renderManageTable();
}

function addToCart(itemId) {
  const item = menuItems.find((entry) => entry.id === itemId);
  if (!item) return;
  cart[itemId] = cart[itemId] ? cart[itemId] + 1 : 1;
  storage.set(STORAGE_KEYS.CART, cart);
  renderCart();
}

function renderCart() {
  ui.cartRows.innerHTML = "";
  const entries = Object.entries(cart);
  ui.emptyCart.style.display = entries.length ? "none" : "block";

  entries.forEach(([id, qty]) => {
    const item = menuItems.find((entry) => entry.id === id);
    if (!item) return;
    const total = item.price * qty;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td class="text-center">
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-secondary qty-down" data-id="${id}">
            <i class="bi bi-dash"></i>
          </button>
          <span class="px-2">${qty}</span>
          <button class="btn btn-outline-secondary qty-up" data-id="${id}">
            <i class="bi bi-plus"></i>
          </button>
        </div>
      </td>
      <td class="text-end">${formatCurrency(total)}</td>
      <td class="text-end">
        <button class="btn btn-outline-danger btn-sm remove-item" data-id="${id}">
          <i class="bi bi-x-lg"></i>
        </button>
      </td>`;
    ui.cartRows.appendChild(row);
  });

  ui.cartRows.querySelectorAll(".qty-down").forEach((btn) =>
    btn.addEventListener("click", () => changeQty(btn.dataset.id, -1))
  );
  ui.cartRows.querySelectorAll(".qty-up").forEach((btn) =>
    btn.addEventListener("click", () => changeQty(btn.dataset.id, 1))
  );
  ui.cartRows.querySelectorAll(".remove-item").forEach((btn) =>
    btn.addEventListener("click", () => removeItem(btn.dataset.id))
  );

  const totals = calculateTotals();
  ui.subtotal.textContent = formatCurrency(totals.subtotal);
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) {
    delete cart[id];
  }
  storage.set(STORAGE_KEYS.CART, cart);
  renderCart();
}

function removeItem(id) {
  delete cart[id];
  storage.set(STORAGE_KEYS.CART, cart);
  renderCart();
}

function calculateTotals() {
  let subtotal = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const item = menuItems.find((entry) => entry.id === id);
    if (!item) return;
    subtotal += item.price * qty;
  });
  return { subtotal, tax: 0, total: subtotal };
}

function formatCurrency(value) {
  return `₹${value.toFixed(2)}`;
}

function finalizePayment() {
  const totals = calculateTotals();
  if (totals.total === 0) {
    window.alert("Cart is empty.");
    return;
  }
  const timestamp = new Date().toISOString();
  const saleRecord = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    timestamp,
    items: Object.entries(cart).map(([id, qty]) => {
      const item = menuItems.find((entry) => entry.id === id);
      return {
        name: item?.name ?? id,
        qty,
        price: item?.price ?? 0,
      };
    }),
    totals,
  };
  sales.push(saleRecord);
  storage.set(STORAGE_KEYS.SALES, sales);
  cart = {};
  storage.set(STORAGE_KEYS.CART, cart);
  renderCart();
  renderSales();
  payModal.hide();
  window.alert("Payment recorded. Cart cleared.");
}

function printBill() {
  const totals = calculateTotals();
  if (totals.total === 0) {
    window.alert("Cart is empty. Nothing to print.");
    return;
  }
  const billWindow = window.open("", "PRINT", "height=600,width=400");
  billWindow.document.write(`
    <html>
      <head>
        <title>Bill - Shree  Hostel </title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { font-size: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border-bottom: 1px solid #ccc; text-align: left; padding: 6px; }
          tfoot td { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Shreee Hostel </h1>
        <p>${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th class="text-end">Amount</th></tr>
          </thead>
          <tbody>
            ${Object.entries(cart)
              .map(([id, qty]) => {
                const item = menuItems.find((entry) => entry.id === id);
                const amount = (item?.price ?? 0) * qty;
                return `<tr><td>${item?.name ?? id}</td><td>${qty}</td><td style="text-align:right">₹${amount.toFixed(
                  2
                )}</td></tr>`;
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr><td colspan="2">Subtotal</td><td style="text-align:right">${formatCurrency(
              totals.subtotal
            )}</td></tr>
            <tr><td colspan="2">Grand Total</td><td style="text-align:right">${formatCurrency(
              totals.total
            )}</td></tr>
          </tfoot>
        </table>
        <p style="margin-top:16px;">Thank you!!!!!!</p>
      </body>
    </html>`);
  billWindow.document.close();
  billWindow.focus();
  billWindow.print();
}

function renderSales() {
  ui.salesRows.innerHTML = "";
  const filtered = getFilteredSales();
  let monthlyTotal = 0;
  filtered.forEach((record) => {
    monthlyTotal += record.totals.total;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(record.timestamp).toLocaleDateString()}</td>
      <td>${record.items
        .map((item) => `${item.qty}× ${item.name}`)
        .join(", ")}</td>
      <td class="text-end">${formatCurrency(record.totals.total)}</td>`;
    ui.salesRows.appendChild(tr);
  });
  if (!filtered.length) {
    ui.salesRows.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No sales yet.</td></tr>`;
  }
  ui.monthlyTotal.textContent = formatCurrency(monthlyTotal);
}

function populateFilters() {
  const years = new Set();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  sales.forEach((record) => {
    const date = new Date(record.timestamp);
    years.add(date.getFullYear());
  });

  ui.yearFilter.innerHTML =
    '<option value="">All years</option>' +
    Array.from(years)
      .sort()
      .map((yr) => `<option value="${yr}">${yr}</option>`)
      .join("");

  ui.monthFilter.innerHTML =
    '<option value="">All months</option>' +
    months
      .map((name, index) => `<option value="${index}">${name}</option>`)
      .join("");
}

function getFilteredSales() {
  return sales.filter((record) => {
    const date = new Date(record.timestamp);
    const matchesYear =
      !ui.yearFilter.value || date.getFullYear().toString() === ui.yearFilter.value;
    const matchesMonth =
      ui.monthFilter.value === "" ||
      date.getMonth().toString() === ui.monthFilter.value;
    return matchesYear && matchesMonth;
  });
}

function handleMenuSave(event) {
  event.preventDefault();
  const id = ui.menuId.value.trim();
  const name = ui.menuName.value.trim();
  const price = Number(ui.menuPrice.value);
  if (!name || price <= 0) {
    window.alert("Please provide a valid name and price.");
    return;
  }
  if (id) {
    const idx = menuItems.findIndex((item) => item.id === id);
    if (idx >= 0) {
      const currentImage = menuItems[idx]?.image || NEW_ITEM_IMAGE;
      menuItems[idx] = { ...menuItems[idx], name, price, image: currentImage };
    }
  } else {
    const newId = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    menuItems.push({ id: newId, name, price, image: NEW_ITEM_IMAGE });
  }
  storage.set(STORAGE_KEYS.MENU, menuItems);
  renderMenu();
  resetMenuForm();
}

function resetMenuForm() {
  ui.menuForm.reset();
  ui.menuId.value = "";
}

function renderManageTable() {
  ui.manageRows.innerHTML = "";
  menuItems.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>₹${item.price.toFixed(2)}</td>
      <td>
        <img src="${item.image}" alt="${item.name}" class="rounded" width="60" height="40" />
      </td>
      <td class="text-end">
        <button class="btn btn-outline-secondary btn-sm edit-item" data-id="${item.id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm delete-item ms-2" data-id="${item.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;
    ui.manageRows.appendChild(tr);
  });

  ui.manageRows.querySelectorAll(".edit-item").forEach((btn) =>
    btn.addEventListener("click", () => populateForm(btn.dataset.id))
  );
  ui.manageRows.querySelectorAll(".delete-item").forEach((btn) =>
    btn.addEventListener("click", () => deleteMenuItem(btn.dataset.id))
  );
}

function populateForm(id) {
  const item = menuItems.find((entry) => entry.id === id);
  if (!item) return;
  ui.menuId.value = item.id;
  ui.menuName.value = item.name;
  ui.menuPrice.value = item.price;
  ui.menuName.focus();
}

function deleteMenuItem(id) {
  if (!confirm("Delete this menu item?")) return;
  menuItems = menuItems.filter((item) => item.id !== id);
  storage.set(STORAGE_KEYS.MENU, menuItems);
  renderMenu();
}

