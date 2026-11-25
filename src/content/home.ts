import type { Locale } from "@/i18n/routing";
import type { ServiceId } from "./services";

// Structured content of the homepage (odd/tasks/site-build-experience.md, T4). Short labels and
// headings live in messages/*.json under "Home"; lists that the sections iterate live here. The
// demo store of the build stage and the working pieces live in home-stage.ts and home-pieces.ts.
// Text in square brackets is pending the client's data or authorization. Never replace it with
// invented numbers or quotes: fill in the real content, then drop the brackets.

type Localized<T> = Record<Locale, T>;
type Text = Localized<string>;

// Whether content still waiting for the client is published. With false (production until the data
// arrives), every unit that carries a placeholder is left out of the page: the whole sentence, list
// item, card or section, never just the bracketed token. The content stays here so it can be shown
// again by setting this to true. Placeholders in messages/*.json follow the same switch.
export const SHOW_PENDING_CONTENT: boolean = false;

// A step of a problem's diagram: how it is today and how it ends up. For a business that does not
// exist yet both are the same piece, which appears instead of being fixed.
export type DiagramNode = { before: Text; after: Text };

export type Problem = {
  title: Text;
  // Where the visitor is today ("Dónde estás" or "Problema").
  problem: Text;
  solution: Text;
  result: Text;
  // The line of work that solves it: its page is /servicios/[service].
  line: ServiceId;
  nodes: DiagramNode[];
};

const same = (es: string, en: string): DiagramNode => ({ before: { es, en }, after: { es, en } });
const fix = (before: Text, after: Text): DiagramNode => ({ before, after });

// "Estoy empezando": people who want to start a business online (S8). Problem 3 avoids any price
// positioning (L5): it talks about growing without rebuilding.
export const startingProblems: Problem[] = [
  {
    title: { es: "Tengo la idea, pero no sé por dónde empezar", en: "I have the idea, but I don't know where to start" },
    problem: {
      es: "No sabes si necesitas una web, una tienda o solo redes, y cada persona te dice algo distinto.",
      en: "You don't know whether you need a website, a store or just social media, and everyone tells you something different.",
    },
    solution: {
      es: "Empiezo por lo que vas a vender y a quién. Te digo qué necesitas ahora y qué puede esperar.",
      en: "I start with what you will sell and to whom. I tell you what you need now and what can wait.",
    },
    result: {
      es: "Un plan por fases que arranca con lo mínimo para empezar a vender.",
      en: "A plan in phases that starts with the minimum you need to start selling.",
    },
    line: "websites",
    nodes: [
      same("Tu idea", "Your idea"),
      same("A quién le vendes", "Who you sell to"),
      same("Lo que necesitas hoy", "What you need today"),
      same("Primera versión", "First version"),
    ],
  },
  {
    title: {
      es: "Quiero vender en línea, pero no sé qué plataforma elegir",
      en: "I want to sell online, but I don't know which platform to choose",
    },
    problem: {
      es: "Shopify, PrestaShop, WooCommerce, algo a la medida: todas prometen lo mismo y no sabes cuál te conviene.",
      en: "Shopify, PrestaShop, WooCommerce, something custom: they all promise the same and you don't know which one suits you.",
    },
    solution: {
      es: "Comparo las opciones con tu catálogo, tu presupuesto y la forma en que despachas.",
      en: "I compare the options against your catalog, your budget and the way you ship.",
    },
    result: {
      es: "Una tienda en la plataforma que tiene sentido para tu tamaño de hoy.",
      en: "A store on the platform that makes sense for your size today.",
    },
    line: "shopify",
    nodes: [
      same("Tu catálogo", "Your catalog"),
      same("La plataforma correcta", "The right platform"),
      same("Pagos y envíos", "Payments and shipping"),
      same("Primera venta", "First sale"),
    ],
  },
  {
    title: {
      es: "Quiero algo que crezca conmigo, no rehacerlo en un año",
      en: "I want something that grows with me, not to rebuild it in a year",
    },
    problem: {
      es: "Te da miedo lanzar algo que haya que tirar y hacer de nuevo justo cuando el negocio empiece a crecer.",
      en: "You are afraid of launching something you will have to throw away and redo just when the business starts to grow.",
    },
    solution: {
      es: "Construyo una primera versión pensada para crecer: lo que se hace hoy no se tira mañana.",
      en: "I build a first version designed to grow: what is built today is not thrown away tomorrow.",
    },
    result: {
      es: "Un sitio que lanzas pronto y amplías sin rehacerlo.",
      en: "A site you launch soon and extend without rebuilding it.",
    },
    line: "websites",
    nodes: [
      same("Versión 1", "Version 1"),
      same("Primeros clientes", "First customers"),
      same("Versión 2", "Version 2"),
      same("Crecer sin rehacer", "Grow without rebuilding"),
    ],
  },
  {
    title: { es: "Necesito que me tomen en serio desde el primer día", en: "I need to be taken seriously from day one" },
    problem: {
      es: "Eres nuevo en el mercado y sientes que sin una presencia profesional nadie confía en ti.",
      en: "You are new to the market and feel that without a professional presence nobody will trust you.",
    },
    solution: {
      es: "Armo un sitio con dominio propio, correo profesional y textos que explican claro qué haces.",
      en: "I build a site with your own domain, a professional email address and copy that clearly explains what you do.",
    },
    result: {
      es: "Una presencia que genera confianza aunque estés empezando.",
      en: "A presence that builds trust even while you are starting out.",
    },
    line: "websites",
    nodes: [
      same("Tu dominio", "Your domain"),
      same("Correo profesional", "Professional email"),
      same("Un sitio claro", "A clear site"),
      same("Confianza", "Trust"),
    ],
  },
  {
    title: { es: "No sé de tecnología y no quiero depender de nadie", en: "I'm not technical and I don't want to depend on anyone" },
    problem: {
      es: "Te preocupa que cada cambio pequeño dependa de llamar a alguien y esperar.",
      en: "You worry that every small change will mean calling someone and waiting.",
    },
    solution: {
      es: "Te explico cada decisión en lenguaje simple y te dejo un panel y una guía para manejarlo.",
      en: "I explain every decision in plain language and leave you an admin panel and a guide to run it.",
    },
    result: {
      es: "Manejas tu sitio tú mismo, y pides ayuda solo cuando de verdad la necesitas.",
      en: "You run your site yourself, and ask for help only when you really need it.",
    },
    line: "websites",
    nodes: [
      same("Tu sitio", "Your site"),
      same("Un panel simple", "A simple panel"),
      same("Una guía", "A guide"),
      same("Lo manejas tú", "You run it"),
    ],
  },
];

