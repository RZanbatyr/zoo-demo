// Разметка для поисковиков и ИИ-ассистентов (schema.org JSON-LD).
// Собирается из content.ts, чтобы товары и цены в разметке совпадали с витриной.
import type { Category, Content } from "./content";

const SITE_URL = "https://rzanbatyr.github.io/zoo-demo/";

export function buildJsonLd(c: Content, cat?: Category) {
  const store = {
    "@type": "PetStore",
    "@id": `${SITE_URL}#store`,
    name: c.shop.name,
    description: c.meta.description,
    url: SITE_URL,
    image: `${SITE_URL}og.jpg`,
    telephone: c.shop.phone,
    address: { "@type": "PostalAddress", streetAddress: c.shop.address, addressLocality: c.shop.city, addressCountry: "KZ" },
    openingHours: "Mo-Su 09:00-21:00",
    priceRange: "₸₸",
    currenciesAccepted: "KZT",
    paymentAccepted: "Cash, Kaspi, Card",
    areaServed: c.shop.city,
    knowsLanguage: ["ru", "kk"],
    sameAs: [c.shop.whatsapp],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: c.ui.allCategories,
      itemListElement: c.categories.map((k) => ({
        "@type": "OfferCatalog",
        name: k.name,
        url: `${SITE_URL}#/c/${k.slug}`,
        itemListElement: c.products
          .filter((p) => p.cat === k.slug)
          .map((p) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Product", name: `${p.name}, ${p.size}`, image: `${SITE_URL}${p.img}` },
            price: p.price,
            priceCurrency: "KZT",
            availability: "https://schema.org/InStock",
          })),
      })),
    },
  };

  const graph: Record<string, unknown>[] = [
    { "@type": "WebSite", "@id": `${SITE_URL}#website`, url: SITE_URL, name: c.meta.title, inLanguage: ["ru", "kk"] },
    store,
  ];

  if (cat) {
    graph.push({
      "@type": "CollectionPage",
      "@id": `${SITE_URL}#/c/${cat.slug}`,
      name: cat.name,
      description: cat.blurb,
      isPartOf: { "@id": `${SITE_URL}#website` },
      about: { "@id": `${SITE_URL}#store` },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// Пишем/обновляем один <script type="application/ld+json"> в <head>
export function applyJsonLd(c: Content, cat?: Category) {
  let el = document.getElementById("ld-json") as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "ld-json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(buildJsonLd(c, cat));
}
