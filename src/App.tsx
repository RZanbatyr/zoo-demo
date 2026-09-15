import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { CONTENT, fmtPrice, type Category, type Content, type Lang, type Product } from "./content";

const BASE = import.meta.env.BASE_URL;
const HERO_IMAGE = `${BASE}img/hero.webp`;
const SECTION2_IMAGE = `${BASE}img/section2.webp`;
const SECTION3_IMG1 = `${BASE}img/s3img1.webp`;
const SECTION3_IMG2 = `${BASE}img/s3img2.webp`;
const SECTION3_BG = `${BASE}img/s3bg.webp`;
const WA_3D = `${BASE}img/wa-3d.webp`;
const KASPI = `${BASE}img/kaspi.webp`;
const PIN_MAP = `${BASE}img/pin-map.webp`;
const PHONE_3D = `${BASE}img/phone-3d.webp`;
const BAG_WHEELS = `${BASE}img/bag-wheels.webp`;
// Первый экран: картинку увеличиваем, чтобы лицо продавца оказалось в большой карточке, а не под барами
const HERO_ZOOM = 1.4;

// ------------------------------------------------------------------ hooks

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

type MaskPos = { x: number; y: number; sw: number; sh: number };

function useMaskPositions(sectionRef: RefObject<HTMLElement>, cardsRef: RefObject<(HTMLElement | null)[]>) {
  const [positions, setPositions] = useState<MaskPos[]>([]);
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const compute = () => {
      const sr = section.getBoundingClientRect();
      const next = (cardsRef.current || []).map((card) => {
        if (!card) return { x: 0, y: 0, sw: sr.width, sh: sr.height };
        const cr = card.getBoundingClientRect();
        return { x: cr.left - sr.left, y: cr.top - sr.top, sw: sr.width, sh: sr.height };
      });
      setPositions(next);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(section);
    return () => ro.disconnect();
  }, [sectionRef, cardsRef]);
  return positions;
}

function useImageWidth(src: string, sectionRef: RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const img = new Image();
    const calc = () => {
      const sh = sectionRef.current?.getBoundingClientRect().height || window.innerHeight;
      if (img.naturalHeight) setWidth(img.naturalWidth * (sh / img.naturalHeight));
    };
    img.onload = calc;
    img.src = src;
    const ro = sectionRef.current ? new ResizeObserver(calc) : null;
    if (ro && sectionRef.current) ro.observe(sectionRef.current);
    return () => ro?.disconnect();
  }, [src, sectionRef]);
  return width;
}

