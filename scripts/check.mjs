import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const data = readFileSync(join(root, "products.js"), "utf8");
const { products, categories } = runInNewContext(`${data}\n({products,categories})`);
const html = readFileSync(join(root, "index.html"), "utf8");
const app = readFileSync(join(root, "app.js"), "utf8");
const fail = message => { throw new Error(message); };

if (products.length !== 6) fail("Faltan productos de ejemplo");
if (new Set(products.map(product => product.id)).size !== products.length) fail("Códigos duplicados");
for (const product of products) {
  if (!Number.isInteger(product.price) || product.price <= 0) fail(`Precio inválido: ${product.id}`);
  if (!product.sizes?.length || new Set(product.sizes).size !== product.sizes.length) fail(`Talles inválidos: ${product.id}`);
  if (!categories.some(category => category.id === product.category)) fail(`Categoría inválida: ${product.id}`);
  if (statSync(join(root, product.image)).size === 0) fail(`Imagen vacía: ${product.id}`);
}
for (const asset of ["index.html", "styles.css", "products.js", "app.js", "logo.svg", "assets/hero.jpg"]) if (statSync(join(root, asset)).size === 0) fail(`Falta ${asset}`);
if (!html.includes("DEMO CONCEPTUAL") || !html.includes("No se realizan compras")) fail("Falta aviso de demo");
if (!app.includes("selector.reportValidity()") || !app.includes("bagTotal()")) fail("Falta selección de talle o total");

// Recorre la regla de talles y el total sin depender de un navegador o de un DOM externo.
const nodes = new Map();
const node = id => nodes.get(id) || nodes.set(id, {
  innerHTML: "", textContent: "", value: "", open: false,
  addEventListener() {},
  reportValidity() { return Boolean(this.value); },
}).get(id);
const document = {
  querySelector(selector) { return node(selector); },
  querySelectorAll() { return []; },
};
const journey = runInNewContext(`${data}\n${app}\naddToBag("LUM-01");
document.querySelector("#size-LUM-01").value = "M";
addToBag("LUM-01");
document.querySelector("#size-LUM-01").value = "M";
addToBag("LUM-01");
document.querySelector("#size-LUM-01").value = "S";
addToBag("LUM-01");
renderBag();
({count: bagCount.textContent, total: bagTotal(), entries: [...bag.values()].map(item => [item.size,item.quantity]), cleared: document.querySelector("#size-LUM-01").value, summary: bagContent.innerHTML})`, { document, Intl, Map });
if (journey.count !== "3" || journey.total !== 56700 || journey.entries.length !== 2 || journey.entries[0][1] !== 2 || journey.entries[1][0] !== "S" || journey.cleared !== "" || !journey.summary.includes("Talle M") || !journey.summary.includes("Talle S") || !journey.summary.includes("56.700")) fail("Falló el bolso por talle o el total");
console.log("OK: 6 productos, precios, talles, logo, imágenes y bolso por talle");
