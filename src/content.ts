// Все тексты и товары демо-зоомагазина. Две версии: ru и kz.
// Магазин вымышленный, товары и цены - ориентир для показа. Все контакты ведут на AR Marketing.

export type Lang = "ru" | "kz";

export type Category = { slug: string; name: string; short: string; img: string; blurb: string };
export type Product = {
  id: string;
  cat: string; // slug категории
  name: string;
  size: string; // фасовка
  price: number; // ₸
  oldPrice?: number; // если акция
  img: string;
  tag?: string; // «Хит», «Акция»
};

export type Content = {
  meta: { title: string; description: string };
  shop: {
    name: string;
    logoTop: string;
    logoBottom: string;
    tagline: string;
    city: string;
    address: string;
    landmark: string;
    phone: string;
    phoneHref: string;
    hours: string;
    whatsapp: string;
    instagram: string;
    telegram: string;
  };
  ui: {
    menu: string;
    close: string;
    cart: string;
    order: string;
    nav: { label: string; href: string }[];
    back: string;
    addToCart: string;
    inCart: string;
    allCategories: string;
    otherCategories: string;
    brandsAll: string;
    cartEmpty: string;
    cartTotal: string;
    cartDelivery: string;
    cartName: string;
    cartPhone: string;
    cartAddress: string;
    cartComment: string;
    cartSend: string;
    cartHint: string;
    waGreeting: string;
    waOrder: string;
    waDelivery: string;
    waTotal: string;
    demoNote: string;
    demoBy: string;
    demoByHref: string;
    langSwitch: string;
    currency: string;
  };
  featureBars: string[];
  hero: { top: string; top2: string; label: string; h1: [string, string]; right: string };
  catalog: { title: string; sub: string; text: string; text2: string; button: string; big: [string, string] };
  hits: { title: string; sub: string };
  delivery: {
    h2: [string, string];
    sub: string;
    label: string;
    h3: [string, string, string];
    button: string;
    card1: [string, string, string];
    card2: [string, string, string];
    steps: { t: string; d: string }[];
    pay: string[];
  };
  brands: { title: string; list: string[] };
  photos: { title: string; sub: string; items: { src: string; caption: string }[] };
  footer: { contacts: string; find: string; about: string; promise: string };
  categories: Category[];
  products: Product[];
};

const WA = "https://wa.me/77782882523";

const shopBase = {
  name: "ZOO ДҮКЕН",
  logoTop: "ZOO",
  logoBottom: "ДҮКЕН",
  // Демо: все контакты ведут на AR Marketing (заказ такого сайта), не на вымышленный магазин
  phone: "+7 (778) 288 25 23",
  phoneHref: "tel:+77782882523",
  whatsapp: WA,
  instagram: "",
  telegram: "",
};

// Товары: одинаковые id, цены и картинки для обоих языков, разные названия
type PBase = { id: string; cat: string; size: string; price: number; oldPrice?: number; img: string; hit?: boolean; sale?: boolean };
const P: PBase[] = [
  { id: "dog-dry-15", cat: "dogs", size: "15 кг", price: 32900, oldPrice: 36900, img: "p_dog_dry", hit: true, sale: true },
  { id: "dog-dry-3", cat: "dogs", size: "3 кг", price: 8900, img: "p_dog_dry" },
  { id: "dog-treats", cat: "dogs", size: "500 г", price: 2400, img: "p_treats", hit: true },
  { id: "dog-leash", cat: "acc", size: "2 м", price: 4900, img: "p_leash" },
  { id: "dog-bed", cat: "acc", size: "60 см", price: 12900, oldPrice: 15900, img: "p_bed", sale: true },
  { id: "cat-dry-4", cat: "cats", size: "4 кг", price: 14900, img: "p_cat_dry", hit: true },
  { id: "cat-dry-10", cat: "cats", size: "10 кг", price: 31900, oldPrice: 34900, img: "p_cat_dry", sale: true },
  { id: "cat-wet", cat: "cats", size: "85 г × 12", price: 5900, img: "p_cat_wet", hit: true },
  { id: "cat-litter", cat: "cats", size: "10 л", price: 4200, img: "p_litter", hit: true },
  { id: "aqua-filter", cat: "aqua", size: "до 100 л", price: 9800, img: "p_filter" },
  { id: "aqua-gravel", cat: "aqua", size: "5 кг", price: 2900, img: "p_filter" },
  { id: "hamster-cage", cat: "small", size: "50×35 см", price: 16900, img: "p_cage", hit: true },
  { id: "bird-seed", cat: "small", size: "1 кг", price: 1900, img: "p_bird" },
  { id: "vitamins", cat: "pharm", size: "120 таб.", price: 6400, img: "p_vitamins" },
  { id: "flea-drops", cat: "pharm", size: "3 пипетки", price: 5200, img: "p_vitamins", hit: true },
  { id: "shampoo", cat: "acc", size: "500 мл", price: 3600, img: "p_shampoo" },
];

