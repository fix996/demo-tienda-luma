const productById = new Map(products.map(product => [product.id, product]));
const bag = new Map();
const filters = document.querySelector("#filters");
const productGrid = document.querySelector("#product-grid");
const productCount = document.querySelector("#product-count");
const bagCount = document.querySelector("#bag-count");
const bagDialog = document.querySelector("#bag-dialog");
const bagContent = document.querySelector("#bag-content");
const closeBag = document.querySelector("#close-bag");
const productDialog = document.querySelector("#product-dialog");
const productContent = document.querySelector("#product-content");
const closeProduct = document.querySelector("#close-product");
const actionStatus = document.querySelector("#action-status");
let activeCategory = "todos";
let bagOpener = null;
let productOpener = null;

function photosFor(product) {
  const base = product.image.replace(/\.jpg$/, "");
  const secondView = product.id === "LUM-06" ? "Vista lateral" : "Vista posterior";
  return [
    { src: product.image, alt: product.alt, label: "Frente" },
    { src: `${base}-back.jpg`, alt: `${secondView.toLowerCase()} de ${product.name.toLowerCase()} de ejemplo`, label: secondView },
    { src: `${base}-detail.jpg`, alt: `Detalle de ${product.name.toLowerCase()} de ejemplo`, label: "Detalle" }
  ];
}

function quantityFor(id) {
  return [...bag.values()].filter(item => item.id === id).reduce((total, item) => total + item.quantity, 0);
}

function addLabel(id) {
  return quantityFor(id) ? "Agregar otro" : "Agregar al bolso";
}

function syncAddButtons(id) {
  document.querySelectorAll(`[data-add="${id}"]`).forEach(button => {
    button.querySelector(".add-label").textContent = addLabel(id);
    button.querySelector(".add-icon").textContent = "+";
  });
}

function flashAdded(button, id) {
  if (!button) return;
  clearTimeout(button.feedbackTimer);
  button.classList.remove("is-added");
  void button.offsetWidth;
  button.classList.add("is-added");
  button.querySelector(".add-label").textContent = "¡Agregado al bolso!";
  button.querySelector(".add-icon").textContent = "✓";
  button.feedbackTimer = setTimeout(() => {
    if (!button.isConnected) return;
    button.classList.remove("is-added");
    button.querySelector(".add-label").textContent = addLabel(id);
    button.querySelector(".add-icon").textContent = "+";
  }, 1500);
}

function money(value) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

function bagTotal() {
  return [...bag.values()].reduce((total, item) => total + productById.get(item.id).price * item.quantity, 0);
}

function updateCount() {
  bagCount.textContent = String([...bag.values()].reduce((total, item) => total + item.quantity, 0));
  if (bagCount.classList) {
    bagCount.classList.remove("count-bump");
    void bagCount.offsetWidth;
    bagCount.classList.add("count-bump");
  }
}

function renderFilters() {
  filters.innerHTML = categories.map(category => `<button type="button" data-filter="${category.id}" class="${category.id === activeCategory ? "active" : ""}" aria-pressed="${category.id === activeCategory}">${category.label}</button>`).join("");
}

function renderProducts() {
  const visible = products.filter(product => activeCategory === "todos" || product.category === activeCategory);
  productCount.textContent = `${visible.length} ${visible.length === 1 ? "artículo" : "artículos"} de ejemplo`;
  productGrid.innerHTML = visible.map(product => `
    <article class="product-card">
      <button type="button" class="product-image" data-view="${product.id}" aria-label="Ver ficha y fotos de ${product.name}"><img src="${product.image}" alt="" loading="lazy"><span class="product-code">${product.id}</span><span class="product-view-hint">Ver 3 fotos y detalles <span aria-hidden="true">↗</span></span></button>
      <div class="product-info"><p class="product-label">${product.label}</p><div class="product-name-row"><h3><button type="button" class="product-name-button" data-view="${product.id}">${product.name}</button></h3><strong>${money(product.price)}</strong></div><p class="product-color">Color: ${product.color}</p>
        <label for="size-${product.id}">Talle <small>disponible en esta demo</small></label><select id="size-${product.id}" data-size="${product.id}" required><option value="">Elegí un talle</option>${product.sizes.map(size => `<option value="${size}">${size}</option>`).join("")}</select>
        <button type="button" class="add-button" data-add="${product.id}"><span class="add-label">${addLabel(product.id)}</span><span class="add-icon" aria-hidden="true">+</span></button>
      </div>
    </article>`).join("");
}

