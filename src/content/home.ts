import type { Locale } from "@/i18n/routing";
import type { ServiceId } from "./services";

// Structured content of the homepage (design S10 in odd/tasks/nextjs-platform.md). Short labels and
// headings live in messages/*.json under "Home"; lists that the sections iterate live here.
// Text in square brackets is pending the client's data or authorization (A13): keep it visible
// until the real content arrives, and never replace it with invented numbers or quotes.

type Localized<T> = Record<Locale, T>;
type Text = Localized<string>;

// The applied AI card is optional in the design ("pending decision"). Set to false to hide it.
export const SHOW_APPLIED_AI = true;

export type HeroLayer = { name: Text; description: Text };

// Ordered from the screen down to the integrations, as the legend numbers them (01 to 04).
export const heroLayers: HeroLayer[] = [
  {
    name: { es: "Interfaz", en: "Interface" },
    description: { es: "Lo que ven y usan tus clientes y tu equipo.", en: "What your customers and your team see and use." },
  },
  {
    name: { es: "Lógica", en: "Logic" },
    description: { es: "Las reglas de tu negocio, convertidas en procesos.", en: "Your business rules, turned into processes." },
  },
  {
    name: { es: "Datos", en: "Data" },
    description: { es: "Información ordenada, consistente y tuya.", en: "Information that is organized, consistent and yours." },
  },
  {
    name: { es: "Integraciones", en: "Integrations" },
    description: { es: "Conexión con pagos, inventario, ERP y CRM.", en: "Connections to payments, inventory, ERP and CRM." },
  },
];

export type Audience = { title: Text; text: Text };

export const audiences: Audience[] = [
  {
    title: { es: "Mejorar tu operación", en: "Improve your operations" },
    text: { es: "Menos trabajo manual y sistemas que se hablan entre sí.", en: "Less manual work and systems that talk to each other." },
  },
  {
    title: { es: "Vender online", en: "Sell online" },
    text: { es: "Tiendas y funnels pensados para convertir visitas en ventas.", en: "Stores and funnels built to turn visits into sales." },
  },
  {
    title: { es: "Lanzar algo nuevo", en: "Launch something new" },
    text: { es: "Del alcance inicial a una plataforma en producción.", en: "From the first scope to a platform in production." },
  },
];

export type ServiceLineId = "websites" | "commerce" | "platforms" | "funnels" | "integrations" | "evolution";

export type ServiceLine = {
  id: ServiceLineId;
  name: Text;
  kind: Text;
  summary: Text;
  when: Text;
  deliverables: { text: Text; pending?: Text }[];
  // The steps of the flow schema; keyNode is the highlighted one.
  flow: Localized<string[]>;
  keyNode: number;
  caption: Text;
};