function useStaggeredReveal(count: number, threshold = 0.15) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Fast-paint: секция уже во вьюпорте, показываем сразу (иначе скриншоты ловят opacity:0)
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold }
    );
    io.observe(el);
    const safety = window.setTimeout(() => setVisible(true), 1200);
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, [threshold]);
  const getAnimStyle = (i: number): CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms`,
  });
  void count;
  return { containerRef, getAnimStyle };
}

function MaskedCard({
  bgImage,
  position,
  imageWidth,
  focalX,
  className = "",
  children,
  cardRef,
  style,
  onClick,
  zoom = 1,
  focalY = 0,
}: {
  bgImage: string;
  position?: MaskPos;
  imageWidth: number;
  focalX: number;
  className?: string;
  children?: ReactNode;
  cardRef: (el: HTMLDivElement | null) => void;
  style?: CSSProperties;
  onClick?: () => void;
  zoom?: number; // >1 увеличивает картинку, чтобы сдвинуть сюжет вниз (лицо ниже верхних баров)
  focalY?: number; // 0 = верх картинки прижат к верху секции, 1 = низ
}) {
  const p = position || { x: 0, y: 0, sw: 0, sh: 0 };
  const bgW = imageWidth * zoom;
  const bgH = p.sh * zoom;
  const overflowX = bgW > p.sw ? bgW - p.sw : 0;
  const overflowY = bgH > p.sh ? bgH - p.sh : 0;
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={className}
      style={{
        ...style,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: `auto ${bgH}px`,
        backgroundPosition: `-${p.x + overflowX * focalX}px -${p.y + overflowY * focalY}px`,
        backgroundRepeat: "no-repeat",
        backgroundColor: "#e7e5e4",
      }}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ routing

type Route = { kind: "home" } | { kind: "cat"; slug: string };

function parseRoute(): Route {
  const m = window.location.hash.match(/^#\/c\/([\w-]+)/);
  return m ? { kind: "cat", slug: m[1] } : { kind: "home" };
}

function scrollToAnchor(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ------------------------------------------------------------------ icons

const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`rotate-[-45deg] ${className}`}>
    <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4 5.1 5.1 0 0 0 3.1.6 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.2-.2-.2-.4-.3z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M21.9 4.6 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.5-.6-.2L6.2 13.1 1.4 11.6c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.6z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);


// ------------------------------------------------------------------ cart

type CartLine = { id: string; qty: number };

function readCart(): CartLine[] {
  try {
    const v = JSON.parse(localStorage.getItem("cart") || "[]");
    if (Array.isArray(v)) return v.filter((l) => l && typeof l.id === "string" && l.qty > 0);
  } catch {}
  return [];
}

function useCart(c: Content) {
  const [lines, setLines] = useState<CartLine[]>(readCart);
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(lines));
    } catch {}
  }, [lines]);
  const byId = useMemo(() => Object.fromEntries(c.products.map((p) => [p.id, p])), [c]);
  const add = useCallback((id: string) => {
    setLines((ls) => (ls.some((l) => l.id === id) ? ls.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { id, qty: 1 }]));
  }, []);
  const set = useCallback((id: string, qty: number) => {
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, qty } : l))));
  }, []);
  const clear = useCallback(() => setLines([]), []);
  const qtyOf = (id: string) => lines.find((l) => l.id === id)?.qty || 0;
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + (byId[l.id]?.price || 0) * l.qty, 0);
  return { lines, add, set, clear, qtyOf, count, total, byId };
}

type Cart = ReturnType<typeof useCart>;

function QtyControl({ id, cart, c, size = "md" }: { id: string; cart: Cart; c: Content; size?: "sm" | "md" }) {
  const q = cart.qtyOf(id);
  const h = size === "sm" ? "h-9" : "h-11";
  if (!q)
    return (
      <button onClick={() => cart.add(id)} className={`${h} w-full px-4 btn3d btn3d-dark rounded-full text-white text-sm font-semibold`}>
        {c.ui.addToCart}
      </button>
    );
  return (
    <div className={`${h} w-full flex items-center justify-between rounded-full border border-black bg-white`}>
      <button onClick={() => cart.set(id, q - 1)} className="w-11 h-full text-lg font-bold" aria-label="-">
        −
      </button>
      <span className="text-sm font-bold tabular-nums">
        <span className="hidden md:inline">{c.ui.inCart}: </span>
        {q}
      </span>
      <button onClick={() => cart.add(id)} className="w-11 h-full text-lg font-bold" aria-label="+">
        +
      </button>
    </div>
  );
}

function ProductCard({ p, cart, c, style }: { p: Product; cart: Cart; c: Content; style?: CSSProperties }) {
  return (
    <div style={style} className="rounded-xl md:rounded-2xl bg-stone-50 p-2.5 md:p-3 flex flex-col gap-2 md:gap-3">
      <div className="relative rounded-lg md:rounded-xl overflow-hidden aspect-square bg-[#F3F1EE]">
        <img src={`${BASE}${p.img}`} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
        {p.tag && (
          <span className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-[11px] font-bold ${p.oldPrice ? "bg-[#D9542B] text-white" : "bg-white text-black"}`}>
            {p.tag}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm md:text-[15px] font-semibold leading-snug">{p.name}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{p.size}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-base md:text-lg font-bold tabular-nums">{fmtPrice(p.price)}</span>
        {p.oldPrice && <span className="text-xs text-neutral-400 line-through tabular-nums">{fmtPrice(p.oldPrice)}</span>}
      </div>
      <QtyControl id={p.id} cart={cart} c={c} size="sm" />
    </div>
  );
}

// ------------------------------------------------------------------ navbar

