// ============================
// CART.JS - Virtue Eat World
// ============================

// Get cart from localStorage (guarded against corrupted JSON)
let cart = [];

try {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
} catch (e) {
    cart = [];
}

// ----------------------------
// Save Cart
// ----------------------------
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// ----------------------------
// Helper: parse a price string like "₹1,299" -> 1299
// ----------------------------
function parsePrice(value) {

    const cleaned = String(value).replace(/[^0-9.]/g, "");

    const num = parseFloat(cleaned);

    return isNaN(num) ? 0 : num;
}

// ----------------------------
// Helper: format a number as ₹ currency
// ----------------------------
function formatPrice(value) {
    return "₹" + Number(value).toLocaleString("en-IN");
}

// ----------------------------
// Helper: escape text before putting it in innerHTML
// ----------------------------
function escapeHTML(str) {

    const div = document.createElement("div");

    div.textContent = String(str);

    return div.innerHTML;
}

// ----------------------------
// Sanitize Cart
// Repairs items saved by older/broken versions of this script
// (missing qty, bad price, alternate field names, etc.)
// ----------------------------
function sanitizeCart() {

    const cleaned = cart
        .map(item => {

            if (!item || typeof item !== "object") return null;

            const name = item.name || item.title || "";

            if (!name) return null;

            const price = parsePrice(
                item.price !== undefined ? item.price : item.cost
            );

            const image = item.image || item.img || "";

            let qty = Number(item.qty !== undefined ? item.qty : item.quantity);

            if (!Number.isFinite(qty) || qty < 1) qty = 1;

            return { name, price, image, qty };

        })
        .filter(Boolean);

    const changed = JSON.stringify(cleaned) !== JSON.stringify(cart);

    cart = cleaned;

    if (changed) saveCart();
}

sanitizeCart();

// ----------------------------
// Update Navbar Count
// ----------------------------
function updateCartCount() {

    const badge = document.getElementById("cartCount");

    if (!badge) return;

    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    badge.innerText = count;
}

// ----------------------------
// Sticky Bottom Cart Bar (Swiggy-style)
// Shows a summary bar once items are in the cart.
// Tapping it is the ONLY way to go to cart.html — adding
// items never navigates away from the current page.
// ----------------------------
let cartBarEl = null;

function buildCartBar() {

    // Don't show the floating bar on the cart page itself
    if (document.getElementById("cartItems")) return;

    if (cartBarEl) return;

    cartBarEl = document.createElement("div");
    cartBarEl.id = "stickyCartBar";
    cartBarEl.setAttribute("role", "button");
    cartBarEl.setAttribute("tabindex", "0");

    Object.assign(cartBarEl.style, {
        position: "fixed",
        right: "100px",
        bottom: "20px",
        transform: "translateY(120%)",
        maxWidth: "min(320px, calc(100% - 32px))",
        background: "#0f9d58",
        color: "#fff",
        borderRadius: "14px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        justifyContent: "space-between",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        cursor: "pointer",
        zIndex: "999",
        fontFamily: "inherit",
        transition: "transform 0.28s ease",
        opacity: "0"
    });

    cartBarEl.innerHTML = `
        <span id="stickyCartInfo" style="font-weight:600;font-size:14px;white-space:nowrap;"></span>
        <span style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:14px;white-space:nowrap;">
            View Cart <i class="fa-solid fa-arrow-right"></i>
        </span>
    `;

    const goToCart = () => { window.location.href = "cart.html"; };

    cartBarEl.addEventListener("click", goToCart);
    cartBarEl.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") goToCart();
    });

    document.body.appendChild(cartBarEl);
}

function updateCartBar() {

    buildCartBar();

    if (!cartBarEl) return;

    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (count === 0) {
        cartBarEl.style.opacity = "0";
        cartBarEl.style.transform = "translateY(120%)";
        return;
    }

    const infoEl = document.getElementById("stickyCartInfo");
    if (infoEl) {
        infoEl.textContent = `${count} item${count > 1 ? "s" : ""} · ${formatPrice(total)}`;
    }

    cartBarEl.style.opacity = "1";
    cartBarEl.style.transform = "translateY(0)";
}

// ----------------------------
// Small "Added to cart" toast
// ----------------------------
let toastTimer = null;

function showAddedToast(name) {

    if (document.getElementById("cartItems")) return; // no toast needed on cart page

    let toast = document.getElementById("cartToast");

    if (!toast) {

        toast = document.createElement("div");
        toast.id = "cartToast";

        Object.assign(toast.style, {
            position: "fixed",
            right: "100px",
            bottom: "90px",
            transform: "translateY(20px)",
            background: "#222",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
            zIndex: "1000",
            opacity: "0",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            pointerEvents: "none"
        });

        document.body.appendChild(toast);
    }

    toast.textContent = `${name} added to cart ✓`;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
    }, 1500);
}