export const serviceLines: ServiceLine[] = [
  {
    id: "websites",
    name: { es: "Sitios web", en: "Websites" },
    kind: { es: "Presencia y marca", en: "Presence and brand" },
    summary: {
      es: "Sitios corporativos, de marca y experiencias web a medida que explican con claridad lo que haces y para quién.",
      en: "Company and brand sites, and custom web experiences that clearly explain what you do and who it is for.",
    },
    when: {
      es: "Tu web está desactualizada, no refleja tu oferta actual o necesitas a alguien para cada cambio.",
      en: "Your website is out of date, does not reflect what you offer today, or you need someone for every change.",
    },
    deliverables: [
      { text: { es: "Arquitectura de contenido y mensajes", en: "Content architecture and messaging" } },
      { text: { es: "Diseño de interfaz pensado primero para móvil", en: "Interface design built for phones first" } },
      { text: { es: "Sitio publicado con gestor de contenido", en: "Published site with a content manager" } },
      { text: { es: "Analítica y SEO técnico de base", en: "Analytics and baseline technical SEO" } },
    ],
    flow: {
      es: ["Mensaje", "Estructura", "Diseño", "Desarrollo", "Publicación"],
      en: ["Message", "Structure", "Design", "Development", "Launch"],
    },
    keyNode: 1,
    caption: {
      es: "La estructura del contenido se define antes que el diseño: así la web responde lo que tus clientes preguntan.",
      en: "Content structure is defined before the design, so the site answers what your customers ask.",
    },
  },
  {
    id: "commerce",
    name: { es: "Tiendas y comercio", en: "Stores and commerce" },
    kind: { es: "Venta online", en: "Online sales" },
    summary: {
      es: "Ecommerce, catálogos complejos, buscadores especializados y la operación que hay detrás de cada venta.",
      en: "Ecommerce, complex catalogs, specialized search and the operations behind every sale.",
    },
    when: {
      es: "Vendes por catálogo, WhatsApp o tienda física y quieres vender online, o tu tienda actual no da abasto con tu catálogo.",
      en: "You sell through catalogs, WhatsApp or a physical store and want to sell online, or your current store cannot keep up with your catalog.",
    },
    deliverables: [
      { text: { es: "Tienda con catálogo, carrito y pagos", en: "Store with catalog, cart and payments" } },
      { text: { es: "Buscadores y filtros para catálogos técnicos", en: "Search and filters for technical catalogs" } },
      { text: { es: "Carga y actualización masiva de productos", en: "Bulk product upload and updates" } },
      { text: { es: "Pedidos conectados con tu operación", en: "Orders connected to your operations" } },
    ],
    flow: {
      es: ["Catálogo", "Búsqueda", "Carrito", "Pago", "Pedido", "Operación"],
      en: ["Catalog", "Search", "Cart", "Payment", "Order", "Operations"],
    },
    keyNode: 1,
    caption: {
      es: "En catálogos técnicos, que el cliente encuentre el producto correcto es la mitad de la venta.",
      en: "In technical catalogs, helping customers find the right product is half the sale.",
    },
  },
  {
    id: "platforms",
    name: { es: "Aplicaciones y plataformas", en: "Apps and platforms" },
    kind: { es: "Producto y operación", en: "Product and operations" },
    summary: {
      es: "Aplicaciones web, herramientas internas, productos digitales y plataformas de negocio construidas alrededor de tus reglas.",
      en: "Web applications, internal tools, digital products and business platforms built around your rules.",
    },
    when: {
      es: "Tu equipo depende de hojas de cálculo y correos que ya no escalan, o quieres lanzar un producto digital propio.",
      en: "Your team depends on spreadsheets and emails that no longer scale, or you want to launch your own digital product.",
    },
    deliverables: [
      { text: { es: "Definición de alcance y primera versión (MVP)", en: "Scope definition and first version (MVP)" } },
      { text: { es: "Aplicación web con usuarios y permisos", en: "Web application with users and permissions" } },
      { text: { es: "Panel de administración y reportes", en: "Admin panel and reports" } },
      { text: { es: "Documentación técnica y de uso", en: "Technical and user documentation" } },
    ],
    flow: {
      es: ["Usuarios", "Reglas de negocio", "Datos", "Reportes"],
      en: ["Users", "Business rules", "Data", "Reports"],
    },
    keyNode: 1,
    caption: {
      es: "Las reglas del negocio se modelan primero; la interfaz se construye sobre ellas.",
      en: "Business rules are modeled first; the interface is built on top of them.",
    },
  },
  {
    id: "funnels",
    name: { es: "Funnels de conversión", en: "Conversion funnels" },
    kind: { es: "Captación", en: "Lead generation" },
    summary: {
      es: "Páginas y flujos diseñados para convertir visitas en contactos, registros o ventas, con medición en cada paso.",
      en: "Pages and flows designed to turn visits into leads, sign-ups or sales, with measurement at every step.",
    },
    when: {
      es: "Inviertes en pauta o contenido, llegan visitas, pero los contactos no aparecen o no sabes en qué punto se pierden.",
      en: "You invest in ads or content and visits arrive, but leads do not show up or you do not know where they drop off.",
    },
    deliverables: [
      { text: { es: "Landing pages enfocadas en una sola acción", en: "Landing pages focused on a single action" } },
      { text: { es: "Formularios y flujos de registro", en: "Forms and sign-up flows" } },
      { text: { es: "Conexión con CRM, correo o WhatsApp", en: "Connection to CRM, email or WhatsApp" } },
      { text: { es: "Medición de eventos y del embudo completo", en: "Event and full-funnel measurement" } },
    ],
    flow: {
      es: ["Fuente", "Página", "Formulario", "Seguimiento", "Medición"],
      en: ["Source", "Page", "Form", "Follow-up", "Measurement"],
    },
    keyNode: 2,
    caption: {
      es: "Sin medición no hay optimización: cada paso del embudo queda registrado desde el día uno.",
      en: "Without measurement there is no optimization: every step of the funnel is tracked from day one.",
    },
  },
  {
    id: "integrations",
    name: { es: "Integraciones y automatización", en: "Integrations and automation" },
    kind: { es: "Sistemas conectados", en: "Connected systems" },
    summary: {
      es: "Conexión entre sistemas, APIs y procesos que hoy alguien hace a mano.",
      en: "Connections between systems, APIs and processes that someone does by hand today.",
    },
    when: {
      es: "Copias datos entre la tienda, el inventario, la facturación o el CRM, y los errores aparecen en el peor momento.",
      en: "You copy data between your store, inventory, invoicing or CRM, and errors show up at the worst moment.",
    },
    deliverables: [
      { text: { es: "Mapa de sistemas y flujos de datos", en: "Map of systems and data flows" } },
      { text: { es: "Integraciones vía API o webhooks", en: "Integrations via API or webhooks" } },
      { text: { es: "Sincronizaciones y tareas programadas", en: "Syncs and scheduled tasks" } },
      { text: { es: "Alertas y registro cuando algo falla", en: "Alerts and logs when something fails" } },
    ],
    flow: {
      es: ["Tienda", "API", "Inventario", "Facturación", "CRM"],
      en: ["Store", "API", "Inventory", "Invoicing", "CRM"],
    },
    keyNode: 1,
    caption: {
      es: "Un dato se registra una vez y viaja solo. Si algo falla, se sabe dónde y por qué.",
      en: "Data is entered once and travels on its own. If something fails, you know where and why.",
    },
  },
  {
    id: "evolution",
    name: { es: "Evolución continua", en: "Continuous evolution" },
    kind: { es: "Mejora sostenida", en: "Sustained improvement" },
    summary: {
      es: "Mejoras, nuevas funcionalidades y optimización de plataformas que ya están en producción.",
      en: "Improvements, new features and optimization for platforms already in production.",
    },
    when: {
      es: "Tu plataforma funciona, pero cada cambio es lento, arriesgado o nadie sabe bien cómo está construida.",
      en: "Your platform works, but every change is slow, risky, or nobody really knows how it is built.",
    },
    deliverables: [
      { text: { es: "Diagnóstico técnico del estado actual", en: "Technical assessment of the current state" } },
      { text: { es: "Lista de mejoras priorizada por impacto", en: "Improvement list prioritized by impact" } },
      { text: { es: "Entregas periódicas de mejoras", en: "Regular improvement releases" } },
      {
        text: { es: "Monitoreo y corrección de errores", en: "Monitoring and bug fixing" },
        pending: { es: "[Confirmar alcance de soporte]", en: "[Confirm support scope]" },
      },
    ],
    flow: {
      es: ["Diagnóstico", "Prioridades", "Entregas", "Medición"],
      en: ["Assessment", "Priorities", "Releases", "Measurement"],
    },
    keyNode: 1,
    caption: {
      es: "Se mejora por etapas, sin detener la operación y midiendo cada cambio.",
      en: "Improvement happens in stages, without stopping operations and measuring every change.",
    },
  },
];

