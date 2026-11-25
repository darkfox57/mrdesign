import type { ServiceLineContent } from "./types";

// Approved copy of the "Shopify stores" line page (odd/tasks/site-build-experience.md, T5 and L13).
// The user approved it word for word: change it only with the user's approval. Its slug and name
// live in src/content/services.ts.
//
// Problems this line solves (an editorial note for future copy, not shown on the page): I want to
// start selling online and need a store without managing servers; my store looks like every other
// template; I depend on someone else for every small change to the store; orders, stock and
// invoices are typed twice between the store and my other systems; I am moving from another
// e-commerce platform and fear losing search traffic; I do not know which campaigns or channels
// actually produce sales.
export const shopify: ServiceLineContent = {
  h1: {
    es: "Desarrollo de tiendas Shopify a la medida, listas para crecer",
    en: "Custom Shopify store development, built to grow",
  },
  metaTitle: { es: "Tiendas Shopify y temas a la medida", en: "Custom Shopify store and theme development" },
  metaDescription: {
    es: "Diseño y construyo tiendas Shopify con temas a la medida en Online Store 2.0, secciones que editas tú, integraciones y migraciones con redirecciones.",
    en: "I design and build Shopify stores with custom Online Store 2.0 themes, sections you can edit, integrations and migrations with redirects.",
  },
  summary: {
    es: "Diseño y desarrollo tiendas Shopify a la medida: un tema propio sobre Online Store 2.0, con secciones que tú editas, fichas de producto claras y conexiones con tu inventario, facturación, envíos y pagos. Es para negocios que quieren vender en línea sin administrar servidores y con una tienda que no se parece a una plantilla. Trabajas directamente conmigo, la persona que la construye.",
    en: "I design and develop custom Shopify stores: a theme of your own on Online Store 2.0, with sections you edit yourself, clear product pages and connections to your inventory, invoicing, shipping and payments. It is for businesses that want to sell online without managing servers, with a store that does not look like a template. You work directly with me, the person who builds it.",
  },
  audience: {
    es: "Para quienes abren su primera tienda en línea y para negocios que ya venden y necesitan que Shopify trabaje junto a sus sistemas de inventario, facturación y envíos.",
    en: "For people opening their first online store and for businesses that already sell and need Shopify to work alongside their inventory, invoicing and shipping systems.",
  },
  keywords: {
    es: [
      "desarrollo de tiendas shopify",
      "desarrollador shopify",
      "tema shopify personalizado",
      "crear tienda en shopify a la medida",
      "migrar tienda a shopify",
      "diseño de tienda shopify",
      "desarrollador shopify colombia",
    ],
    en: [
      "shopify store development",
      "shopify developer",
      "custom shopify theme",
      "shopify online store 2.0 theme development",
      "migrate store to shopify",
      "shopify store design",
      "shopify theme developer",
    ],
  },
  deliverables: [
    {
      code: "<Theme />",
      title: { es: "Tema Shopify a la medida", en: "Custom Shopify theme" },
      description: {
        es: "Construyo un tema propio sobre Online Store 2.0, con plantillas JSON y el diseño de tu marca, en lugar de adaptar una plantilla genérica.",
        en: "I build a theme of your own on Online Store 2.0, with JSON templates and your brand's design, instead of adapting a generic template.",
      },
    },
    {
      code: "<Sections />",
      title: { es: "Secciones editables", en: "Editable sections" },
      description: {
        es: "Cada parte de la tienda es una sección o bloque que mueves, ocultas y editas desde el personalizador de Shopify, sin tocar código.",
        en: "Every part of the store is a section or block you can move, hide and edit from the Shopify theme editor, without touching code.",
      },
    },
    {
      code: "<ProductPage />",
      title: { es: "Fichas de producto", en: "Product pages" },
      description: {
        es: "Fichas con variantes, galería, disponibilidad y datos técnicos guardados en metacampos, para que cada producto muestre lo que el cliente necesita saber antes de comprar.",
        en: "Product pages with variants, gallery, availability and technical details stored in metafields, so each product shows what the customer needs to know before buying.",
      },
    },
    {
      code: "<Integrations />",
      title: { es: "Apps e integraciones", en: "Apps and integrations" },
      description: {
        es: "Conecto Shopify con tu inventario, facturación electrónica, transportadoras y pasarelas de pago, usando apps existentes o una app a la medida cuando ninguna resuelve el caso.",
        en: "I connect Shopify to your inventory, electronic invoicing, carriers and payment gateways, using existing apps or a custom app when none fits the case.",
      },
    },
    {
      code: "<Migration />",
      title: { es: "Migración a Shopify", en: "Migration to Shopify" },
      description: {
        es: "Traslado productos, clientes, pedidos y contenido desde otra plataforma, y creo redirecciones 301 de cada URL antigua a su nueva dirección.",
        en: "I move products, customers, orders and content from another platform, and create 301 redirects from every old URL to its new address.",
      },
    },
    {
      code: "<Analytics />",
      title: { es: "SEO técnico y analítica de compra", en: "Technical SEO and purchase analytics" },
      description: {
        es: "Configuro datos estructurados de producto, optimizo la velocidad de carga y registro los eventos de compra (ver producto, agregar al carrito, iniciar pago y compra) para que sepas qué canales generan ventas.",
        en: "I set up product structured data, optimize load speed and track purchase events (view product, add to cart, begin checkout and purchase) so you know which channels bring in sales.",
      },
    },
  ],
  buildSteps: [
    {
      label: { es: "Catálogo", en: "Catalog" },
      note: {
        es: "Organizo productos, variantes, colecciones y metacampos antes de diseñar una sola pantalla.",
        en: "I organize products, variants, collections and metafields before designing a single screen.",
      },
      logLine: {
        es: "› catálogo · productos, variantes y colecciones en su lugar",
        en: "› catalog · products, variants and collections in place",
      },
      visualHint: "An empty store grid fills with product cards grouped into collections; small tags for variants (size, color) and metafields attach to each card.",
    },
    {
      label: { es: "Secciones", en: "Sections" },
      note: {
        es: "Armo el tema con secciones y bloques que después mueves y editas tú desde el personalizador.",
        en: "I assemble the theme from sections and blocks that you later move and edit yourself in the theme editor.",
      },
      logLine: {
        es: "› tema · plantillas JSON y secciones editables listas",
        en: "› theme · JSON templates and editable sections ready",
      },
      visualHint: "The storefront skeleton appears as stacked section outlines (header, hero, featured collection, footer); one section is dragged to a new position to show it is editable.",
    },
    {
      label: { es: "Filtros", en: "Filters" },
      note: {
        es: "Configuro filtros y búsqueda para que el cliente llegue rápido al producto que busca.",
        en: "I set up filters and search so customers reach the product they want quickly.",
      },
      logLine: {
        es: "› colecciones · filtros por talla, color y precio activos",
        en: "› collections · size, color and price filters active",
      },
      visualHint: "A filter sidebar slides into the collection page; toggling a color chip narrows the product grid.",
    },
    {
      label: { es: "Ficha", en: "Product page" },
      note: {
        es: "La ficha muestra variantes, fotos, disponibilidad y la información que resuelve dudas antes de comprar.",
        en: "The product page shows variants, photos, availability and the details that answer questions before buying.",
      },
      logLine: {
        es: "› ficha · variantes, galería y datos del producto conectados",
        en: "› product · variants, gallery and product data connected",
      },
      visualHint: "One product card expands into a full product page: gallery on one side, variant selector, stock indicator and an add-to-cart button on the other.",
    },
    {
      label: { es: "Integraciones", en: "Integrations" },
      note: {
        es: "Conecto inventario, facturación, envíos y pagos, y pruebo cada paso del carrito al pago.",
        en: "I connect inventory, invoicing, shipping and payments, and test every step from cart to checkout.",
      },
      logLine: {
        es: "› integraciones · inventario, facturas y envíos sincronizados",
        en: "› integrations · inventory, invoices and shipping in sync",
      },
      visualHint: "A cart drawer opens with one item; lines connect the store to small labeled boxes (inventory, invoicing, shipping, payments) that light up as the test order passes through.",
    },
    {
      label: { es: "Lanzamiento", en: "Launch" },
      note: {
        es: "Activo redirecciones, datos estructurados y eventos de compra, y publico la tienda en tu dominio.",
        en: "I turn on redirects, structured data and purchase events, and publish the store on your domain.",
      },
      logLine: {
        es: "› lanzamiento · redirecciones, analítica y dominio activos",
        en: "› launch · redirects, analytics and domain live",
      },
      visualHint: "Old URLs in a list arrow into new store URLs, an analytics event ticker records a purchase, and the browser bar switches from a preview address to the live domain.",
    },
  ],
  comparison: {
    columns: {
      es: [
        "Tema de la tienda de temas",
        "Tema Shopify a la medida",
        "Tienda a la medida",
      ],
      en: [
        "Theme store theme",
        "Custom Shopify theme",
        "Custom-built store",
      ],
    },
    rows: [
      {
        label: { es: "Diseño", en: "Design" },
        cells: {
          es: [
            "Compartido con otras tiendas; se ajusta dentro de sus opciones",
            "Diseñado para tu marca y tu catálogo",
            "Se construye según lo que necesite el proyecto",
          ],
          en: [
            "Shared with other stores; adjusted within its options",
            "Designed for your brand and your catalog",
            "Built to whatever the project needs",
          ],
        },
      },
      {
        label: { es: "Edición", en: "Editing" },
        cells: {
          es: [
            "Desde el personalizador, con las secciones que trae el tema",
            "Desde el personalizador, con secciones hechas para tu tienda",
            "Desde un panel construido para el proyecto",
          ],
          en: [
            "From the theme editor, with the sections the theme ships with",
            "From the theme editor, with sections made for your store",
            "From a panel built for the project",
          ],
        },
      },
      {
        label: { es: "Modelo de costo del software", en: "Software cost model" },
        cells: {
          es: [
            "Plan mensual, la licencia del tema y las apps de pago que uses",
            "Plan mensual más las apps de pago que uses",
            "Desarrollo propio más alojamiento",
          ],
          en: [
            "Monthly plan, the theme license and any paid apps you use",
            "Monthly plan plus any paid apps you use",
            "Own development plus hosting",
          ],
        },
      },
      {
        label: { es: "Alojamiento y actualizaciones", en: "Hosting and updates" },
        cells: {
          es: [
            "Shopify aloja la tienda y gestiona la plataforma",
            "Shopify aloja la tienda y gestiona la plataforma",
            "Servidor, actualizaciones y seguridad a cargo de quien la desarrolla",
          ],
          en: [
            "Shopify hosts the store and handles the platform",
            "Shopify hosts the store and handles the platform",
            "Server, updates and security are on whoever develops it",
          ],
        },
      },
    ],
    highlight: 1,
  },
  faqs: [
    {
      q: {
        es: "¿Por qué un tema Shopify a la medida y no uno de la tienda de temas?",
        en: "Why a custom Shopify theme instead of one from the theme store?",
      },
      a: {
        es: "Un tema de la tienda de temas sirve para empezar, pero está pensado para muchos negocios a la vez y suele cargar funciones que no usas. Un tema a la medida se construye alrededor de tu catálogo y de cómo compran tus clientes, con solo las secciones que necesitas y editables por ti desde el personalizador.",
        en: "A theme from the theme store works for getting started, but it is designed for many businesses at once and often carries features you do not use. A custom theme is built around your catalog and how your customers buy, with only the sections you need, editable by you in the theme editor.",
      },
    },
    {
      q: {
        es: "Estoy empezando mi negocio: ¿Shopify es buena opción para mi primera tienda en línea?",
        en: "I am starting my business: is Shopify a good option for my first online store?",
      },
      a: {
        es: "Shopify es una buena opción cuando quieres vender sin administrar servidores ni actualizaciones, porque la plataforma aloja la tienda y la mantiene a cambio de un plan mensual. Te ayudo a decidir si encaja con tu catálogo y tus medios de pago. Si estás comparando plataformas, en las páginas de PrestaShop y de WordPress explico en qué se diferencian de Shopify.",
        en: "Shopify is a good option when you want to sell without managing servers or updates, because the platform hosts and maintains the store in exchange for a monthly plan. I help you decide whether it fits your catalog and payment methods. If you are comparing platforms, the PrestaShop and WordPress pages explain how they differ from Shopify.",
      },
    },
    {
      q: {
        es: "¿Cómo migrar mi tienda de WooCommerce, PrestaShop u otra plataforma a Shopify sin perder visitas de Google?",
        en: "How do I migrate my store from WooCommerce, PrestaShop or another platform to Shopify without losing Google traffic?",
      },
      a: {
        es: "Traslado productos, clientes, pedidos y contenido, y creo una redirección 301 de cada URL antigua a su equivalente en Shopify, porque Shopify usa rutas fijas como /products/ y /collections/. Las contraseñas de los clientes no se pueden trasladar, así que preparo la invitación para que cada cliente reactive su cuenta. Nadie puede garantizar que las posiciones en Google se mantengan, pero las redirecciones evitan que los enlaces antiguos terminen en páginas de error.",
        en: "I move products, customers, orders and content, and create a 301 redirect from every old URL to its Shopify equivalent, because Shopify uses fixed paths such as /products/ and /collections/. Customer passwords cannot be transferred, so I prepare the invitation for each customer to reactivate their account. Nobody can guarantee Google rankings will hold, but the redirects keep old links from ending in error pages.",
      },
    },
    {
      q: {
        es: "¿Se puede conectar Shopify con mi sistema de inventario, facturación electrónica o transportadora?",
        en: "Can Shopify connect to my inventory system, electronic invoicing or shipping carrier?",
      },
      a: {
        es: "Sí, siempre que ese sistema ofrezca una API o una app compatible con Shopify. Primero reviso si una app existente lo resuelve bien; si no, construyo una app o integración a la medida que sincroniza pedidos, existencias y facturas sin que tengas que digitarlos dos veces.",
        en: "Yes, as long as that system offers an API or a Shopify-compatible app. I first check whether an existing app handles it well; if not, I build a custom app or integration that syncs orders, stock and invoices so you do not have to enter them twice.",
      },
    },
    {
      q: {
        es: "¿Cuánto cuesta y cuánto tarda desarrollar una tienda Shopify a la medida?",
        en: "How much does a custom Shopify store cost and how long does it take?",
      },
      a: {
        es: "Depende del tamaño del catálogo, de cuántas integraciones necesitas y de si hay una migración. Después de una conversación sobre tu proyecto te entrego una propuesta con alcance, valor y plazo por escrito. El plan mensual de Shopify y las apps de pago se pagan aparte, directamente a Shopify y a cada proveedor.",
        en: "It depends on the size of the catalog, how many integrations you need and whether there is a migration. After a conversation about your project I give you a written proposal with scope, price and timeline. The Shopify monthly plan and paid apps are paid separately, directly to Shopify and to each provider.",
      },
    },
    {
      q: {
        es: "¿Podré editar mi tienda Shopify yo mismo después del lanzamiento?",
        en: "Will I be able to edit my Shopify store myself after launch?",
      },
      a: {
        es: "Sí. Los productos, colecciones, textos, imágenes y el orden de las secciones los manejas tú desde el administrador y el personalizador de Shopify, y te explico cómo hacerlo antes de publicar. Para cambios de diseño o nuevas funciones sigues hablando directamente conmigo.",
        en: "Yes. You manage products, collections, text, images and section order yourself from the Shopify admin and theme editor, and I walk you through it before launch. For design changes or new features you keep talking directly to me.",
      },
    },
  ],
  related: [
    {
      id: "prestashop",
      reason: {
        es: "Si necesitas alojar la tienda en tu propio servidor o tener acceso completo al código, PrestaShop es la alternativa autoalojada a Shopify.",
        en: "If you need to host the store on your own server or have full access to the code, PrestaShop is the self-hosted alternative to Shopify.",
      },
    },
    {
      id: "wordpress",
      reason: {
        es: "Si además de vender vas a publicar contenido, como un blog o guías, WordPress con WooCommerce puede encajar mejor; ahí explico en qué se diferencia de Shopify.",
        en: "If you will publish content such as a blog or guides as well as sell, WordPress with WooCommerce may fit better; that page explains how it differs from Shopify.",
      },
    },
    {
      id: "plugins",
      reason: {
        es: "Cuando ninguna app de Shopify conecta tu inventario, facturación o ERP como lo necesitas, la integración se construye a la medida.",
        en: "When no Shopify app connects your inventory, invoicing or ERP the way you need, the integration is built to order.",
      },
    },
  ],
};