function addToBag(id, selector = document.querySelector(`#size-${id}`), button = null) {
  const product = productById.get(id);
  if (!product) return;
  if (!selector.reportValidity()) return;
  const size = selector.value;
  if (!product.sizes.includes(size)) return;
  const key = `${id}|${size}`;
  const item = bag.get(key) || { id, size, quantity: 0 };
  item.quantity += 1;
  bag.set(key, item);
  updateCount();
  actionStatus.textContent = `${product.name}, talle ${size}, agregado al bolso.`;
  selector.value = "";
  syncAddButtons(id);
  flashAdded(button, id);
  if (bagDialog.open) renderBag();
}

function openProduct(id, opener) {
  const product = productById.get(id);
  if (!product) return;
  productOpener = opener;
  const photos = photosFor(product);
  productContent.innerHTML = `
    <div class="detail-layout">
      <div class="detail-gallery">
        <figure><img id="detail-main-image" src="${photos[0].src}" alt="${photos[0].alt}" width="760" height="1013"><figcaption id="detail-caption">${photos[0].label} · 1 de 3</figcaption></figure>
        <div class="detail-thumbs" role="group" aria-label="Fotos de ${product.name}">${photos.map((photo, index) => `<button type="button" data-photo="${index}" aria-label="Ver foto ${index + 1}: ${photo.label}" aria-pressed="${index === 0}"><img src="${photo.src}" alt="" loading="lazy"><span>${photo.label}</span></button>`).join("")}</div>
      </div>
      <div class="detail-info"><p class="eyebrow">${product.label} / ${product.id}</p><h2 id="product-dialog-title">${product.name}</h2><strong class="detail-price">${money(product.price)}</strong><p class="detail-description">${product.description}</p><p class="detail-color">Color: ${product.color}</p>
        <label for="detail-size">Elegí tu talle <small>disponible en esta demo</small></label><select id="detail-size" required><option value="">Elegí un talle</option>${product.sizes.map(size => `<option value="${size}">${size}</option>`).join("")}</select>
        <button type="button" class="add-button" data-add="${product.id}"><span class="add-label">${addLabel(product.id)}</span><span class="add-icon" aria-hidden="true">+</span></button><p class="detail-note">Producto, precio y talles ilustrativos. El bolso es una simulación; no se realiza una compra.</p>
      </div>
    </div>`;
  productDialog.showModal();
  closeProduct.focus();
}

function renderBag() {
  if (!bag.size) {
    bagContent.innerHTML = `<div class="bag-empty"><p>Tu bolso está vacío.</p><span>Elegí una prenda y su talle para empezar.</span><button type="button" id="back-to-collection">Ver colección</button></div>`;
    return;
  }
  bagContent.innerHTML = `
    <ul class="bag-items">${[...bag].map(([key, item]) => {
      const product = productById.get(item.id);
      return `<li><img src="${product.image}" alt="" width="76" height="90"><div class="bag-item-info"><strong>${product.name}</strong><span>Color ${product.color} · Talle ${item.size}</span><small>${money(product.price)} c/u</small></div><div class="bag-item-actions"><strong>${money(product.price * item.quantity)}</strong><div class="quantity"><button type="button" data-dec="${key}" aria-label="Quitar una unidad de ${product.name}, talle ${item.size}">−</button><span>${item.quantity}</span><button type="button" data-inc="${key}" aria-label="Agregar una unidad de ${product.name}, talle ${item.size}">+</button></div></div></li>`;
    }).join("")}</ul>
    <p class="bag-total"><span>Total ilustrativo</span><strong>${money(bagTotal())}</strong></p>
    <p class="bag-note">Talles, precios y disponibilidad son de ejemplo. No se realiza ningún pago.</p>
    <button type="button" class="review-button" id="review-bag">Ver resumen de ejemplo <span aria-hidden="true">→</span></button>
    <div id="bag-result" class="bag-result" role="status" tabindex="-1" hidden></div>`;
}