export type Problem = {
  title: Text;
  problem: Text;
  solutionTitle: Text;
  solution: Text;
  resultTitle: Text;
  result: Text;
  serviceLine: ServiceLineId;
};

export const problems: Problem[] = [
  {
    title: { es: "Tu web no representa lo que hace tu empresa", en: "Your website does not represent what your company does" },
    problem: {
      es: "La oferta cambió, la web no. Los clientes llegan con dudas que el sitio debería resolver y tú terminas explicándolo todo en cada llamada.",
      en: "Your offer changed, your website did not. Customers arrive with questions the site should answer, and you end up explaining everything on every call.",
    },
    solutionTitle: { es: "Un sitio construido sobre tu oferta real", en: "A site built on your real offer" },
    solution: {
      es: "Defino qué necesita saber tu cliente, en qué orden, y diseño y construyo el sitio alrededor de eso.",
      en: "I define what your customer needs to know, in what order, and design and build the site around it.",
    },
    resultTitle: { es: "Una web que puedes mostrar con confianza", en: "A website you can show with confidence" },
    result: {
      es: "Que explique tu oferta por ti y que tu equipo pueda actualizar sin depender de terceros.",
      en: "One that explains your offer for you and that your team can update without depending on others.",
    },
    serviceLine: "websites",
  },
  {
    title: { es: "Tienes visitas, pero no contactos", en: "You get visits, but no leads" },
    problem: {
      es: "Llega tráfico desde pauta, redes o buscadores, pero los contactos no aparecen y no sabes dónde se pierden.",
      en: "Traffic arrives from ads, social media or search engines, but leads do not show up and you do not know where they drop off.",
    },
    solutionTitle: { es: "Un recorrido diseñado para una acción", en: "A journey designed for one action" },
    solution: {
      es: "Reviso mensaje, página, formulario y seguimiento; rediseño el flujo y mido cada paso.",
      en: "I review the message, page, form and follow-up; I redesign the flow and measure every step.",
    },
    resultTitle: { es: "Saber qué funciona y qué no", en: "Knowing what works and what does not" },
    result: {
      es: "Un embudo medido para tomar decisiones con datos y mejorar la conversión de forma sostenida.",
      en: "A measured funnel to make decisions with data and improve conversion steadily.",
    },
    serviceLine: "funnels",
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
    solutionTitle: { es: "Una herramienta hecha para tu proceso", en: "A tool made for your process" },
    solution: {
      es: "Modelo el proceso real y construyo una aplicación interna o una automatización que lo ejecute.",
      en: "I model the real process and build an internal application or an automation that runs it.",
    },
    resultTitle: { es: "Menos trabajo manual repetitivo", en: "Less repetitive manual work" },
    result: {
      es: "Menos errores de transcripción y un proceso que no depende de que una persona específica esté disponible.",
      en: "Fewer transcription errors and a process that does not depend on one specific person being available.",
    },
    serviceLine: "platforms",
  },
  {
    title: { es: "Tus sistemas no se hablan entre sí", en: "Your systems do not talk to each other" },
    problem: {
      es: "La tienda, el inventario, la facturación y el CRM tienen versiones distintas del mismo dato.",
      en: "Your store, inventory, invoicing and CRM hold different versions of the same data.",
    },
    solutionTitle: { es: "Integraciones con registro y alertas", en: "Integrations with logs and alerts" },
    solution: {
      es: "Mapeo qué dato vive dónde y conecto los sistemas por API, con sincronizaciones y alertas cuando algo falla.",
      en: "I map which data lives where and connect the systems through APIs, with syncs and alerts when something fails.",
    },
    resultTitle: { es: "Un dato, una fuente", en: "One piece of data, one source" },
    result: {
      es: "Información consistente entre sistemas y visibilidad inmediata cuando una sincronización falla.",
      en: "Consistent information across systems and immediate visibility when a sync fails.",
    },
    serviceLine: "integrations",
  },
  {
    title: { es: "Tu plataforma es difícil de cambiar", en: "Your platform is hard to change" },
    problem: {
      es: "Cada ajuste toma semanas, rompe otra cosa o nadie se atreve a tocar el código.",
      en: "Every adjustment takes weeks, breaks something else, or nobody dares to touch the code.",
    },
    solutionTitle: { es: "Diagnóstico y evolución por etapas", en: "Assessment and evolution in stages" },
    solution: {
      es: "Reviso el estado técnico, priorizo y mejoro por fases sin detener la operación.",
      en: "I review the technical state, prioritize, and improve in phases without stopping operations.",
    },
    resultTitle: { es: "Cambios con menos riesgo", en: "Changes with less risk" },
    result: {
      es: "Una plataforma que vuelve a evolucionar al ritmo del negocio, con documentación y control.",
      en: "A platform that evolves again at the pace of the business, with documentation and control.",
    },
    serviceLine: "evolution",
  },
];