// "Ya tengo un negocio funcionando": the problems that were already on the home (S7).
export const problems: Problem[] = [
  {
    title: { es: "Tu web no representa lo que hace tu empresa", en: "Your website does not represent what your company does" },
    problem: {
      es: "La oferta cambió, la web no. Los clientes llegan con dudas que el sitio debería resolver y tú terminas explicándolo todo en cada llamada.",
      en: "Your offer changed, your website did not. Customers arrive with questions the site should answer, and you end up explaining everything on every call.",
    },
    solution: {
      es: "Defino qué necesita saber tu cliente, en qué orden, y diseño y construyo el sitio alrededor de eso.",
      en: "I define what your customer needs to know, in what order, and design and build the site around it.",
    },
    result: {
      es: "Que explique tu oferta por ti y que tu equipo pueda actualizar sin depender de terceros.",
      en: "One that explains your offer for you and that your team can update without depending on others.",
    },
    line: "websites",
    nodes: [
      same("Tu oferta de hoy", "Your offer today"),
      fix({ es: "Un sitio de hace años", en: "A site from years ago" }, { es: "Un sitio que la explica", en: "A site that explains it" }),
      fix({ es: "Cliente con dudas", en: "Customer with doubts" }, { es: "Cliente que llega decidido", en: "Customer who arrives decided" }),
    ],
  },
  {
    title: { es: "Tienes visitas, pero no contactos", en: "You get visits, but no leads" },
    problem: {
      es: "Llega tráfico desde pauta, redes o buscadores, pero los contactos no aparecen y no sabes dónde se pierden.",
      en: "Traffic arrives from ads, social media or search engines, but leads do not show up and you do not know where they drop off.",
    },
    solution: {
      es: "Reviso mensaje, página, formulario y seguimiento; rediseño el flujo y mido cada paso.",
      en: "I review the message, page, form and follow-up; I redesign the flow and measure every step.",
    },
    result: {
      es: "Un embudo medido para tomar decisiones con datos y mejorar la conversión de forma sostenida.",
      en: "A measured funnel to make decisions with data and improve conversion steadily.",
    },
    line: "funnels",
    nodes: [
      same("Pauta y redes", "Ads and social"),
      fix({ es: "Página genérica", en: "Generic page" }, { es: "Página por campaña", en: "A page per campaign" }),
      fix({ es: "Formulario largo", en: "Long form" }, { es: "Formulario corto", en: "Short form" }),
      fix({ es: "¿Contacto?", en: "A lead?" }, { es: "Contacto medido", en: "Measured lead" }),
    ],
  },
  {
    title: {
      es: "Tu operación depende de hojas de cálculo y copiar y pegar",
      en: "Your operations depend on spreadsheets and copy and paste",
    },
    problem: {
      es: "Procesos clave viven en archivos, correos y la memoria de algunas personas. Cada pedido o reporte toma más tiempo del que debería.",
      en: "Key processes live in files, emails and a few people's memory. Every order or report takes longer than it should.",
    },
    solution: {
      es: "Modelo el proceso real y construyo una aplicación interna o una automatización que lo ejecute.",
      en: "I model the real process and build an internal application or an automation that runs it.",
    },
    result: {
      es: "Menos errores de transcripción y un proceso que no depende de que una persona específica esté disponible.",
      en: "Fewer transcription errors and a process that does not depend on one specific person being available.",
    },
    line: "apps",
    nodes: [
      same("Pedido", "Order"),
      fix({ es: "Excel", en: "Spreadsheet" }, { es: "Aplicación", en: "Application" }),
      fix({ es: "Correo", en: "Email" }, { es: "Aprobación", en: "Approval" }),
      fix({ es: "Reporte a mano", en: "Manual report" }, { es: "Reporte automático", en: "Automatic report" }),
    ],
  },
  {
    title: { es: "Tus sistemas no se hablan entre sí", en: "Your systems do not talk to each other" },
    problem: {
      es: "La tienda, el inventario, la facturación y el CRM tienen versiones distintas del mismo dato.",
      en: "Your store, inventory, invoicing and CRM hold different versions of the same data.",
    },
    solution: {
      es: "Mapeo qué dato vive dónde y conecto los sistemas por API, con sincronizaciones y alertas cuando algo falla.",
      en: "I map which data lives where and connect the systems through APIs, with syncs and alerts when something fails.",
    },
    result: {
      es: "Información consistente entre sistemas y visibilidad inmediata cuando una sincronización falla.",
      en: "Consistent information across systems and immediate visibility when a sync fails.",
    },
    line: "plugins",
    nodes: [
      same("Tienda", "Store"),
      same("Inventario", "Inventory"),
      same("Facturación", "Invoicing"),
      same("CRM", "CRM"),
    ],
  },
  {
    title: { es: "Tu plataforma es difícil de cambiar", en: "Your platform is hard to change" },
    problem: {
      es: "Cada ajuste toma semanas, rompe otra cosa o nadie se atreve a tocar el código.",
      en: "Every adjustment takes weeks, breaks something else, or nobody dares to touch the code.",
    },
    solution: {
      es: "Reviso el estado técnico, priorizo y mejoro por fases sin detener la operación.",
      en: "I review the technical state, prioritize, and improve in phases without stopping operations.",
    },
    result: {
      es: "Una plataforma que vuelve a evolucionar al ritmo del negocio, con documentación y control.",
      en: "A platform that evolves again at the pace of the business, with documentation and control.",
    },
    line: "evolution",
    nodes: [
      same("Un cambio", "A change"),
      fix({ es: "Código frágil", en: "Fragile code" }, { es: "Código documentado", en: "Documented code" }),
      fix({ es: "¿Rompe algo?", en: "Will it break?" }, { es: "Pruebas", en: "Tests" }),
      fix({ es: "Semanas", en: "Weeks" }, { es: "Producción", en: "Production" }),
    ],
  },
];