// ----------------------------
// Add To Cart
// ----------------------------
function addToCart(name, price, image) {

    price = parsePrice(price);

    const existing = cart.find(item => item.name === name);

    if (existing) {

        existing.qty++;

        // Refresh image/price in case the stored entry was stale or broken
        existing.image = image;
        existing.price = price;

    } else {

        cart.push({
            name: name,
            price: price,
            image: image,
            qty: 1
        });

    }

    saveCart();

    updateCartCount();

    updateCartBar();

    showAddedToast(name);
}

// ----------------------------
// Increase Qty
// ----------------------------
function increaseQty(index) {

    if (!cart[index]) return;

    cart[index].qty++;

    saveCart();

    renderCart();

    updateCartCount();
}

// ----------------------------
// Decrease Qty
// ----------------------------
function decreaseQty(index) {

    if (!cart[index]) return;

    if (cart[index].qty > 1) {

        cart[index].qty--;

    } else {

        cart.splice(index, 1);

    }

    saveCart();

    renderCart();

    updateCartCount();
}

// ----------------------------
// Remove Item
// ----------------------------
function removeItem(index) {

    if (!cart[index]) return;

    cart.splice(index, 1);

    saveCart();

    renderCart();

    updateCartCount();
}

// ----------------------------
// Display Cart
// ----------------------------
function renderCart() {

    const cartContainer = document.getElementById("cartItems");

    const subtotalEl = document.getElementById("subtotal");
    const grandTotalEl = document.getElementById("grandTotal");

    if (!cartContainer) return;

    let subtotal = 0;

    if (cart.length === 0) {

        cartContainer.innerHTML = `
            <div style="padding:50px;text-align:center;">
                <h2>Your Cart is Empty 🛒</h2>
                <br>
                <a href="menu.html" class="btn btn-primary">
                    Continue Shopping
                </a>
            </div>
        `;

        if (subtotalEl) subtotalEl.innerText = formatPrice(0);
        if (grandTotalEl) grandTotalEl.innerText = formatPrice(0);

        return;
    }

    const rows = cart.map((item, index) => {

        const total = item.price * item.qty;

        subtotal += total;

        return `
            <div class="cart-item">
                <div class="product">
                    <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=No+Image';">
                    <div>
                        <h4>${escapeHTML(item.name)}</h4>
                        <p>Freshly Prepared</p>
                    </div>
                </div>
                <div>
                    ${formatPrice(item.price)}
                </div>
                <div class="qty">
                    <button type="button" class="qty-decrease" data-index="${index}">-</button>
                    <span>${item.qty}</span>
                    <button type="button" class="qty-increase" data-index="${index}">+</button>
                </div>
                <div>
                    ${formatPrice(total)}
                    <button type="button" class="remove" data-index="${index}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

    });

    cartContainer.innerHTML = rows.join("");

    if (subtotalEl) subtotalEl.innerText = formatPrice(subtotal);
    if (grandTotalEl) grandTotalEl.innerText = formatPrice(subtotal);
}

// ----------------------------
// Wire everything up once the DOM is ready
// ----------------------------
document.addEventListener("DOMContentLoaded", function () {

    // Order Buttons (menu page)
    document.querySelectorAll(".add-to-cart").forEach(button => {

        button.addEventListener("click", function () {

            const card = this.closest(".menu-item");

            if (!card) return;

            const nameEl = card.querySelector("h4");
            const priceEl = card.querySelector(".price");
            const imageEl = card.querySelector(".menu-item-photo img");

            if (!nameEl || !priceEl || !imageEl) return;

            const name = nameEl.childNodes[0].textContent.trim();
            const price = priceEl.textContent;
            const image = imageEl.src;

            addToCart(name, price, image);

        });

    });

    // Cart page: render + delegate qty/remove clicks
    const cartContainer = document.getElementById("cartItems");

    if (cartContainer) {

        renderCart();

        cartContainer.addEventListener("click", function (e) {

            const target = e.target.closest("button[data-index]");

            if (!target) return;

            const index = Number(target.dataset.index);

            if (target.classList.contains("qty-increase")) {
                increaseQty(index);
            } else if (target.classList.contains("qty-decrease")) {
                decreaseQty(index);
            } else if (target.classList.contains("remove")) {
                removeItem(index);
            }

        });

    }

    // Initial Load
    updateCartCount();
    updateCartBar();

});