export type CasePartId = "challenge" | "solution" | "results";
export type CasePart = { title: Text; text: Text; pending: Text };

// Client cases pending written authorization (name, screenshots, link) and confirmed metrics.
export type CaseStudy = {
  id: string;
  name: string;
  subtitle: Text;
  sector: Text;
  type: Text;
  url: Text;
  // Suggested indicators only: the figures stay pending until the client confirms them.
  metrics: [Text, Text];
  parts: Record<CasePartId, CasePart>;
};

export const casePartIds: CasePartId[] = ["challenge", "solution", "results"];

const verifiableResults: CasePart = {
  title: { es: "Resultados verificables", en: "Verifiable results" },
  text: {
    es: "Aquí solo se publicarán cifras confirmadas y autorizadas por el cliente.",
    en: "Only figures confirmed and authorized by the client will be published here.",
  },
  pending: { es: "[Confirmar métrica]", en: "[Confirm metric]" },
};

const pendingDomain: Text = { es: "https://[dominio — confirmar]", en: "https://[domain — confirm]" };

export const caseStudies: CaseStudy[] = [
  {
    id: "llantas-y-tires",
    name: "Llantas y Tires",
    subtitle: { es: "Ecommerce de llantas", en: "Tire ecommerce" },
    sector: { es: "Venta de llantas", en: "Tire sales" },
    type: { es: "Tienda online", en: "Online store" },
    url: pendingDomain,
    metrics: [
      {
        es: "Indicador sugerido: pedidos online por mes (solo con dato del cliente)",
        en: "Suggested indicator: online orders per month (client data only)",
      },
      {
        es: "Indicador sugerido: uso del buscador o tasa de conversión",
        en: "Suggested indicator: search usage or conversion rate",
      },
    ],
    parts: {
      challenge: {
        title: {
          es: "Vender llantas online, donde encontrar la referencia correcta lo es todo.",
          en: "Selling tires online, where finding the right reference is everything.",
        },
        text: {
          es: "Una llanta solo sirve si corresponde al vehículo. En este sector, el reto de una tienda online es que el cliente encuentre rápido la referencia correcta y confíe en comprarla.",
          en: "A tire is only useful if it fits the vehicle. In this sector, the challenge of an online store is helping customers find the right reference quickly and trust the purchase.",
        },
        pending: {
          es: "[Completar caso de estudio: situación del cliente antes del proyecto]",
          en: "[Complete case study: the client's situation before the project]",
        },
      },
      solution: {
        title: {
          es: "Una tienda de llantas con catálogo y búsqueda pensada para el comprador.",
          en: "A tire store with a catalog and search designed for the buyer.",
        },
        text: {
          es: "Diseño y desarrollo de la plataforma de comercio: catálogo, búsqueda por características del producto y flujo de compra.",
          en: "Design and development of the commerce platform: catalog, search by product specifications and checkout flow.",
        },
        pending: {
          es: "[Confirmar funcionalidades entregadas y plataforma]",
          en: "[Confirm delivered features and platform]",
        },
      },
      results: verifiableResults,
    },
  },
  {
    id: "llantamarket",
    name: "LlantaMarket",
    subtitle: { es: "Nueva plataforma sobre una base probada", en: "A new platform on a proven base" },
    sector: { es: "Venta de llantas", en: "Tire sales" },
    type: { es: "Plataforma de comercio", en: "Commerce platform" },
    url: pendingDomain,
    metrics: [
      {
        es: "Indicador sugerido: tiempo desde el inicio hasta el lanzamiento",
        en: "Suggested indicator: time from kickoff to launch",
      },
      {
        es: "Indicador sugerido: volumen de catálogo o pedidos",
        en: "Suggested indicator: catalog or order volume",
      },
    ],
    parts: {
      challenge: {
        title: {
          es: "Lanzar una plataforma de llantas sin empezar desde cero.",
          en: "Launching a tire platform without starting from scratch.",
        },
        text: {
          es: "Construir todo desde el principio no siempre es la mejor decisión. Este proyecto partió de una base técnica ya probada en otro ecommerce del mismo sector.",
          en: "Building everything from the start is not always the best decision. This project started from a technical base already proven in another ecommerce in the same sector.",
        },
        pending: {
          es: "[Completar caso de estudio: objetivo del cliente]",
          en: "[Complete case study: the client's goal]",
        },
      },
      solution: {
        title: {
          es: "Una base existente, adaptada a una nueva operación.",
          en: "An existing base, adapted to a new operation.",
        },
        text: {
          es: "LlantaMarket se construyó a partir de la base de Llantas y Tires y se adaptó a las necesidades del nuevo negocio.",
          en: "LlantaMarket was built from the Llantas y Tires base and adapted to the needs of the new business.",
        },
        pending: {
          es: "[Confirmar qué se adaptó y autorización de ambos clientes para mencionarlo]",
          en: "[Confirm what was adapted and both clients' authorization to mention it]",
        },
      },
      results: verifiableResults,
    },
  },
];

