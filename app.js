const themeMeta = {
  All: {
    title: "All picks",
    blurb: "Everything pretty, useful, and worth saving."
  },
  Home: {
    title: "Home",
    blurb: "Soft corners, kitchen upgrades, and apartment-pretty details."
  },
  Beauty: {
    title: "Beauty",
    blurb: "Vanity favorites, hair tools, and polished little luxuries."
  },
  Travel: {
    title: "Travel",
    blurb: "Clean packing, chic carry-ons, and hotel-ready organization."
  },
  Fashion: {
    title: "Fashion",
    blurb: "Soft basics, pilates layers, and it-girl errand uniforms."
  },
  Organization: {
    title: "Organization",
    blurb: "Bathroom order, beauty storage, and low-clutter routines."
  }
};

const productLookup = new Map();
const collectionLookup = new Map(collections.map((collection) => [collection.id, collection]));
const allProducts = collections.flatMap((collection) =>
  collection.items.map((item) => {
    const product = {
      ...item,
      theme: collection.theme,
      collectionId: collection.id,
      collectionLabel: collection.label,
      source: collection.source,
      collectionUrl: collection.collectionUrl
    };

    if (!productLookup.has(product.asin)) {
      productLookup.set(product.asin, product);
    }

    return product;
  })
);

const state = {
  activeTheme: "All",
  activeCollectionId: null,
  query: "",
  visibleCount: 48,
  lastItems: []
};

