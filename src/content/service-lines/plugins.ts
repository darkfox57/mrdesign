import type { ServiceLineContent } from "./types";

// Approved copy of the "Plugins and integrations" line page (odd/tasks/site-build-experience.md, T5 and L13).
// The user approved it word for word: change it only with the user's approval. Its slug and name
// live in src/content/services.ts.
//
// Problems this line solves (an editorial note for future copy, not shown on the page): Leads here
// from home problems such as: copying orders by hand from the store into invoicing or the CRM;
// stock that does not match between the store, the warehouse or other sales channels; a process the
// platform cannot do out of the box; too many plugins stacked together that conflict or slow the
// site; finding out about a failed sync only when a customer complains or the month-end does not
// add up.
export const plugins: ServiceLineContent = {
  h1: {
    es: "Desarrollo de plugins e integraciones a la medida de tu negocio",
    en: "Custom plugin development and integrations for your business",
  },
  metaTitle: { es: "Plugins e integraciones a la medida", en: "Custom plugin development and API integrations" },
  metaDescription: {
    es: "Desarrollo plugins de WordPress, módulos de PrestaShop y apps de Shopify, e integro tu tienda con inventario, facturación y CRM con alertas si algo falla.",
    en: "I build WordPress plugins, PrestaShop modules and Shopify apps, and connect your store to inventory, invoicing and CRM, with alerts when a sync fails.",
  },
  summary: {
    es: "Diseño y construyo plugins de WordPress, módulos de PrestaShop y apps de Shopify para lo que tu negocio necesita y ningún plugin del catálogo resuelve bien. También conecto tu tienda con el inventario, la facturación y el CRM por medio de sus API, para que los datos se sincronicen solos y te llegue una alerta cuando una sincronización falla. Es un servicio para negocios que ya venden en línea y para quienes están armando su operación y quieren dejar de copiar datos a mano.",
    en: "I design and build WordPress plugins, PrestaShop modules and Shopify apps for what your business needs and no off-the-shelf plugin handles well. I also connect your store to inventory, invoicing and CRM through their APIs, so data syncs on its own and you get an alert when a sync fails. It is for businesses already selling online and for people setting up their operation who want to stop copying data by hand.",
  },
  audience: {
    es: "Para negocios con una tienda o sitio en WordPress, PrestaShop o Shopify que necesitan una función propia o que sus sistemas hablen entre sí, y para quienes empiezan y quieren montar esos flujos bien desde el principio.",
    en: "For businesses running a store or site on WordPress, PrestaShop or Shopify that need a feature of their own or need their systems to talk to each other, and for people starting out who want those flows set up right from the beginning.",
  },
  keywords: {
    es: [
      "desarrollo de plugins wordpress a la medida",
      "desarrollo de módulos prestashop",
      "crear app personalizada para shopify",
      "integración de tienda online con inventario",
      "integrar tienda con facturación electrónica",
      "conectar tienda online con crm",
      "sincronización de inventario entre tienda y bodega",
      "desarrollador de integraciones api",
    ],
    en: [
      "custom wordpress plugin development",
      "prestashop module development",
      "custom shopify app developer",
      "ecommerce inventory integration",
      "connect online store to invoicing software",
      "ecommerce crm integration",
      "api integration developer for small business",
      "sync inventory between store and erp",
    ],
  },
  deliverables: [
    {
      code: "<Plugin />",
      title: { es: "Plugin de WordPress o WooCommerce", en: "WordPress or WooCommerce plugin" },
      description: {
        es: "Una función propia empaquetada como plugin: reglas de precios, campos de pedido, reservas o lo que tu proceso pida. Usa los hooks de WordPress, así no toca el núcleo y las actualizaciones de WordPress no lo sobrescriben.",
        en: "A feature of your own packaged as a plugin: pricing rules, order fields, bookings or whatever your process calls for. It uses WordPress hooks, so it leaves core untouched and WordPress updates do not overwrite it.",
      },
    },
    {
      code: "<Module />",
      title: { es: "Módulo de PrestaShop", en: "PrestaShop module" },
      description: {
        es: "Un módulo que se instala desde el panel de PrestaShop y se engancha a sus eventos de carrito, pedido y catálogo. Agrega la lógica que tu tienda necesita sin modificar archivos del sistema.",
        en: "A module installed from the PrestaShop back office that hooks into its cart, order and catalog events. It adds the logic your store needs without editing system files.",
      },
    },
    {
      code: "<ShopifyApp />",
      title: { es: "App personalizada de Shopify", en: "Custom Shopify app" },
      description: {
        es: "Una app hecha solo para tu tienda que usa la API de Shopify para automatizar pedidos, productos o clientes. Hace lo que el tema y las apps públicas no cubren.",
        en: "An app built only for your store that uses the Shopify API to automate orders, products or customers. It does what the theme and public apps do not cover.",
      },
    },
    {
      code: "<ApiSync />",
      title: { es: "Integración entre tus sistemas", en: "Integration between your systems" },
      description: {
        es: "Conecto la tienda con tu inventario, tu software de facturación y tu CRM para que pedidos, existencias y clientes viajen solos. Defino qué sistema manda en cada dato para evitar cifras cruzadas.",
        en: "I connect the store to your inventory, invoicing software and CRM so orders, stock and customers move on their own. I define which system owns each piece of data to avoid conflicting numbers.",
      },
    },
    {
      code: "<SyncAlerts />",
      title: { es: "Alertas y registro de fallos", en: "Failure alerts and logs" },
      description: {
        es: "Cada sincronización deja un registro y, si una falla, reintenta y te avisa con el detalle del error. Así puedes enterarte antes de que un cliente reclame un pedido sin factura.",
        en: "Every sync leaves a log entry, and when one fails it retries and notifies you with the error detail. That way you can find out before a customer asks about an order with no invoice.",
      },
    },
    {
      code: "<Settings />",
      title: { es: "Panel de ajustes y documentación", en: "Settings panel and documentation" },
      description: {
        es: "Una pantalla de ajustes dentro de tu plataforma para cambiar claves, reglas y opciones sin tocar código. La acompaño de una guía escrita de cómo funciona y qué revisar si algo cambia.",
        en: "A settings screen inside your platform to change keys, rules and options without touching code. It comes with a written guide on how it works and what to check if something changes.",
      },
    },
  ],
  buildSteps: [
    {
      label: { es: "Mapa", en: "Map" },
      note: {
        es: "Antes de escribir código dibujo qué datos salen de cada sistema, hacia dónde van y quién manda en cada uno.",
        en: "Before writing code I map which data leaves each system, where it goes and which system owns it.",
      },
      logLine: {
        es: "› mapa · pedidos, existencias y clientes con su origen definido",
        en: "› map · orders, stock and customers with a defined source",
      },
      visualHint: "Three system boxes (Store, Inventory, Invoicing) appear as wireframe outlines; dashed arrows draw between them, each labeled with a data type (orders, stock, customers).",
    },
    {
      label: { es: "Hooks", en: "Hooks" },
      note: {
        es: "Engancho el plugin a los eventos de la plataforma, como un pedido nuevo o un cambio de precio, sin tocar su núcleo.",
        en: "I attach the plugin to platform events, like a new order or a price change, without touching its core.",
      },
      logLine: {
        es: "› hooks · escuchando pedidos nuevos y cambios de stock",
        en: "› hooks · listening for new orders and stock changes",
      },
      visualHint: "The store box opens to show event lines (order.created, product.updated); small connector pins snap onto each line and light up.",
    },
    {
      label: { es: "Ajustes", en: "Settings" },
      note: {
        es: "Construyo una pantalla de ajustes para que cambies claves y reglas desde el panel, sin depender de mí.",
        en: "I build a settings screen so you can change keys and rules from the dashboard without depending on me.",
      },
      logLine: {
        es: "› ajustes · claves, reglas y opciones en el panel",
        en: "› settings · keys, rules and options in the dashboard",
      },
      visualHint: "An admin settings panel slides in with toggles, an API key field (masked) and a rule dropdown filling in one by one.",
    },
    {
      label: { es: "Integración", en: "Integration" },
      note: {
        es: "Conecto las API de cada sistema y los datos empiezan a viajar solos entre la tienda, el inventario y la facturación.",
        en: "I connect each system's API and data starts moving on its own between store, inventory and invoicing.",
      },
      logLine: {
        es: "› integración · tienda, inventario y facturación sincronizando",
        en: "› integration · store, inventory and invoicing syncing",
      },
      visualHint: "The dashed arrows from the map turn solid; small data packets (order, invoice, stock count) travel along them between the three boxes.",
    },
    {
      label: { es: "Pruebas", en: "Tests" },
      note: {
        es: "Fuerzo errores a propósito, como una API caída o un dato incompleto, para comprobar que se reintenta y llega la alerta.",
        en: "I force failures on purpose, like an API being down or incomplete data, to check that it retries and the alert arrives.",
      },
      logLine: {
        es: "› pruebas · fallo simulado, reintento y alerta enviada",
        en: "› tests · simulated failure, retry and alert sent",
      },
      visualHint: "One arrow flashes red and breaks; a retry spinner appears, then an alert card pops up with the error detail, and the arrow turns green again.",
    },
    {
      label: { es: "En vivo", en: "Live" },
      note: {
        es: "La integración queda corriendo con su registro a la vista, para que sepas qué se sincronizó y cuándo.",
        en: "The integration goes live with its log in view, so you know what synced and when.",
      },
      logLine: {
        es: "› en vivo · sincronización activa y registro visible",
        en: "› live · sync running and log visible",
      },
      visualHint: "The full diagram settles into a calm state with a live activity log scrolling below it, each line with a green check.",
    },
  ],
  comparison: {
    columns: {
      es: [
        "Plugin del catálogo",
        "Automatización sin código",
        "Plugin o integración a la medida",
      ],
      en: [
        "Off-the-shelf plugin",
        "No-code automation tool",
        "Custom plugin or integration",
      ],
    },
    rows: [
      {
        label: { es: "Para qué sirve mejor", en: "Best for" },
        cells: {
          es: [
            "Funciones comunes que muchas tiendas necesitan igual.",
            "Conectar herramientas populares con flujos sencillos.",
            "Procesos propios de tu negocio o sistemas sin conector listo.",
          ],
          en: [
            "Common features many stores need the same way.",
            "Connecting popular tools with simple flows.",
            "Processes specific to your business or systems with no ready connector.",
          ],
        },
      },
      {
        label: { es: "Cómo se ajusta a tu proceso", en: "How it fits your process" },
        cells: {
          es: [
            "Tú te adaptas a lo que el plugin ofrece.",
            "Se ajusta dentro de lo que permite cada conector.",
            "Se construye alrededor de tu forma de trabajar.",
          ],
          en: [
            "You adapt to what the plugin offers.",
            "It fits within what each connector allows.",
            "It is built around the way you work.",
          ],
        },
      },
      {
        label: { es: "Costo recurrente", en: "Ongoing cost" },
        cells: {
          es: [
            "Muchos cobran una licencia o suscripción anual.",
            "Suele cobrarse un plan según el volumen de tareas.",
            "Sin licencia de terceros por el código propio; necesita mantenimiento cuando la plataforma cambia.",
          ],
          en: [
            "Many charge a yearly license or subscription.",
            "Usually a plan priced by task volume.",
            "No third-party license for your own code; it needs maintenance when the platform changes.",
          ],
        },
      },
      {
        label: { es: "Cuando algo falla", en: "When something fails" },
        cells: {
          es: [
            "Dependes del soporte y el ritmo del autor.",
            "El registro muestra el fallo, pero la lógica está limitada a la herramienta.",
            "Reintentos, alertas y registro pensados para tus datos.",
          ],
          en: [
            "You depend on the author's support and pace.",
            "The log shows the failure, but the logic is limited to the tool.",
            "Retries, alerts and logs designed around your data.",
          ],
        },
      },
    ],
    highlight: 2,
  },
  faqs: [
    {
      q: {
        es: "¿Cuándo conviene un plugin a la medida en vez de uno del catálogo?",
        en: "When does a custom plugin make more sense than an off-the-shelf one?",
      },
      a: {
        es: "Conviene cuando tu proceso no encaja en lo que ofrecen los plugins existentes, cuando necesitas juntar varios para lograr una sola función o cuando esos plugins chocan entre sí o vuelven lento el sitio. Si un plugin conocido ya hace lo que necesitas, te lo digo y lo usamos. Construyo a la medida solo cuando eso te ahorra trabajo o problemas.",
        en: "It makes sense when your process does not fit what existing plugins offer, when you need several of them stacked to get one feature, or when they conflict with each other or slow the site down. If a well-known plugin already does what you need, I tell you and we use it. I build custom only when that saves you work or trouble.",
      },
    },
    {
      q: {
        es: "¿Puedes conectar mi tienda con mi software de facturación electrónica, inventario o CRM?",
        en: "Can you connect my store to my e-invoicing, inventory or CRM software?",
      },
      a: {
        es: "Sí, cuando el sistema tiene una API o una forma documentada de intercambiar datos. Primero reviso qué permite cada sistema y te explico qué se puede sincronizar, en qué dirección y con qué frecuencia. Si un sistema no ofrece API, te digo qué alternativas hay antes de empezar.",
        en: "Yes, when the system has an API or a documented way to exchange data. First I review what each system allows and explain what can sync, in which direction and how often. If a system has no API, I tell you what alternatives exist before starting.",
      },
    },
    {
      q: { es: "¿Qué pasa si una sincronización falla?", en: "What happens if a sync fails?" },
      a: {
        es: "Cada sincronización queda en un registro. Si falla, se reintenta y, si el problema sigue, te llega una alerta con el detalle del error y el dato afectado. Así es menos probable que te enteres por un cliente o por un cierre de mes que no cuadra.",
        en: "Every sync is logged. If one fails, it retries, and if the problem persists you get an alert with the error detail and the affected record. That way you are less likely to find out from a customer or from a month-end that does not add up.",
      },
    },
    {
      q: {
        es: "¿Qué pasa con mi plugin cuando WordPress, PrestaShop o Shopify se actualizan?",
        en: "What happens to my plugin when WordPress, PrestaShop or Shopify update?",
      },
      a: {
        es: "Construyo sobre los hooks y las API oficiales de cada plataforma, que es la forma prevista para extenderlas, en lugar de modificar su núcleo. Eso reduce el riesgo de que una actualización lo rompa, aunque los cambios grandes de una plataforma pueden pedir ajustes. Te explico cómo revisarlo y cómo trabajamos esos ajustes.",
        en: "I build on each platform's official hooks and APIs, which is the intended way to extend them, instead of editing their core. That lowers the risk of an update breaking it, although major platform changes can require adjustments. I explain how to check it and how we handle those adjustments.",
      },
    },
    {
      q: {
        es: "Estoy empezando mi negocio: ¿necesito integraciones desde el primer día?",
        en: "I am just starting my business. Do I need integrations from day one?",
      },
      a: {
        es: "No siempre. Al principio puede bastar con la tienda y un proceso manual claro. Lo que sí te recomiendo es elegir desde ya herramientas de facturación, inventario y CRM que tengan API, para que conectarlas después sea sencillo cuando el volumen de pedidos lo pida.",
        en: "Not always. At first the store plus a clear manual process may be enough. What I do recommend is choosing invoicing, inventory and CRM tools that have an API from the start, so connecting them later is simple once your order volume calls for it.",
      },
    },
    {
      q: {
        es: "¿Cuánto tarda en estar listo un plugin o una integración?",
        en: "How long does a plugin or integration take?",
      },
      a: {
        es: "Depende de cuántos sistemas se conectan, de lo que permita cada API y de cuántas reglas tiene tu proceso. Después de revisar los sistemas contigo te doy un plazo concreto y lo divido en entregas que puedes probar.",
        en: "It depends on how many systems are connected, what each API allows and how many rules your process has. After reviewing the systems with you, I give you a concrete timeline and split it into deliveries you can test.",
      },
    },
  ],
  related: [
    {
      id: "wordpress",
      reason: {
        es: "Si tu sitio o tienda está en WordPress, el plugin se construye sobre esa base y conviene que el sitio esté bien armado.",
        en: "If your site or store runs on WordPress, the plugin builds on that base, and the site itself should be built well.",
      },
    },
    {
      id: "shopify",
      reason: {
        es: "Una tienda Shopify crece con apps personalizadas e integraciones hacia tu inventario y tu facturación.",
        en: "A Shopify store grows with custom apps and integrations to your inventory and invoicing.",
      },
    },
    {
      id: "evolution",
      reason: {
        es: "Cuando tu plataforma acumula plugins que chocan o procesos manuales, una integración suele ser parte de hacerla evolucionar.",
        en: "When your platform piles up conflicting plugins or manual processes, an integration is often part of evolving it.",
      },
    },
  ],
};