export type Phase = { title: Text; text: Text; receives: Text; pending?: Text };

export const phases: Phase[] = [
  {
    title: { es: "Diagnóstico", en: "Assessment" },
    text: {
      es: "Entiendo el negocio, el problema y lo que ya existe: sistemas, datos, equipo y restricciones.",
      en: "I understand the business, the problem and what already exists: systems, data, team and constraints.",
    },
    receives: {
      es: "Un diagnóstico por escrito y una recomendación de alcance.",
      en: "A written assessment and a scope recommendation.",
    },
  },
  {
    title: { es: "Propuesta por fases", en: "Proposal in phases" },
    text: {
      es: "Divido el proyecto en fases con entregables claros, empezando por lo que más impacto tiene.",
      en: "I split the project into phases with clear deliverables, starting with what has the most impact.",
    },
    receives: { es: "Una propuesta con fases y alcance de cada una.", en: "A proposal with phases and the scope of each one." },
    pending: { es: "[Confirmar formato comercial]", en: "[Confirm commercial format]" },
  },
  {
    title: { es: "Construcción con entregas", en: "Building with deliveries" },
    text: {
      es: "Avanzas viendo partes funcionando en un entorno de pruebas, no solo informes de avance.",
      en: "You move forward seeing working parts in a test environment, not just progress reports.",
    },
    receives: { es: "Entregas revisables y espacio para ajustar.", en: "Reviewable deliveries and room to adjust." },
  },
  {
    title: { es: "Lanzamiento y evolución", en: "Launch and evolution" },
    text: {
      es: "Publico, acompaño la salida a producción y definimos juntos qué sigue.",
      en: "I publish, support the move to production, and together we decide what comes next.",
    },
    receives: {
      es: "Plataforma en producción, documentación y accesos.",
      en: "A platform in production, documentation and access.",
    },
    pending: { es: "[Confirmar alcance de soporte]", en: "[Confirm support scope]" },
  },
];