const refs = {
  statProducts: document.querySelector("#statProducts"),
  statCollections: document.querySelector("#statCollections"),
  statThemes: document.querySelector("#statThemes"),
  heroHighlights: document.querySelector("#heroHighlights"),
  bundleGrid: document.querySelector("#bundleGrid"),
  themeFilters: document.querySelector("#themeFilters"),
  searchInput: document.querySelector("#searchInput"),
  shuffleButton: document.querySelector("#shuffleButton"),
  productCount: document.querySelector("#productCount"),
  productGrid: document.querySelector("#productGrid"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  collectionGrid: document.querySelector("#collectionGrid"),
  collectionState: document.querySelector("#collectionState"),
  collectionStateLabel: document.querySelector("#collectionStateLabel"),
  clearCollectionButton: document.querySelector("#clearCollectionButton")
};

const themeOrder = ["All", "Home", "Beauty", "Travel", "Fashion", "Organization"];

function safe(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function firstProductsByAsin(asins) {
  return asins.map((asin) => productLookup.get(asin)).filter(Boolean);
}

function shuffleList(items) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getFilteredProducts() {
  const query = state.query.trim().toLowerCase();

  return allProducts.filter((product) => {
    const matchesTheme =
      state.activeTheme === "All" ? true : product.theme === state.activeTheme;
    const matchesCollection =
      state.activeCollectionId === null || product.collectionId === state.activeCollectionId;

    const haystack = [
      product.title,
      product.brand,
      product.collectionLabel,
      product.source,
      product.theme
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = query ? haystack.includes(query) : true;
    return matchesTheme && matchesCollection && matchesQuery;
  });
}

function renderStats() {
  refs.statProducts.textContent = String(allProducts.length);
  refs.statCollections.textContent = String(collections.length);
  refs.statThemes.textContent = String(themeOrder.length - 1);
}

function renderHeroHighlights() {
  const highlightAsins = ["B0F13PM2Y5", "B0CG3BHGMS", "B0DQSR97R3"];
  const labels = ["home crush", "travel favorite", "daily uniform"];

  refs.heroHighlights.innerHTML = firstProductsByAsin(highlightAsins)
    .map(
      (product, index) => `
        <a class="hero-highlight" href="${safe(product.href)}" target="_blank" rel="noopener noreferrer sponsored">
          <img src="${safe(product.image)}" alt="${safe(product.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='./product-fallback.svg';" />
          <div>
            <span class="theme-tag">${safe(labels[index])}</span>
            <strong>${safe(product.title)}</strong>
            <p>${safe(product.brand)} | ${safe(product.price)}</p>
          </div>
        </a>
      `
    )
    .join("");
}

function renderBundles() {
  refs.bundleGrid.innerHTML = bundleSets
    .map((bundle) => {
      const products = firstProductsByAsin(bundle.itemAsins);
      const lead = products[0];

      return `
        <article class="bundle-card" data-theme="${safe(bundle.theme)}" data-reveal>
          <div class="bundle-topline">
            <span>${safe(bundle.theme)}</span>
            <span>${products.length} pieces</span>
          </div>
          <div class="bundle-stack">
            ${products
              .map(
                (product) => `
                  <img src="${safe(product.image)}" alt="${safe(product.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='./product-fallback.svg';" />
                `
              )
              .join("")}
          </div>
          <h3>${safe(bundle.title)}</h3>
          <p>${safe(bundle.subtitle)}</p>
          <p>${safe(bundle.note)}</p>
          <ul class="bundle-list">
            ${products
              .map(
                (product) => `
                  <li>
                    <a href="${safe(product.href)}" target="_blank" rel="noopener noreferrer sponsored">
                      <span>${safe(product.brand)} | ${safe(product.title)}</span>
                      <strong>${safe(product.price)}</strong>
                    </a>
                  </li>
                `
              )
              .join("")}
          </ul>
          <div class="bundle-actions">
            <a class="button button-dark" href="${safe(lead.href)}" target="_blank" rel="noopener noreferrer sponsored">
              Shop hero item
            </a>
            <button class="link-button" type="button" data-jump-theme="${safe(bundle.theme)}">
              See all ${safe(bundle.theme.toLowerCase())} picks
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderThemeFilters() {
  refs.themeFilters.innerHTML = themeOrder
    .map((theme) => {
      const meta = themeMeta[theme];
      const isActive = state.activeTheme === theme ? "is-active" : "";
      return `
        <button
          class="theme-filter ${isActive}"
          type="button"
          data-theme-filter="${safe(theme)}"
          title="${safe(meta.blurb)}"
        >
          ${safe(meta.title)}
        </button>
      `;
    })
    .join("");
}

function productCard(product) {
  return `
    <article class="product-card" data-reveal>
      <a class="product-card-image" href="${safe(product.href)}" target="_blank" rel="noopener noreferrer sponsored">
        <img src="${safe(product.image)}" alt="${safe(product.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='./product-fallback.svg';" />
      </a>
      <div class="product-topline">
        <span class="theme-tag">${safe(product.theme)}</span>
        <span class="collection-chip">${safe(product.collectionLabel)}</span>
      </div>
      <p class="product-brand">${safe(product.brand)}</p>
      <h3>${safe(product.title)}</h3>
      <p>${safe(product.source)}</p>
      <p class="product-price">${safe(product.price)}</p>
      <div class="product-actions">
        <a class="button button-dark" href="${safe(product.href)}" target="_blank" rel="noopener noreferrer sponsored">
          Shop now
        </a>
      </div>
    </article>
  `;
}

function renderProducts(items = getFilteredProducts()) {
  state.lastItems = items;
  const visibleItems = items.slice(0, state.visibleCount);
  refs.productCount.textContent = `${visibleItems.length} of ${items.length} picks showing`;
  refs.loadMoreButton.hidden = visibleItems.length >= items.length;
  renderCollectionState();

  if (!items.length) {
    refs.productGrid.innerHTML = `
      <div class="empty-state" data-reveal>
        No matches yet. Try a broader search term or switch back to another mood.
      </div>
    `;
    revealVisible();
    return;
  }

  refs.productGrid.innerHTML = visibleItems.map(productCard).join("");
  revealVisible();
}

function renderCollections() {
  refs.collectionGrid.innerHTML = collections
    .map((collection) => {
      const preview = collection.items.slice(0, 3);

      return `
        <article class="collection-card" data-reveal>
          <div class="collection-preview">
            ${preview
              .map(
                (item) => `
                  <img src="${safe(item.image)}" alt="${safe(item.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='./product-fallback.svg';" />
                `
              )
              .join("")}
          </div>
          <div class="collection-topline">
            <span class="theme-tag">${safe(collection.theme)}</span>
            <span class="collection-chip">${collection.items.length} picks</span>
          </div>
          <h3>${safe(collection.label)}</h3>
          <p>Source: ${safe(collection.source)}</p>
          <p>${safe(themeMeta[collection.theme].blurb)}</p>
          <div class="collection-actions">
            <button class="button button-dark" type="button" data-jump-collection="${safe(collection.id)}">
              View picks
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function setTheme(theme) {
  state.activeTheme = theme;
  state.activeCollectionId = null;
  state.visibleCount = 48;
  renderThemeFilters();
  renderProducts();
}

function setCollection(collectionId) {
  const collection = collectionLookup.get(collectionId);
  if (!collection) return;

  state.activeCollectionId = collectionId;
  state.activeTheme = "All";
  state.visibleCount = 48;
  renderThemeFilters();
  renderProducts();
  document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCollectionState() {
  const collection = collectionLookup.get(state.activeCollectionId);
  refs.collectionState.hidden = !collection;
  refs.collectionStateLabel.textContent = collection ? `Viewing: ${collection.label}` : "";
}

function revealVisible() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((element) => {
    observer.observe(element);
  });
}

function bindEvents() {
  refs.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.visibleCount = 48;
    renderProducts();
  });

  refs.shuffleButton.addEventListener("click", () => {
    state.visibleCount = 48;
    renderProducts(shuffleList(getFilteredProducts()));
  });

  refs.loadMoreButton.addEventListener("click", () => {
    state.visibleCount += 48;
    renderProducts(state.lastItems);
  });

  refs.clearCollectionButton.addEventListener("click", () => {
    state.activeCollectionId = null;
    renderProducts();
  });

  document.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-theme-filter]");
    if (filter) {
      setTheme(filter.dataset.themeFilter);
      return;
    }

    const jump = event.target.closest("[data-jump-theme]");
    if (jump) {
      setTheme(jump.dataset.jumpTheme);
      document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const collection = event.target.closest("[data-jump-collection]");
    if (collection) {
      setCollection(collection.dataset.jumpCollection);
    }
  });
}

function init() {
  renderStats();
  renderHeroHighlights();
  renderBundles();
  renderThemeFilters();
  renderProducts();
  renderCollections();
  bindEvents();
  revealVisible();
}

init();