function Navbar({ c, onLang, onCart, count, route }: { c: Content; onLang: () => void; onCart: () => void; count: number; route: Route }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    if (route.kind !== "home") {
      window.location.hash = "";
      window.setTimeout(() => scrollToAnchor(href), 60);
    } else {
      scrollToAnchor(href);
    }
  };

  const CartBtn = ({ full }: { full?: boolean }) => (
    <button onClick={onCart} className={`relative px-5 py-3 btn3d btn3d-dark rounded-full text-white text-sm font-semibold ${full ? "w-full py-4" : ""}`}>
      {c.ui.cart}
      {count > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#F0B429] text-black text-xs font-bold tabular-nums">{count}</span>}
    </button>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white/85 backdrop-blur-md">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = "";
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex flex-col"
        >
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none">{c.shop.logoTop}</span>
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none -mt-0.5 md:-mt-1">{c.shop.logoBottom}</span>
          <span className="text-[8px] md:text-[9px] font-medium leading-none mt-1.5 md:mt-2">{c.shop.tagline}</span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {c.ui.nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => {
                e.preventDefault();
                go(n.href);
              }}
              className="text-sm font-semibold text-black hover:text-neutral-500 transition-colors"
            >
              {n.label}
            </a>
          ))}
          <a href={c.shop.phoneHref} className="text-sm font-semibold text-black">
            {c.shop.phone}
          </a>
          <button onClick={onLang} className="px-3 py-2 rounded-full border border-black/20 text-xs font-bold tracking-wide hover:border-black transition-colors" aria-label="Switch language">
            {c.ui.langSwitch}
          </button>
          <CartBtn />
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <button onClick={onCart} className="relative w-10 h-10 rounded-full btn3d btn3d-dark text-white flex items-center justify-center" aria-label={c.ui.cart}>
            <CartIcon />
            {count > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F0B429] text-black text-[10px] font-bold flex items-center justify-center">{count}</span>}
          </button>
          <button onClick={() => setOpen((o) => !o)} className="w-10 h-10 flex items-center justify-center relative" aria-label={open ? c.ui.close : c.ui.menu}>
            <span className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${open ? "rotate-45 translate-y-0" : "-translate-y-2"}`} />
            <span className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${open ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"}`} />
            <span className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${open ? "-rotate-45 translate-y-0" : "translate-y-2"}`} />
          </button>
        </div>
      </header>

      <div className={`md:hidden fixed inset-0 z-50 overflow-hidden ${open ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
          <button onClick={() => setOpen(false)} className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center" aria-label={c.ui.close}>
            <span className="absolute h-0.5 w-6 bg-black rounded-full rotate-45" />
            <span className="absolute h-0.5 w-6 bg-black rounded-full -rotate-45" />
          </button>
          <div className="flex flex-col justify-center h-full px-8 gap-1">
            {c.ui.nav.map((n, i) => (
              <a
                key={n.href}
                href={n.href}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.href);
                }}
                className={`text-4xl font-bold text-black hover:text-neutral-500 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
                style={{ transitionDelay: open ? `${100 + i * 60}ms` : "0ms" }}
              >
                {n.label}
              </a>
            ))}
            <div className={`mt-8 pt-8 border-t border-neutral-200 transition-all duration-500 ${open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`} style={{ transitionDelay: open ? "450ms" : "0ms" }}>
              <div className="flex items-center justify-between mb-4">
                <a href={c.shop.phoneHref} className="text-sm font-semibold text-black">
                  {c.shop.phone}
                </a>
                <button onClick={onLang} className="px-3 py-2 rounded-full border border-black/20 text-xs font-bold" aria-label="Switch language">
                  {c.ui.langSwitch}
                </button>
              </div>
              <div
                onClick={() => {
                  setOpen(false);
                  onCart();
                }}
              >
                <CartBtn full />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Объёмная глянцевая кнопка WhatsApp (картинка из референсов Рахат), с подписью справа или без
function WaButton({ href, label, size = 72, className = "" }: { href: string; label?: string; size?: number; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label="WhatsApp" className={`group inline-flex items-center gap-3 ${className}`}>
      <img src={WA_3D} alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 drop-shadow-[0_10px_18px_rgba(37,211,102,0.35)] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
      {label && <span className="text-sm md:text-base font-bold leading-tight">{label}</span>}
    </a>
  );
}

const CartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6h15l-1.5 8h-12z" />
    <path d="M6 6 5 3H2" />
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="17" cy="20" r="1.5" />
  </svg>
);

// ------------------------------------------------------------------ section 1: hero mosaic

function HeroMosaic({ c }: { c: Content }) {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const positions = useMaskPositions(sectionRef, cardsRef);
  const imageWidth = useImageWidth(HERO_IMAGE, sectionRef);
  const reveal = useStaggeredReveal(4);
  const focalX = isMobile ? 0.7 : 0.8;

  return (
    <section
      id="top"
      ref={(el) => {
        sectionRef.current = el;
        reveal.containerRef.current = el;
      }}
      className="h-screen w-full overflow-hidden flex flex-col pt-24 md:pt-24 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      {c.featureBars.map((f, i) => (
        <MaskedCard key={f} bgImage={HERO_IMAGE} position={positions[i]} imageWidth={imageWidth} focalX={focalX} zoom={HERO_ZOOM} cardRef={(el) => (cardsRef.current[i] = el)} style={reveal.getAnimStyle(i)} className="w-full h-14 md:h-20 shrink-0 rounded-xl md:rounded-2xl overflow-hidden relative">
          <span className="relative z-10 flex items-center justify-center h-full text-black text-lg md:text-3xl font-bold text-center px-3">{f}</span>
        </MaskedCard>
      ))}
      <MaskedCard bgImage={HERO_IMAGE} position={positions[3]} imageWidth={imageWidth} focalX={focalX} zoom={HERO_ZOOM} cardRef={(el) => (cardsRef.current[3] = el)} style={reveal.getAnimStyle(3)} className="w-full flex-1 min-h-0 rounded-xl md:rounded-2xl overflow-hidden relative">
        <p className="absolute top-4 left-4 md:top-7 md:left-7 text-black text-xs md:text-sm font-semibold leading-4 md:leading-5 max-w-[200px] md:max-w-[300px] z-10">
          {c.hero.top}
          <br />
          {c.hero.top2}
        </p>
        <div className="absolute bottom-5 left-3 md:bottom-8 md:left-4 z-10">
          <span className="block text-black text-xs md:text-sm font-semibold mb-1 md:mb-2">{c.hero.label}</span>
          <h1 className="text-black text-[clamp(3rem,11vw,11rem)] font-bold leading-[0.86] tracking-tight">
            {c.hero.h1[0]}
            <br />
            {c.hero.h1[1]}
          </h1>
        </div>
        <span className="absolute bottom-6 right-4 md:bottom-10 md:right-24 text-white text-xs md:text-sm font-semibold z-10 drop-shadow">{c.hero.right}</span>
      </MaskedCard>
    </section>
  );
}

// ------------------------------------------------------------------ section 2: catalog mosaic

function CatalogMosaic({ c }: { c: Content }) {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const positions = useMaskPositions(sectionRef, cardsRef);
  const imageWidth = useImageWidth(SECTION2_IMAGE, sectionRef);
  const reveal = useStaggeredReveal(4);
  const focalX = isMobile ? 0.65 : 0.8;
  const four = c.categories.slice(0, 4);

  return (
    <section
      id="catalog"
      ref={(el) => {
        sectionRef.current = el;
        reveal.containerRef.current = el;
      }}
      className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2 scroll-mt-20"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto_auto_auto] md:grid-rows-[1fr_1fr_0.8fr] gap-1.5 md:gap-2">
        <MaskedCard bgImage={SECTION2_IMAGE} position={positions[0]} imageWidth={imageWidth} focalX={focalX} cardRef={(el) => (cardsRef.current[0] = el)} style={reveal.getAnimStyle(0)} className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0">
          <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-2xl md:text-3xl font-bold z-10">{c.catalog.title}</h2>
          <p className="absolute bottom-4 left-5 md:bottom-6 md:left-7 text-white md:text-black text-xs md:text-sm font-semibold z-10">{c.catalog.sub}</p>
        </MaskedCard>
        <MaskedCard bgImage={SECTION2_IMAGE} position={positions[1]} imageWidth={imageWidth} focalX={focalX} cardRef={(el) => (cardsRef.current[1] = el)} style={reveal.getAnimStyle(1)} className="md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0">
          <p className="absolute bottom-16 left-5 md:bottom-20 md:left-7 text-white text-xs md:text-sm font-semibold leading-4 md:leading-5 z-10 drop-shadow">
            {c.catalog.text}
            <br />
            {c.catalog.text2}
          </p>
          <a href={c.shop.whatsapp} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-5 py-3 md:px-8 md:py-5 btn3d btn3d-light rounded-full text-black text-base md:text-xl font-bold z-10">
            {c.catalog.button}
          </a>
        </MaskedCard>
        <MaskedCard bgImage={SECTION2_IMAGE} position={positions[2]} imageWidth={imageWidth} focalX={focalX} cardRef={(el) => (cardsRef.current[2] = el)} style={reveal.getAnimStyle(2)} className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0">
          <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-[clamp(3rem,7vw,6rem)] font-bold leading-[0.9] z-10">
            {c.catalog.big[0]}
            <br />
            {c.catalog.big[1]}
          </h2>
        </MaskedCard>
        <MaskedCard bgImage={SECTION2_IMAGE} position={positions[3]} imageWidth={imageWidth} focalX={focalX} cardRef={(el) => (cardsRef.current[3] = el)} style={reveal.getAnimStyle(3)} className="col-span-1 md:col-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0">
          <div className="absolute inset-0 z-10 flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2 p-2 md:p-3">
            {four.map((cat, i) => {
              const active = i === 0;
              return (
                <a key={cat.slug} href={`#/c/${cat.slug}`} className={`flex-1 min-w-[calc(50%-4px)] md:min-w-0 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${active ? "bg-white/90 backdrop-blur-md" : "bg-white/20 backdrop-blur-xl hover:bg-white/30"}`}>
                  <h3 className={`text-xl md:text-4xl font-bold leading-[1.05] whitespace-pre-line ${active ? "text-black" : "text-white drop-shadow-md"}`}>{cat.short}</h3>
                  <span className={`self-end w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center text-xs md:text-sm font-semibold ${active ? "border-black text-black" : "border-white text-white"}`}>
                    {i < 3 ? `0${i + 1}` : <ArrowIcon />}
                  </span>
                </a>
              );
            })}
          </div>
        </MaskedCard>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ hits