export type CriteriaRow = { need: Text; choice: Text; why: Text };

export const criteria: CriteriaRow[] = [
  {
    need: { es: "Vender pronto con un catálogo estándar", en: "To sell soon with a standard catalog" },
    choice: { es: "Una plataforma de ecommerce existente", en: "An existing ecommerce platform" },
    why: {
      es: "Pagos, envíos e inventario ya están resueltos. Inviertes en tu catálogo y tu operación, no en reconstruir un carrito.",
      en: "Payments, shipping and inventory are already solved. You invest in your catalog and operations, not in rebuilding a cart.",
    },
  },
  {
    need: {
      es: "Que tus clientes encuentren productos por criterios técnicos",
      en: "For your customers to find products by technical criteria",
    },
    choice: { es: "Un buscador especializado sobre esa plataforma", en: "A specialized search on top of that platform" },
    why: {
      es: "Lo diferencial se construye a medida; lo estándar se reutiliza.",
      en: "What sets you apart is custom-built; what is standard is reused.",
    },
  },
  {
    need: { es: "Operar procesos con reglas propias", en: "To run processes with your own rules" },
    choice: { es: "Una aplicación web a medida", en: "A custom web application" },
    why: {
      es: "Cuando una herramienta genérica obliga a tu equipo a trabajar alrededor de ella, conviene construir.",
      en: "When a generic tool forces your team to work around it, building makes sense.",
    },
  },
  {
    need: { es: "Que tus sistemas compartan información", en: "For your systems to share information" },
    choice: { es: "Integraciones por API y tareas programadas", en: "API integrations and scheduled tasks" },
    why: {
      es: "El dato se registra una vez, se propaga solo y, si algo falla, queda registro.",
      en: "Data is entered once, spreads on its own and, if something fails, there is a record.",
    },
  },
  {
    need: { es: "Mejorar una plataforma que ya funciona", en: "To improve a platform that already works" },
    choice: { es: "Evolución por etapas", en: "Evolution in stages" },
    why: {
      es: "Rehacer todo es la última opción, no la primera.",
      en: "Rebuilding everything is the last option, not the first.",
    },
  },
];