function openBag(opener) {
  bagOpener = opener;
  renderBag();
  bagDialog.showModal();
  closeBag.focus();
}

renderFilters();
renderProducts();
filters.addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeCategory = button.dataset.filter;
  renderFilters();
  renderProducts();
  filters.querySelector(`[data-filter="${activeCategory}"]`).focus();
});
productGrid.addEventListener("click", event => {
  const view = event.target.closest("[data-view]");
  if (view) { openProduct(view.dataset.view, view); return; }
  const button = event.target.closest("[data-add]");
  if (button) addToBag(button.dataset.add, button.closest(".product-info").querySelector("select"), button);
});
productContent.addEventListener("click", event => {
  const photoButton = event.target.closest("[data-photo]");
  if (photoButton) {
    const product = productById.get(productContent.querySelector("[data-add]").dataset.add);
    const photos = photosFor(product);
    const index = Number(photoButton.dataset.photo);
    productContent.querySelector("#detail-main-image").src = photos[index].src;
    productContent.querySelector("#detail-main-image").alt = photos[index].alt;
    productContent.querySelector("#detail-caption").textContent = `${photos[index].label} · ${index + 1} de 3`;
    productContent.querySelectorAll("[data-photo]").forEach(button => button.setAttribute("aria-pressed", String(button === photoButton)));
    return;
  }
  const addButton = event.target.closest("[data-add]");
  if (addButton) addToBag(addButton.dataset.add, productContent.querySelector("#detail-size"), addButton);
});
closeProduct.addEventListener("click", () => productDialog.close());
productDialog.addEventListener("click", event => { if (event.target === productDialog) productDialog.close(); });
productDialog.addEventListener("close", () => productOpener?.focus());
document.querySelectorAll("[data-open-bag]").forEach(button => button.addEventListener("click", () => openBag(button)));
closeBag.addEventListener("click", () => bagDialog.close());
bagDialog.addEventListener("click", event => { if (event.target === bagDialog) bagDialog.close(); });
bagDialog.addEventListener("close", () => bagOpener?.focus());
bagContent.addEventListener("click", event => {
  if (event.target.id === "back-to-collection") { bagDialog.close(); document.querySelector("#coleccion").scrollIntoView(); return; }
  const increase = event.target.closest("[data-inc]");
  const decrease = event.target.closest("[data-dec]");
  if (increase || decrease) {
    const key = increase?.dataset.inc || decrease.dataset.dec;
    const item = bag.get(key);
    if (!item) return;
    item.quantity += increase ? 1 : -1;
    if (item.quantity < 1) bag.delete(key);
    updateCount();
    syncAddButtons(item.id);
    renderBag();
    const target = [...bagContent.querySelectorAll(increase ? "[data-inc]" : "[data-dec]")].find(button => (increase ? button.dataset.inc : button.dataset.dec) === key);
    (target || closeBag).focus();
    return;
  }
  if (event.target.closest("#review-bag")) {
    const result = bagContent.querySelector("#bag-result");
    result.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = "Resumen de ejemplo";
    const lines = document.createElement("p");
    lines.textContent = [...bag.values()].map(item => `${item.quantity} × ${productById.get(item.id).name} (talle ${item.size})`).join(" · ");
    const total = document.createElement("p");
    total.textContent = `Total ilustrativo: ${money(bagTotal())}`;
    const note = document.createElement("small");
    note.textContent = "No se envió un pedido ni se hizo un pago. En una tienda real se confirmaría stock y precio final.";
    result.append(title, lines, total, note);
    result.hidden = false;
    result.focus();
  }
});