function HitsSection({ c, cart }: { c: Content; cart: Cart }) {
  const reveal = useStaggeredReveal(8);
  const items = c.products.filter((p) => p.tag).slice(0, 8);
  return (
    <section
      id="hits"
      ref={(el) => {
        reveal.containerRef.current = el;
      }}
      className="w-full px-3 md:px-5 pt-6 md:pt-8 pb-1.5 md:pb-2 scroll-mt-20 md:scroll-mt-24"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-3 md:mb-4 px-1">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold leading-none">{c.hits.title}</h2>
          <p className="text-sm text-neutral-600 mt-2">{c.hits.sub}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.categories.map((cat) => (
            <a key={cat.slug} href={`#/c/${cat.slug}`} className="px-4 py-2 rounded-full border border-black text-xs md:text-sm font-semibold hover:bg-black hover:text-white transition-colors">
              {cat.name}
            </a>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
        {items.map((p, i) => (
          <ProductCard key={p.id} p={p} cart={cart} c={c} style={reveal.getAnimStyle(i)} />
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ delivery

function DeliverySection({ c }: { c: Content }) {
  const reveal = useStaggeredReveal(4);
  const autoHref = `${c.shop.whatsapp}?text=${encodeURIComponent(c.delivery.label + ": " + c.delivery.h3.join(" "))}`;
  return (
    <section
      id="delivery"
      ref={(el) => {
        reveal.containerRef.current = el;
      }}
      className="w-full overflow-hidden flex flex-col pt-6 md:pt-8 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2 scroll-mt-20 md:scroll-mt-24"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2 md:h-[calc(100vh-7rem)]">
        <div className="flex flex-col gap-1.5 md:gap-2">
          <div style={reveal.getAnimStyle(0)} className="relative rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-7 flex flex-col justify-between flex-[1.2] min-h-[180px] md:min-h-0 overflow-hidden">
            <h2 className="text-[clamp(2.6rem,6vw,6rem)] font-bold leading-[0.95] text-black relative z-10">
              {c.delivery.h2[0]}
              <br />
              {c.delivery.h2[1]}
            </h2>
            <p className="text-xs md:text-sm font-semibold text-black mt-4 relative z-10 max-w-[60%]">{c.delivery.sub}</p>
            {/* 3D-сумка на колёсах: иллюстрация доставки */}
            <img src={BAG_WHEELS} alt="" className="absolute right-3 bottom-2 md:right-6 md:bottom-4 w-28 md:w-44 object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.2)] pointer-events-none" />
          </div>
          <div style={reveal.getAnimStyle(1)} className="flex gap-1.5 md:gap-2 flex-1 min-h-[140px] md:min-h-0">
            <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
              <img src={SECTION3_IMG1} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
              <img src={SECTION3_IMG2} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
          <div style={reveal.getAnimStyle(2)} className="rounded-xl md:rounded-2xl bg-[#F0B429] p-5 md:p-7 flex items-end justify-between flex-[0.8] min-h-[160px] md:min-h-0 gap-3">
            <div>
              <p className="text-xs md:text-sm font-semibold text-black mb-2 md:mb-3">{c.delivery.label}</p>
              <h3 className="text-xl md:text-3xl font-bold text-black leading-6 md:leading-8">
                {c.delivery.h3[0]}
                <br />
                {c.delivery.h3[1]}
                <br />
                {c.delivery.h3[2]}
              </h3>
            </div>
            <a href={autoHref} target="_blank" rel="noreferrer" className="px-5 py-3 md:px-8 md:py-5 btn3d btn3d-light rounded-full text-black text-base md:text-xl font-bold whitespace-nowrap">
              {c.delivery.button}
            </a>
          </div>
        </div>
        <div style={reveal.getAnimStyle(3)} className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[350px] md:min-h-0">
          <img src={SECTION3_BG} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5 flex gap-1.5 md:gap-2">
            <a href="#steps" onClick={(e) => { e.preventDefault(); scrollToAnchor("#steps"); }} className="flex-1 bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52 hover:scale-[1.02] transition-transform">
              <h4 className="text-lg md:text-2xl font-bold text-black leading-5 md:leading-7">
                {c.delivery.card1[0]}
                <br />
                {c.delivery.card1[1]}
                <br />
                {c.delivery.card1[2]}
              </h4>
              <span className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center">
                <ArrowIcon />
              </span>
            </a>
            <a href="#steps" onClick={(e) => { e.preventDefault(); scrollToAnchor("#steps"); }} className="flex-1 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52 hover:scale-[1.02] transition-transform">
              <h4 className="text-lg md:text-2xl font-bold text-white leading-5 md:leading-7">
                {c.delivery.card2[0]}
                <br />
                {c.delivery.card2[1]}
                <br />
                {c.delivery.card2[2]}
              </h4>
              <span className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-white flex items-center justify-center text-white">
                <ArrowIcon className="text-white" />
              </span>
            </a>
          </div>
        </div>
      </div>
      <div id="steps" className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-1.5 md:gap-2 scroll-mt-20 md:scroll-mt-24">
        <div className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-5">{c.delivery.card1.join(" ")}</h3>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {c.delivery.steps.map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="w-9 h-9 shrink-0 rounded-full border border-black flex items-center justify-center text-sm font-bold">{i + 1}</span>
                <div>
                  <p className="font-bold">{s.t}</p>
                  <p className="text-sm text-neutral-700 mt-0.5">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl md:rounded-2xl bg-white border border-black/10 p-5 md:p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl md:text-3xl font-bold">{c.delivery.card2.join(" ")}</h3>
            <img src={KASPI} alt="Kaspi" className="w-14 h-14 md:w-16 md:h-16 rounded-2xl shrink-0 shadow-[0_8px_18px_rgba(241,70,53,0.35)]" />
          </div>
          <ul className="mt-5 flex flex-col gap-3">
            {c.delivery.pay.map((p) => {
              const kaspi = /kaspi/i.test(p);
              return (
                <li key={p} className="flex gap-3 items-center">
                  <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${kaspi ? "bg-[#F14635]" : "bg-black"}`}>✓</span>
                  <span className={`font-semibold ${kaspi ? "text-[#F14635]" : ""}`}>{p}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ brands

function BrandsStrip({ c }: { c: Content }) {
  return (
    <section className="w-full px-3 md:px-5 pt-4 md:pt-6">
      <div className="rounded-xl md:rounded-2xl border border-black/10 px-4 py-4 md:px-6 md:py-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mr-2">{c.brands.title}</span>
        {c.brands.list.map((b) => (
          <span key={b} className="text-base md:text-xl font-extrabold tracking-tight text-black/80">
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ photos

function PhotosSection({ c }: { c: Content }) {
  const reveal = useStaggeredReveal(6);
  return (
    <section
      id="photos"
      ref={(el) => {
        reveal.containerRef.current = el;
      }}
      className="w-full px-3 md:px-5 pt-6 md:pt-8 pb-1.5 md:pb-2 scroll-mt-20 md:scroll-mt-24"
    >
      <div className="flex items-end justify-between mb-3 md:mb-4 px-1">
        <h2 className="text-3xl md:text-5xl font-bold leading-none">{c.photos.title}</h2>
        <p className="hidden md:block text-sm font-semibold text-neutral-600">{c.photos.sub}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-2">
        {c.photos.items.map((p, i) => (
          <figure key={p.src} style={reveal.getAnimStyle(i)} className="relative rounded-xl md:rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100 group">
            <img src={`${BASE}${p.src}`} alt={p.caption} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <figcaption className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-white/85 backdrop-blur-md rounded-full px-3 py-1.5 text-xs md:text-sm font-semibold">{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ footer

function Footer({ c }: { c: Content }) {
  const mapHref = `https://www.google.com/maps/search/${encodeURIComponent(c.shop.address)}`;
  return (
    <footer id="contacts" className="w-full px-3 md:px-5 pt-6 md:pt-8 pb-24 md:pb-28 scroll-mt-20 md:scroll-mt-24">
      <div className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-10 md:pr-28 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-none">
              {c.shop.logoTop}
              <br />
              {c.shop.logoBottom}
            </div>
            <p className="text-sm font-medium mt-3">{c.shop.tagline}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">{c.footer.contacts}</p>
            <a href={c.shop.phoneHref} className="block text-xl md:text-2xl font-bold">
              {c.shop.phone}
            </a>
            <p className="text-sm md:text-base mt-2">{c.shop.address}</p>
            <p className="text-sm md:text-base mt-1">{c.shop.hours}</p>
          </div>
          {/* 3D-геометка на карте: ведёт на карту с адресом */}
          <a href={mapHref} target="_blank" rel="noreferrer" aria-label={c.footer.find} className="group shrink-0">
            <img src={PIN_MAP} alt="" className="w-24 md:w-28 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
          </a>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">{c.footer.find}</p>
            <p className="text-sm md:text-base">{c.shop.landmark}</p>
            <p className="text-sm md:text-base mt-4 font-semibold">{c.footer.promise}</p>
          </div>
          {/* 3D-кнопка телефона: звонок */}
          <a href={c.shop.phoneHref} aria-label={c.shop.phone} className="group shrink-0">
            <img src={PHONE_3D} alt="" className="w-20 md:w-24 object-contain drop-shadow-[0_10px_18px_rgba(37,211,102,0.3)] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
      <div className="mt-1.5 md:mt-2 rounded-xl md:rounded-2xl border border-dashed border-black/25 px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs md:text-sm text-neutral-700">
        <span>{c.ui.demoNote}</span>
        <a href={c.ui.demoByHref} target="_blank" rel="noreferrer" className="font-semibold text-black underline underline-offset-4 whitespace-nowrap">
          {c.ui.demoBy}
        </a>
      </div>
      <div className="px-2 pt-3 text-xs text-neutral-500">
        <span>{c.footer.about}</span>
      </div>
    </footer>
  );
}

// ------------------------------------------------------------------ floating

function Floating({ c, cart, onCart }: { c: Content; cart: Cart; onCart: () => void }) {
  return (
    <>
      <div className="fixed right-3 md:right-5 bottom-20 md:bottom-6 z-40 flex flex-col gap-2">
        <a href={c.shop.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="block w-14 h-14 md:w-[76px] md:h-[76px] transition-transform duration-300 hover:scale-110">
          <img src={WA_3D} alt="" className="w-full h-full drop-shadow-[0_12px_20px_rgba(37,211,102,0.4)]" />
        </a>
      </div>
      {cart.count > 0 && (
        <div className="md:hidden fixed left-3 right-3 bottom-3 z-40">
          <button onClick={onCart} className="w-full py-4 btn3d btn3d-dark rounded-full text-white text-sm font-bold flex items-center justify-center gap-3">
            <span>
              {c.ui.cart} · {cart.count}
            </span>
            <span className="tabular-nums">{fmtPrice(cart.total)}</span>
          </button>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ cart drawer

function CartDrawer({ c, cart, open, onClose }: { c: Content; cart: Cart; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", comment: "" });
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const lines = cart.lines.map((l) => ({ ...l, p: cart.byId[l.id] })).filter((l) => l.p);
  const deliveryFree = cart.total >= 10000;

  const waHref = () => {
    const rows = lines.map((l, i) => `${i + 1}. ${l.p.name}, ${l.p.size} × ${l.qty} = ${fmtPrice(l.p.price * l.qty)}`);
    const text = [
      c.ui.waGreeting,
      ...rows,
      `${c.ui.waTotal}: ${fmtPrice(cart.total)}${deliveryFree ? "" : " + 1 000 ₸"}`,
      `${c.ui.waDelivery}: ${form.address || "-"}`,
      `${form.name || ""} ${form.phone || ""}`.trim(),
      form.comment ? form.comment : "",
    ]
      .filter(Boolean)
      .join("\n");
    return `${c.shop.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className={`fixed inset-0 z-[90] overflow-hidden ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <aside className={`absolute top-0 right-0 h-full w-full md:w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
          <h3 className="text-2xl font-bold">
            {c.ui.cart} {cart.count > 0 && <span className="text-neutral-400 font-semibold text-lg">· {cart.count}</span>}
          </h3>
          <button onClick={onClose} aria-label={c.ui.close} className="w-9 h-9 rounded-full border border-black/15 flex items-center justify-center hover:bg-black hover:text-white transition-colors">
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <p className="text-neutral-600 py-10 text-center">{c.ui.cartEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-3 items-center">
                  <img src={`${BASE}${l.p.img}`} alt="" className="w-16 h-16 rounded-lg object-cover bg-[#F3F1EE] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">{l.p.name}</p>
                    <p className="text-xs text-neutral-500">
                      {l.p.size} · {fmtPrice(l.p.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-black/15">
                    <button onClick={() => cart.set(l.id, l.qty - 1)} className="w-8 h-8 font-bold" aria-label="-">
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                    <button onClick={() => cart.add(l.id)} className="w-8 h-8 font-bold" aria-label="+">
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {lines.length > 0 && (
            <form className="mt-6 flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input name="name" placeholder={c.ui.cartName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-black/15 bg-stone-50 outline-none focus:border-black" />
              <input name="phone" type="tel" placeholder={c.ui.cartPhone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-black/15 bg-stone-50 outline-none focus:border-black" />
              <input name="address" placeholder={c.ui.cartAddress} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-black/15 bg-stone-50 outline-none focus:border-black" />
              <textarea name="comment" rows={2} placeholder={c.ui.cartComment} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-black/15 bg-stone-50 outline-none focus:border-black resize-none" />
            </form>
          )}
        </div>
        {lines.length > 0 && (
          <div className="px-5 py-4 border-t border-black/10 bg-white">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">{c.ui.cartTotal}</span>
              <span className="text-2xl font-bold tabular-nums">{fmtPrice(cart.total)}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">{c.ui.cartDelivery}</p>
            <a href={waHref()} target="_blank" rel="noreferrer" className="mt-3 w-full py-4 btn3d btn3d-green rounded-full text-white text-sm font-bold flex items-center justify-center gap-2">
              <WhatsAppIcon />
              {c.ui.cartSend}
            </a>
            <p className="text-[11px] text-neutral-500 text-center mt-2">{c.ui.cartHint}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ------------------------------------------------------------------ category page

function CategoryPage({ c, cat, cart }: { c: Content; cat: Category; cart: Cart }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [cat.slug]);
  const items = c.products.filter((p) => p.cat === cat.slug);
  const others = c.categories.filter((x) => x.slug !== cat.slug);
  return (
    <main className="w-full px-3 md:px-5 pt-24 md:pt-28 pb-24 md:pb-10">
      <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }} className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black mb-4">
        <span className="rotate-180 inline-block">→</span> {c.ui.back}
      </a>
      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-1.5 md:gap-2">
        <div className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-10 flex flex-col justify-between min-h-[240px]">
          <h1 className="text-[clamp(2.4rem,6vw,5.5rem)] font-bold leading-[0.95]">{cat.name}</h1>
          <p className="text-base md:text-lg text-neutral-700 mt-6 max-w-xl">{cat.blurb}</p>
        </div>
        <div className="rounded-xl md:rounded-2xl overflow-hidden min-h-[240px]">
          <img src={`${BASE}${cat.img}`} alt="" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2 mt-1.5 md:mt-2">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} cart={cart} c={c} />
        ))}
      </div>
      <div className="mt-6 md:mt-8 px-1">
        <p className="text-xs md:text-sm text-neutral-600 mb-2">{c.ui.otherCategories}:</p>
        <div className="flex flex-wrap gap-2">
          {others.map((x) => (
            <a key={x.slug} href={`#/c/${x.slug}`} className="px-4 py-2 rounded-full border border-black text-xs md:text-sm font-semibold hover:bg-black hover:text-white transition-colors">
              {x.name}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

// ------------------------------------------------------------------ app

function readLang(): Lang {
  try {
    const v = localStorage.getItem("lang");
    if (v === "ru" || v === "kz") return v;
  } catch {}
  return "ru";
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [route, setRoute] = useState<Route>(parseRoute);
  const [cartOpen, setCartOpen] = useState(false);
  const c = CONTENT[lang];
  const cart = useCart(c);

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
    document.documentElement.lang = lang === "kz" ? "kk" : "ru";
    document.title = c.meta.title;
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute("content", c.meta.description);
  }, [lang, c]);

  useEffect(() => {
    const onHash = () => {
      const r = parseRoute();
      setRoute(r);
      if (r.kind === "home" && window.location.hash) window.setTimeout(() => scrollToAnchor(window.location.hash), 50);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const toggleLang = () => setLang((l) => (l === "ru" ? "kz" : "ru"));
  const cat = useMemo(() => (route.kind === "cat" ? c.categories.find((x) => x.slug === route.slug) : undefined), [route, c]);

  return (
    <div className="bg-white">
      <Navbar c={c} onLang={toggleLang} onCart={openCart} count={cart.count} route={route} />
      {route.kind === "home" || !cat ? (
        <>
          <HeroMosaic c={c} />
          <CatalogMosaic c={c} />
          <HitsSection c={c} cart={cart} />
          <DeliverySection c={c} />
          <BrandsStrip c={c} />
          <PhotosSection c={c} />
        </>
      ) : (
        <CategoryPage c={c} cat={cat} cart={cart} />
      )}
      <Footer c={c} />
      <Floating c={c} cart={cart} onCart={openCart} />
      <CartDrawer c={c} cart={cart} open={cartOpen} onClose={closeCart} />
    </div>
  );
}