export type Principle = { title: Text; text: Text };

export const principles: Principle[] = [
  {
    title: { es: "Lo probado antes que lo de moda", en: "Proven over trendy" },
    text: {
      es: "Tecnologías estables y documentadas: más fáciles de mantener y de entregar a otro equipo si algún día lo necesitas.",
      en: "Stable, documented technologies: easier to maintain and to hand over to another team if you ever need to.",
    },
  },
  {
    title: { es: "Comprar antes que construir, cuando conviene", en: "Buy before you build, when it makes sense" },
    text: {
      es: "Construyo a medida solo lo que una herramienta existente no resuelve bien.",
      en: "I custom-build only what an existing tool does not solve well.",
    },
  },
  {
    title: { es: "Que se pueda operar", en: "Built to be operated" },
    text: {
      es: "Documentación, accesos ordenados y registro de errores hacen parte del trabajo.",
      en: "Documentation, organized access and error logs are part of the work.",
    },
  },
];

export type AboutPoint = { title: Text; text: Text; pending?: Text };

export const aboutPoints: AboutPoint[] = [
  {
    title: { es: "Comunicación directa", en: "Direct communication" },
    text: {
      es: "Sin intermediarios entre tu necesidad y quien la resuelve.",
      en: "No middlemen between your need and whoever solves it.",
    },
  },
  {
    title: { es: "Decisiones explicadas", en: "Explained decisions" },
    text: {
      es: "Cada elección técnica viene con su porqué, en lenguaje claro.",
      en: "Every technical choice comes with its reason, in plain language.",
    },
  },
  {
    title: { es: "Capacidad honesta", en: "Honest capacity" },
    text: { es: "Tomo los proyectos que puedo atender bien.", en: "I take on the projects I can serve well." },
    pending: { es: "[Confirmar]", en: "[Confirm]" },
  },
];

export type Faq = { question: Text; answer: Text; pending?: Text };