const NAMES: Record<Lang, Record<string, string>> = {
  ru: {
    "dog-dry-15": "Сухой корм для взрослых собак, курица",
    "dog-dry-3": "Сухой корм для щенков, ягнёнок и рис",
    "dog-treats": "Лакомство для собак, косточки с говядиной",
    "dog-leash": "Поводок с ошейником, нейлон",
    "dog-bed": "Лежанка круглая, мягкий борт",
    "cat-dry-4": "Сухой корм для стерилизованных кошек",
    "cat-dry-10": "Сухой корм для кошек, лосось",
    "cat-wet": "Влажный корм для кошек, паучи, набор",
    "cat-litter": "Наполнитель комкующийся, без запаха",
    "aqua-filter": "Фильтр внутренний для аквариума",
    "aqua-gravel": "Грунт для аквариума, белый",
    "hamster-cage": "Клетка для хомяка с домиком и колесом",
    "bird-seed": "Зерновая смесь для волнистых попугаев",
    "vitamins": "Витамины для кошек и собак, комплекс",
    "flea-drops": "Капли от блох и клещей, 3 пипетки",
    "shampoo": "Шампунь для собак и кошек с щёткой",
  },
  kz: {
    "dog-dry-15": "Ересек иттерге құрғақ жем, тауық еті",
    "dog-dry-3": "Күшіктерге құрғақ жем, қозы еті мен күріш",
    "dog-treats": "Иттерге тәтті, сиыр етті сүйекшелер",
    "dog-leash": "Қарғыбауы бар жетек, нейлон",
    "dog-bed": "Дөңгелек төсеніш, жұмсақ жиек",
    "cat-dry-4": "Стерилденген мысықтарға құрғақ жем",
    "cat-dry-10": "Мысықтарға құрғақ жем, лосось",
    "cat-wet": "Мысықтарға ылғал жем, пауч жиынтығы",
    "cat-litter": "Кесек түзетін толтырғыш, иіссіз",
    "aqua-filter": "Аквариумға ішкі сүзгі",
    "aqua-gravel": "Аквариум топырағы, ақ",
    "hamster-cage": "Үйшігі мен дөңгелегі бар хомяк торы",
    "bird-seed": "Толқынды тотықұстарға дән қоспасы",
    "vitamins": "Мысықтар мен иттерге дәрумендер кешені",
    "flea-drops": "Бүрге мен кенеге қарсы тамшы, 3 пипетка",
    "shampoo": "Иттер мен мысықтарға сусабын, щёткамен",
  },
};

function products(lang: Lang): Product[] {
  return P.map((p) => ({
    id: p.id,
    cat: p.cat,
    name: NAMES[lang][p.id],
    size: p.size,
    price: p.price,
    oldPrice: p.oldPrice,
    img: `img/${p.img}.webp`,
    tag: p.sale ? (lang === "ru" ? "Акция" : "Акция") : p.hit ? (lang === "ru" ? "Хит" : "Хит") : undefined,
  }));
}

const CAT_IMG: Record<string, string> = { dogs: "c_dogs", cats: "c_cats", aqua: "c_aqua", small: "c_small", acc: "c_acc", pharm: "c_pharm" };

function cats(list: { slug: string; name: string; short: string; blurb: string }[]): Category[] {
  return list.map((c) => ({ ...c, img: `img/${CAT_IMG[c.slug]}.webp` }));
}

const PHOTOS = [
  { src: "img/ph_vitrina.webp", ru: "Магазин на Сатпаева", kz: "Сәтбаев көшесіндегі дүкен" },
  { src: "img/s3img2.webp", ru: "Корма: 40 брендов", kz: "Жемдер: 40 бренд" },
  { src: "img/s3img1.webp", ru: "Аквариумистика", kz: "Аквариумистика" },
  { src: "img/ph_gryzuny.webp", ru: "Грызуны и птицы", kz: "Кеміргіштер мен құстар" },
  { src: "img/ph_gruming.webp", ru: "Груминг-кабинет", kz: "Груминг кабинеті" },
  { src: "img/ph_kassa.webp", ru: "Касса и консультация", kz: "Касса және кеңес" },
];