// Short technology tags per line of work, shown under its description on the home. A line without
// tags (for example one added later to services.ts) simply shows none.
export const lineTags: Partial<Record<string, Text>> = {
  websites: { es: "Next.js · panel editable · SEO técnico", en: "Next.js · editable panel · technical SEO" },
  shopify: { es: "Online Store 2.0 · Liquid · apps", en: "Online Store 2.0 · Liquid · apps" },
  prestashop: { es: "módulos · catálogo · pagos locales", en: "modules · catalog · local payments" },
  wordpress: { es: "bloques · WooCommerce · rendimiento", en: "blocks · WooCommerce · performance" },
  apps: { es: "React · APIs · bases de datos", en: "React · APIs · databases" },
  plugins: { es: "hooks · webhooks · ERP y CRM", en: "hooks · webhooks · ERP and CRM" },
};

export type Phase = { title: Text; text: Text; pending?: Text };

// The process of the approved prototype, shown as a terminal. A phase's `pending` note stays hidden
// until it is confirmed (SHOW_PENDING_CONTENT); the phase itself always shows.
export const phases: Phase[] = [
  {
    title: { es: "Descubrimiento", en: "Discovery" },
    text: {
      es: "Entiendo el negocio, a quién le vendes y qué tiene que pasar para que funcione.",
      en: "I understand the business, who you sell to and what has to happen for it to work.",
    },
  },
  {
    title: { es: "Arquitectura", en: "Architecture" },
    text: {
      es: "Defino páginas, datos e integraciones antes de dibujar nada.",
      en: "I define pages, data and integrations before drawing anything.",
    },
  },
  {
    title: { es: "Diseño", en: "Design" },
    text: {
      es: "Un prototipo navegable que apruebas antes de que escriba código.",
      en: "A clickable prototype you approve before I write any code.",
    },
  },
  {
    title: { es: "Desarrollo", en: "Development" },
    text: {
      es: "Primero una versión lista para vender; después, mejoras por fases que pruebas en un enlace real.",
      en: "First a version that is ready to sell; then improvements in phases that you test on a real link.",
    },
  },
  {
    title: { es: "Lanzamiento", en: "Launch" },
    text: {
      es: "SEO técnico, analítica, velocidad y publicación sin sorpresas.",
      en: "Technical SEO, analytics, speed and a launch without surprises.",
    },
  },
  {
    title: { es: "Acompañamiento", en: "Follow-up" },
    text: {
      es: "Soporte y mejoras cuando el sitio ya está vendiendo.",
      en: "Support and improvements once the site is already selling.",
    },
    pending: { es: "[Confirmar alcance de soporte]", en: "[Confirm support scope]" },
  },
];