export const faqs: Faq[] = [
  {
    question: { es: "¿Qué tipo de proyectos tomas?", en: "What kind of projects do you take on?" },
    answer: {
      es: "Sitios web, tiendas online, aplicaciones, funnels, integraciones y mejoras sobre plataformas existentes, para empresas que necesitan resolver un problema concreto de operación o ventas. Si tu proyecto no encaja con lo que hago, te lo digo en la primera conversación.",
      en: "Websites, online stores, applications, funnels, integrations and improvements to existing platforms, for companies that need to solve a concrete operations or sales problem. If your project does not fit what I do, I tell you in the first conversation.",
    },
  },
  {
    question: { es: "¿Cuánto tiempo toma un proyecto?", en: "How long does a project take?" },
    answer: {
      es: "Depende del alcance. Por eso empiezo con un diagnóstico y divido el trabajo en fases: cada fase tiene entregables y una estimación propia antes de empezar.",
      en: "It depends on the scope. That is why I start with an assessment and split the work into phases: each phase has deliverables and its own estimate before it starts.",
    },
    pending: { es: "[Confirmar si se publican rangos de referencia]", en: "[Confirm whether reference ranges are published]" },
  },
  {
    question: { es: "¿Todo se construye a la medida?", en: "Is everything custom-built?" },
    answer: {
      es: "No. Si una plataforma existente resuelve tu problema, la uso y construyo a la medida solo lo que aporta algo diferencial. Construir de más también es un costo.",
      en: "No. If an existing platform solves your problem, I use it and custom-build only what adds something distinctive. Building too much is also a cost.",
    },
  },
  {
    question: {
      es: "¿De quién son el código, el dominio y los accesos?",
      en: "Who owns the code, the domain and the access?",
    },
    answer: {
      es: "Recomiendo que el dominio, el hosting y las cuentas de servicios de terceros estén a nombre de tu empresa desde el inicio.",
      en: "I recommend that the domain, the hosting and third-party service accounts are in your company's name from the start.",
    },
    pending: {
      es: "[Confirmar política de propiedad intelectual y entrega de accesos]",
      en: "[Confirm intellectual property policy and access handover]",
    },
  },
  {
    question: { es: "¿Puedes migrar mi web o tienda actual?", en: "Can you migrate my current website or store?" },
    answer: {
      es: "Lo evalúo en el diagnóstico: reviso contenido, productos, clientes, URLs e integraciones, y planeo la migración para cuidar la operación y el posicionamiento en buscadores.",
      en: "I evaluate it in the assessment: I review content, products, customers, URLs and integrations, and plan the migration to protect your operations and search rankings.",
    },
  },
  {
    question: { es: "¿Con qué plataformas trabajas?", en: "Which platforms do you work with?" },
    answer: {
      es: "Elijo según el problema: plataformas de ecommerce y gestores de contenido existentes cuando son suficientes, y desarrollo a medida cuando el negocio lo necesita.",
      en: "I choose based on the problem: existing ecommerce platforms and content managers when they are enough, and custom development when the business needs it.",
    },
    pending: {
      es: "[Confirmar lista de plataformas con experiencia demostrable]",
      en: "[Confirm list of platforms with demonstrable experience]",
    },
  },
  {
    question: { es: "¿Qué pasa después del lanzamiento?", en: "What happens after launch?" },
    answer: {
      es: "La fase de evolución existe para eso: mejoras, nuevas funcionalidades y corrección de errores sobre lo que ya está en producción.",
      en: "That is what the evolution phase is for: improvements, new features and bug fixes on what is already in production.",
    },
    pending: { es: "[Confirmar modalidad de soporte y evolución]", en: "[Confirm support and evolution model]" },
  },
];

// The "what do you need?" chips of the contact form. The contact action stores one project type
// (src/lib/contact/contact-form.ts), so each need names the service it is closest to, or "other".
export type ContactNeed = { id: string; label: Text; projectType: ServiceId | "other" };

export const contactNeeds: ContactNeed[] = [
  { id: "website", label: { es: "Sitio web", en: "Website" }, projectType: "websites" },
  { id: "store", label: { es: "Tienda online", en: "Online store" }, projectType: "other" },
  { id: "app", label: { es: "Aplicación o plataforma", en: "App or platform" }, projectType: "apps" },
  { id: "funnel", label: { es: "Funnel de conversión", en: "Conversion funnel" }, projectType: "websites" },
  { id: "integration", label: { es: "Integración o automatización", en: "Integration or automation" }, projectType: "plugins" },
  { id: "improve", label: { es: "Mejorar lo que ya tengo", en: "Improve what I already have" }, projectType: "other" },
  { id: "unsure", label: { es: "Aún no lo sé", en: "I don't know yet" }, projectType: "other" },
];