// ---------------------------------------------------------------- RU
const ru: Content = {
  meta: {
    title: "Зоомагазин ZOO ДҮКЕН | Атырау, доставка сегодня",
    description:
      "Зоомагазин в Атырау: корма для собак и кошек, аквариумистика, грызуны и птицы, аксессуары, ветаптека. Доставка по Атырау в день заказа, все цены на сайте, заказ в WhatsApp.",
  },
  shop: {
    ...shopBase,
    tagline: "зоомагазин в Атырау, доставка сегодня",
    city: "Атырау",
    address: "ул. Сатпаева, 15, Атырау",
    landmark: "Рядом с ТРЦ «Атырау», парковка у входа",
    hours: "Ежедневно 9:00-21:00",
  },
  ui: {
    menu: "Меню",
    close: "Закрыть",
    cart: "Корзина",
    order: "Заказать",
    nav: [
      { label: "Каталог", href: "#catalog" },
      { label: "Акции", href: "#hits" },
      { label: "Доставка", href: "#delivery" },
      { label: "Фото", href: "#photos" },
      { label: "Контакты", href: "#contacts" },
    ],
    back: "На главную",
    addToCart: "В корзину",
    inCart: "В корзине",
    allCategories: "Все категории",
    otherCategories: "Другие категории",
    brandsAll: "Все бренды",
    cartEmpty: "Корзина пустая. Добавьте товары из каталога.",
    cartTotal: "Итого",
    cartDelivery: "Доставка по Атырау: бесплатно от 10 000 ₸, иначе 1 000 ₸",
    cartName: "Ваше имя",
    cartPhone: "Телефон",
    cartAddress: "Адрес доставки (или «самовывоз»)",
    cartComment: "Комментарий (необязательно)",
    cartSend: "Заказать в WhatsApp",
    cartHint: "Откроется WhatsApp с готовым списком. Оплата при получении: Kaspi или наличные.",
    waGreeting: "Здравствуйте! Хочу заказать в ZOO ДҮКЕН:",
    waOrder: "Заказ",
    waDelivery: "Доставка",
    waTotal: "Итого",
    demoNote: "Это шаблон сайта, показан как пример. Магазин вымышленный, товары и цены условные, любые совпадения случайны. Все контакты ведут разработчику сайта.",
    demoBy: "Заказать такой сайт: ТОО «AR Marketing», Астана, +7 778 288 25 23",
    demoByHref: WA,
    langSwitch: "ҚАЗ",
    currency: "₸",
  },
  featureBars: ["Доставка по Атырау сегодня", "Все цены на сайте", "Подбор корма бесплатно"],
  hero: {
    top: "Корма, аксессуары, аквариумистика, ветаптека",
    top2: "Для собак, кошек, грызунов, птиц и рыб",
    label: "Зоомагазин в Атырау",
    h1: ["ZOO", "ДҮКЕН"],
    right: "Заказ в WhatsApp за минуту",
  },
  catalog: {
    title: "Каталог",
    sub: "6 отделов, более 2 000 товаров в наличии",
    text: "Не нашли нужный корм?",
    text2: "Напишите, привезём под заказ за 2-3 дня.",
    button: "Написать",
    big: ["Доставка", "сегодня"],
  },
  hits: { title: "Хиты и акции", sub: "Что берут чаще всего на этой неделе" },
  delivery: {
    h2: ["Доставка", "по Атырау"],
    sub: "Заказ до 15:00 привозим в тот же день. От 10 000 ₸ бесплатно",
    label: "Автозаказ корма",
    h3: ["Напомним,", "когда корм", "заканчивается"],
    button: "Подключить",
    card1: ["Как", "заказать", "за минуту"],
    card2: ["Оплата", "Kaspi или", "наличными"],
    steps: [
      { t: "Соберите корзину", d: "Добавьте товары на сайте, укажите адрес." },
      { t: "Отправьте в WhatsApp", d: "Список сам подставится в сообщение, вам остаётся нажать «Отправить»." },
      { t: "Подтверждение", d: "Ответим за 10 минут, уточним время." },
      { t: "Доставка", d: "Курьер привезёт сегодня, оплата при получении." },
    ],
    pay: ["Kaspi QR / перевод", "Наличные курьеру", "Kaspi Red в магазине"],
  },
  brands: { title: "Бренды в наличии", list: ["Royal Canin", "Pro Plan", "Hill's", "Acana", "Monge", "Brit", "Farmina", "Tetra", "Trixie", "Bayer"] },
  photos: {
    title: "Наш магазин",
    sub: "Живые фото, без стока",
    items: PHOTOS.map((p) => ({ src: p.src, caption: p.ru })),
  },
  footer: {
    contacts: "Контакты",
    find: "Как нас найти",
    about: "Зоомагазин ZOO ДҮКЕН в Атырау",
    promise: "Доставка по городу в день заказа",
  },
  categories: cats([
    { slug: "dogs", name: "Корм для собак", short: "Собаки", blurb: "Сухие и влажные корма, лакомства для щенков и взрослых собак. Подберём по породе и возрасту." },
    { slug: "cats", name: "Корм для кошек", short: "Кошки", blurb: "Корма для котят, взрослых и стерилизованных кошек, паучи, наполнители." },
    { slug: "aqua", name: "Аквариумистика", short: "Аквариум", blurb: "Аквариумы, фильтры, грунт, корм для рыб, декор и живые растения." },
    { slug: "small", name: "Грызуны и птицы", short: "Грызуны\nи птицы", blurb: "Клетки, корма, сено, поилки для хомяков, кроликов, попугаев." },
    { slug: "acc", name: "Аксессуары", short: "Аксессуары", blurb: "Поводки, лежанки, миски, игрушки, переноски, уход за шерстью." },
    { slug: "pharm", name: "Ветаптека", short: "Ветаптека", blurb: "Витамины, капли от блох и клещей, антигельминтики, уход за зубами и ушами." },
  ]),
  products: products("ru"),
};