// The "¿Qué construimos?" chips. Picking one shows its message and preselects the project type of
// the contact form (src/lib/home/project-type.ts); the contact action stores one project type, so an
// intent without a service of its own sends "other".
export type ContactIntent = { id: string; label: Text; message: Text; projectType: ServiceId | "other" };

export const contactIntents: ContactIntent[] = [
  {
    id: "starting",
    label: { es: "Estoy empezando mi negocio", en: "I'm starting my business" },
    message: {
      es: "Cuéntame tu idea, qué quieres vender y con qué cuentas para arrancar. Te propongo la primera versión que te permite empezar a vender, y lo que puede esperar.",
      en: "Tell me your idea, what you want to sell and what you have to get started. I propose the first version that lets you start selling, and what can wait.",
    },
    projectType: "other",
  },
  {
    id: "store",
    label: { es: "Una tienda en línea", en: "An online store" },
    message: {
      es: "Cuéntame qué vendes, cómo lo vendes hoy y qué te frena. Con eso te digo si conviene Shopify, PrestaShop o algo a la medida.",
      en: "Tell me what you sell, how you sell it today and what holds you back. With that I tell you whether Shopify, PrestaShop or something custom makes sense.",
    },
    projectType: "other",
  },
  {
    id: "website",
    label: { es: "Un sitio web", en: "A website" },
    message: {
      es: "Cuéntame a quién le hablas y qué quieres que haga esa persona al llegar. El diseño sale de ahí.",
      en: "Tell me who you are talking to and what you want that person to do when they arrive. The design comes from there.",
    },
    projectType: "websites",
  },
  {
    id: "app",
    label: { es: "Una aplicación", en: "An application" },
    message: {
      es: "Cuéntame qué proceso quieres ordenar y quién lo usa a diario. Empiezo por la parte que más tiempo te quita.",
      en: "Tell me which process you want to organize and who uses it every day. I start with the part that takes up most of your time.",
    },
    projectType: "apps",
  },
  {
    id: "plugin",
    label: { es: "Un plugin o integración", en: "A plugin or integration" },
    message: {
      es: "Cuéntame qué sistemas tienen que hablar entre sí y qué haces hoy a mano para conectarlos.",
      en: "Tell me which systems need to talk to each other and what you do by hand today to connect them.",
    },
    projectType: "plugins",
  },
];