// ---------------------------------------------------------------- KZ
const kz: Content = {
  meta: {
    title: "ZOO ДҮКЕН зоодүкені | Атырау, бүгін жеткізу",
    description:
      "Атыраудағы зоодүкен: иттер мен мысықтарға жем, аквариумистика, кеміргіштер мен құстар, аксессуарлар, ветдәріхана. Атырау бойынша тапсырыс күні жеткізу, барлық бағалар сайтта, WhatsApp арқылы тапсырыс.",
  },
  shop: {
    ...shopBase,
    tagline: "Атыраудағы зоодүкен, бүгін жеткізу",
    city: "Атырау",
    address: "Сәтбаев көшесі, 15, Атырау",
    landmark: "«Атырау» СОО жанында, кіреберісте тұрақ",
    hours: "Күн сайын 9:00-21:00",
  },
  ui: {
    menu: "Мәзір",
    close: "Жабу",
    cart: "Себет",
    order: "Тапсырыс беру",
    nav: [
      { label: "Каталог", href: "#catalog" },
      { label: "Акциялар", href: "#hits" },
      { label: "Жеткізу", href: "#delivery" },
      { label: "Фото", href: "#photos" },
      { label: "Байланыс", href: "#contacts" },
    ],
    back: "Басты бетке",
    addToCart: "Себетке",
    inCart: "Себетте",
    allCategories: "Барлық санаттар",
    otherCategories: "Басқа санаттар",
    brandsAll: "Барлық брендтер",
    cartEmpty: "Себет бос. Каталогтан тауар қосыңыз.",
    cartTotal: "Барлығы",
    cartDelivery: "Атырау бойынша жеткізу: 10 000 ₸-ден тегін, әйтпесе 1 000 ₸",
    cartName: "Атыңыз",
    cartPhone: "Телефон",
    cartAddress: "Жеткізу мекенжайы (немесе «өзім аламын»)",
    cartComment: "Пікір (міндетті емес)",
    cartSend: "WhatsApp-та тапсырыс беру",
    cartHint: "Дайын тізіммен WhatsApp ашылады. Төлем алғанда: Kaspi немесе қолма-қол.",
    waGreeting: "Сәлеметсіз бе! ZOO ДҮКЕН-нен тапсырыс бергім келеді:",
    waOrder: "Тапсырыс",
    waDelivery: "Жеткізу",
    waTotal: "Барлығы",
    demoNote: "Бұл сайт шаблоны, мысал ретінде көрсетілген. Дүкен ойдан шығарылған, тауарлар мен бағалар шартты, кез келген сәйкестік кездейсоқ. Барлық байланыстар сайт әзірлеушісіне жетеді.",
    demoBy: "Осындай сайтқа тапсырыс беру: «AR Marketing» ЖШС, Астана, +7 778 288 25 23",
    demoByHref: WA,
    langSwitch: "РУС",
    currency: "₸",
  },
  featureBars: ["Атырау бойынша бүгін жеткізу", "Барлық бағалар сайтта", "Жем таңдау тегін"],
  hero: {
    top: "Жемдер, аксессуарлар, аквариумистика, ветдәріхана",
    top2: "Иттер, мысықтар, кеміргіштер, құстар мен балықтарға",
    label: "Атыраудағы зоодүкен",
    h1: ["ZOO", "ДҮКЕН"],
    right: "WhatsApp-та бір минутта тапсырыс",
  },
  catalog: {
    title: "Каталог",
    sub: "6 бөлім, қоймада 2 000-нан астам тауар",
    text: "Керек жем табылмады ма?",
    text2: "Жазыңыз, 2-3 күнде тапсырыспен әкелеміз.",
    button: "Жазу",
    big: ["Бүгін", "жеткізу"],
  },
  hits: { title: "Хиттер мен акциялар", sub: "Осы аптада ең көп алынатындар" },
  delivery: {
    h2: ["Атырау бойынша", "жеткізу"],
    sub: "15:00-ге дейінгі тапсырысты сол күні әкелеміз. 10 000 ₸-ден тегін",
    label: "Жемге автотапсырыс",
    h3: ["Жем", "таусылғанда", "еске саламыз"],
    button: "Қосу",
    card1: ["Бір минутта", "қалай", "тапсырыс беру"],
    card2: ["Төлем", "Kaspi немесе", "қолма-қол"],
    steps: [
      { t: "Себет жинаңыз", d: "Сайтта тауар қосып, мекенжайды көрсетіңіз." },
      { t: "WhatsApp-қа жіберіңіз", d: "Тізім хабарламаға өзі түседі, «Жіберу» басу ғана қалады." },
      { t: "Растау", d: "10 минутта жауап беріп, уақытты нақтылаймыз." },
      { t: "Жеткізу", d: "Курьер бүгін әкеледі, төлем алғанда." },
    ],
    pay: ["Kaspi QR / аударым", "Курьерге қолма-қол", "Дүкенде Kaspi Red"],
  },
  brands: { title: "Қоймадағы брендтер", list: ["Royal Canin", "Pro Plan", "Hill's", "Acana", "Monge", "Brit", "Farmina", "Tetra", "Trixie", "Bayer"] },
  photos: {
    title: "Біздің дүкен",
    sub: "Нақты фото, стоксыз",
    items: PHOTOS.map((p) => ({ src: p.src, caption: p.kz })),
  },
  footer: {
    contacts: "Байланыс",
    find: "Бізді қалай табуға болады",
    about: "Атыраудағы ZOO ДҮКЕН зоодүкені",
    promise: "Қала бойынша тапсырыс күні жеткізу",
  },
  categories: cats([
    { slug: "dogs", name: "Иттерге жем", short: "Иттер", blurb: "Күшіктер мен ересек иттерге құрғақ және ылғал жемдер, тәттілер. Тұқымы мен жасына қарай таңдаймыз." },
    { slug: "cats", name: "Мысықтарға жем", short: "Мысықтар", blurb: "Марғаулар, ересек және стерилденген мысықтарға жем, пауч, толтырғыштар." },
    { slug: "aqua", name: "Аквариумистика", short: "Аквариум", blurb: "Аквариумдар, сүзгілер, топырақ, балық жемі, декор және тірі өсімдіктер." },
    { slug: "small", name: "Кеміргіштер мен құстар", short: "Кеміргіштер\nмен құстар", blurb: "Хомяк, қоян, тотықұсқа торлар, жем, шөп, суарғыштар." },
    { slug: "acc", name: "Аксессуарлар", short: "Аксессуарлар", blurb: "Жетектер, төсеніштер, тостағандар, ойыншықтар, тасымалдағыштар, жүн күтімі." },
    { slug: "pharm", name: "Ветдәріхана", short: "Ветдәріхана", blurb: "Дәрумендер, бүрге мен кенеге қарсы тамшы, құрт дәрілері, тіс пен құлақ күтімі." },
  ]),
  products: products("kz"),
};

export const CONTENT: Record<Lang, Content> = { ru, kz };
export const shop = shopBase;

export function fmtPrice(n: number): string {
  return n.toLocaleString("ru-RU").replace(/ |\s/g, " ") + " ₸";
}
