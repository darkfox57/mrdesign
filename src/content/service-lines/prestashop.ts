import type { ServiceLineContent } from "./types";

// Approved copy of the "PrestaShop stores" line page (odd/tasks/site-build-experience.md, T5 and L13).
// The user approved it word for word: change it only with the user's approval. Its slug and name
// live in src/content/services.ts.
//
// Problems this line solves (an editorial note for future copy, not shown on the page): My store
// runs on an old PrestaShop version and I am afraid an update will break it; I need a store feature
// that no existing module provides; I want my store and customer data on my own server instead of a
// hosted platform; I have a large catalog with many variants that is hard to manage; I need payment
// gateways and shipping rules that work in my country.
export const prestashop: ServiceLineContent = {
  h1: {
    es: "Desarrollo de tiendas PrestaShop: tu tienda en tu propio servidor",
    en: "PrestaShop store development, on a server you control",
  },
  metaTitle: {
    es: "Tiendas PrestaShop: desarrollo y actualización",
    en: "PrestaShop store development and upgrades",
  },
  metaDescription: {
    es: "Diseño y construyo tiendas PrestaShop en tu servidor: tiendas nuevas, actualizaciones de versión, módulos a la medida, catálogos grandes y pagos locales.",
    en: "I design and build PrestaShop stores on your own server: new stores, version upgrades, custom modules, large catalogs and local payment integrations.",
  },
  summary: {
    es: "Construyo tiendas PrestaShop nuevas, actualizo tiendas existentes a versiones recientes y desarrollo módulos y temas a la medida. Es para negocios que quieren su tienda en un servidor propio, con control del código y de los datos, y con espacio para catálogos grandes y pagos y envíos locales. Hablas directamente conmigo, la persona que construye tu tienda.",
    en: "I build new PrestaShop stores, upgrade existing ones to current versions, and develop custom modules and themes. It is for businesses that want their store on their own server, with control over the code and the data, and room for large catalogs and local payments and shipping. You talk directly to me, the person who builds your store.",
  },
  audience: {
    es: "Para quien va a empezar una tienda y quiere control desde el primer día, y para negocios que ya venden en PrestaShop y necesitan actualizarla, ampliarla o conectarla con sus pagos y envíos.",
    en: "For people starting a store who want full control from day one, and for businesses already selling on PrestaShop that need to upgrade, extend or connect it to their payments and shipping.",
  },
  keywords: {
    es: [
      "desarrollo de tiendas prestashop",
      "programador prestashop",
      "actualizar prestashop a la última versión",
      "configurar tienda prestashop",
      "tema prestashop personalizado",
      "integrar pasarela de pago en prestashop",
      "tienda prestashop en colombia",
      "prestashop o shopify",
    ],
    en: [
      "prestashop developer",
      "prestashop store development",
      "prestashop upgrade service",
      "prestashop store setup",
      "prestashop theme customization",
      "prestashop payment gateway integration",
      "prestashop migration to new version",
      "prestashop vs shopify",
    ],
  },
  deliverables: [
    {
      code: "<Store />",
      title: { es: "Tienda instalada y configurada", en: "Installed and configured store" },
      description: {
        es: "Instalo PrestaShop en tu servidor y configuro idiomas, monedas, impuestos, zonas y transportistas. Dejo el panel listo para que tú o tu equipo lo usen sin depender de mí.",
        en: "I install PrestaShop on your server and set up languages, currencies, taxes, zones and carriers. The back office is ready for you or your team to run without depending on me.",
      },
    },
    {
      code: "<Theme />",
      title: { es: "Tema a la medida", en: "Custom theme" },
      description: {
        es: "Diseño la tienda con tu marca sobre un tema hijo, de modo que las actualizaciones del tema base no borren tu diseño.",
        en: "I design the store around your brand as a child theme, so updates to the parent theme do not overwrite your design.",
      },
    },
    {
      code: "<Module />",
      title: { es: "Módulos a la medida", en: "Custom modules" },
      description: {
        es: "Cuando ningún módulo existente hace lo que necesitas, construyo uno propio que se conecta por hooks. No modifico el núcleo, así la tienda se puede seguir actualizando.",
        en: "When no existing module does what you need, I build one that plugs in through hooks. I do not modify the core, so the store stays upgradable.",
      },
    },
    {
      code: "<Catalog />",
      title: { es: "Catálogo grande y ordenado", en: "Large, organized catalog" },
      description: {
        es: "Importo productos con sus combinaciones, características y categorías, y configuro la búsqueda por filtros para que tus clientes encuentren rápido lo que buscan.",
        en: "I import products with their combinations, features and categories, and set up faceted search so customers find what they need quickly.",
      },
    },
    {
      code: "<Checkout />",
      title: { es: "Pagos y envíos locales", en: "Local payments and shipping" },
      description: {
        es: "Integro la pasarela de pago que usa tu negocio y defino reglas de envío por zona, peso o valor del pedido. Pruebo compras completas antes de abrir.",
        en: "I integrate the payment gateway your business uses and set shipping rules by zone, weight or order value. I test full purchases before launch.",
      },
    },
    {
      code: "<Upgrade />",
      title: { es: "Actualización de versión", en: "Version upgrade" },
      description: {
        es: "Llevo tu tienda de una versión antigua de PrestaShop a una actual: reviso la compatibilidad de módulos y tema, migro en una copia y solo cambio a producción cuando todo funciona.",
        en: "I move your store from an old PrestaShop version to a current one: I check module and theme compatibility, migrate on a copy, and switch production over only when everything works.",
      },
    },
  ],
  buildSteps: [
    {
      label: { es: "Servidor", en: "Server" },
      note: {
        es: "Instalo PrestaShop en tu servidor y dejo listos idiomas, monedas, impuestos y zonas.",
        en: "I install PrestaShop on your server and set up languages, currencies, taxes and zones.",
      },
      logLine: {
        es: "› servidor · PrestaShop instalado, monedas e impuestos configurados",
        en: "› server · PrestaShop installed, currencies and taxes configured",
      },
      visualHint: "Empty store skeleton: a server block on one side and a back-office wireframe on the other, with settings toggles (language, currency, tax, zones) switching on one by one.",
    },
    {
      label: { es: "Catálogo", en: "Catalog" },
      note: {
        es: "Importo los productos con sus combinaciones y categorías, y activo la búsqueda por filtros.",
        en: "I import products with their combinations and categories, and turn on faceted search.",
      },
      logLine: {
        es: "› catálogo · categorías, combinaciones y filtros indexados",
        en: "› catalog · categories, combinations and filters indexed",
      },
      visualHint: "Rows from a CSV stream into a product grid that fills quickly; a faceted filter sidebar (size, color, price) appears and narrows the grid.",
    },
    {
      label: { es: "Tema", en: "Theme" },
      note: {
        es: "Construyo un tema hijo con tu marca para que las actualizaciones del tema base no borren tu diseño.",
        en: "I build a child theme with your brand so parent-theme updates do not overwrite your design.",
      },
      logLine: {
        es: "› tema · cabecera, portada y ficha de producto con tu marca",
        en: "› theme · header, home and product page in your brand",
      },
      visualHint: "Grey wireframes of the home and product page take on brand colors, typography and product images; a small 'child theme' layer sits above a 'parent theme' layer.",
    },
    {
      label: { es: "Módulos", en: "Modules" },
      note: {
        es: "Conecto las funciones a la medida mediante hooks, sin tocar el núcleo de PrestaShop.",
        en: "I plug custom features in through hooks, without touching the PrestaShop core.",
      },
      logLine: {
        es: "› módulos · hooks registrados, núcleo intacto",
        en: "› modules · hooks registered, core untouched",
      },
      visualHint: "Module blocks snap into labeled hook slots on the page (header, product, cart, checkout) while a central 'core' area stays visibly locked.",
    },
    {
      label: { es: "Pagos", en: "Payments" },
      note: {
        es: "Integro la pasarela de pago y las reglas de envío, y pruebo compras completas de principio a fin.",
        en: "I integrate the payment gateway and shipping rules, and test complete purchases end to end.",
      },
      logLine: {
        es: "› checkout · pasarela conectada, envíos por zona calculados",
        en: "› checkout · gateway connected, shipping by zone calculated",
      },
      visualHint: "Checkout flow: cart, address, shipping options recalculating per zone, then a payment step whose test transaction turns green.",
    },
    {
      label: { es: "En vivo", en: "Live" },
      note: {
        es: "Hago una copia de seguridad, reviso la velocidad y paso la tienda a producción.",
        en: "I take a backup, check speed and move the store to production.",
      },
      logLine: { es: "› en vivo · respaldo hecho, tienda abierta", en: "› live · backup done, store open" },
      visualHint: "A staging-to-production switch flips, a backup badge appears, and the storefront shows a live status indicator.",
    },
  ],
  comparison: {
    columns: {
      es: [
        "PrestaShop",
        "Shopify",
        "Tienda a la medida",
      ],
      en: [
        "PrestaShop",
        "Shopify",
        "Custom-built store",
      ],
    },
    rows: [
      {
        label: { es: "Dónde vive", en: "Where it runs" },
        cells: {
          es: [
            "En tu servidor o hosting",
            "Alojada por Shopify, con plan mensual",
            "Donde decidas",
          ],
          en: [
            "On your server or hosting",
            "Hosted by Shopify, on a monthly plan",
            "Wherever you decide",
          ],
        },
      },
      {
        label: { es: "Código", en: "Code" },
        cells: {
          es: [
            "Abierto: se puede modificar y ampliar con módulos",
            "Plataforma propietaria: se amplía con apps y temas",
            "Código escrito solo para tu tienda",
          ],
          en: [
            "Open source: can be modified and extended with modules",
            "Proprietary platform: extended with apps and themes",
            "Code written only for your store",
          ],
        },
      },
      {
        label: { es: "Mantenimiento", en: "Maintenance" },
        cells: {
          es: [
            "Servidor, actualizaciones y seguridad a tu cargo o del desarrollador",
            "La plataforma se encarga del servidor y las actualizaciones",
            "Servidor, actualizaciones y seguridad a cargo de quien la desarrolla",
          ],
          en: [
            "Server, updates and security are on you or your developer",
            "The platform handles servers and updates",
            "Server, updates and security are on whoever develops it",
          ],
        },
      },
      {
        label: { es: "Cuándo conviene", en: "When it fits" },
        cells: {
          es: [
            "Quieres control del código, los datos y el servidor",
            "Quieres empezar sin administrar un servidor",
            "Tu proceso de venta no encaja en ninguna plataforma",
          ],
          en: [
            "You want control over code, data and server",
            "You want to start without managing a server",
            "Your sales process fits no store platform",
          ],
        },
      },
    ],
    highlight: 0,
  },
  faqs: [
    {
      q: {
        es: "¿Qué diferencia hay entre PrestaShop y Shopify?",
        en: "What is the difference between PrestaShop and Shopify?",
      },
      a: {
        es: "PrestaShop es de código abierto y se instala en tu propio servidor, así que controlas el código, los datos y el alojamiento; a cambio, alguien debe encargarse de actualizaciones y seguridad. Shopify es una plataforma alojada con plan mensual que se ocupa del servidor por ti. Te explico cuál encaja mejor según tu catálogo, tu equipo y cómo quieres crecer.",
        en: "PrestaShop is open source and runs on your own server, so you control the code, the data and the hosting; in exchange, someone has to handle updates and security. Shopify is a hosted platform on a monthly plan that takes care of the server for you. I explain which one fits better based on your catalog, your team and how you want to grow.",
      },
    },
    {
      q: {
        es: "¿Puedes actualizar mi tienda PrestaShop a una versión más reciente?",
        en: "Can you upgrade my PrestaShop store to a newer version?",
      },
      a: {
        es: "Sí. Hago una copia de la tienda, reviso qué módulos y qué tema son compatibles con la nueva versión, reemplazo o adapto los que no lo son y migro productos, clientes y pedidos. Pruebo todo en la copia y solo cambio la tienda en producción cuando funciona igual o mejor.",
        en: "Yes. I make a copy of the store, check which modules and which theme are compatible with the new version, replace or adapt the ones that are not, and migrate products, customers and orders. I test everything on the copy and switch the live store over only when it works as well as before or better.",
      },
    },
    {
      q: {
        es: "¿Puedes crear un módulo de PrestaShop a la medida?",
        en: "Can you build a custom PrestaShop module?",
      },
      a: {
        es: "Sí. Si ningún módulo existente resuelve lo que necesitas, construyo uno propio que se conecta a la tienda por hooks, sin modificar el núcleo de PrestaShop. Así tu tienda se puede seguir actualizando y el módulo queda documentado para quien lo mantenga después.",
        en: "Yes. If no existing module does what you need, I build one that connects to the store through hooks, without modifying the PrestaShop core. That way your store stays upgradable and the module is documented for whoever maintains it later.",
      },
    },
    {
      q: {
        es: "¿Se pueden integrar pagos y envíos locales en PrestaShop?",
        en: "Can PrestaShop work with local payments and shipping?",
      },
      a: {
        es: "Sí. Integro la pasarela de pago que usa tu negocio, con el módulo que ofrece el proveedor o con una integración propia si no existe. Para envíos, configuro reglas por zona, peso o valor del pedido y, cuando la transportadora tiene API, conecto el cálculo de tarifas o las guías.",
        en: "Yes. I integrate the payment gateway your business uses, either with the provider's module or with a custom integration when none exists. For shipping, I set rules by zone, weight or order value and, when the carrier offers an API, I connect rate calculation or shipping labels.",
      },
    },
    {
      q: {
        es: "Voy a empezar mi negocio: ¿me conviene una tienda PrestaShop?",
        en: "I am starting a business: should I use PrestaShop?",
      },
      a: {
        es: "Te conviene si planeas un catálogo grande, quieres que la tienda y los datos sean tuyos y cuentas con alguien que mantenga el servidor. Si prefieres empezar sin administrar nada técnico, una plataforma alojada puede encajar mejor al principio. Lo hablamos antes de construir y te digo con claridad cuál te recomiendo y por qué.",
        en: "It fits if you plan a large catalog, want the store and its data to be yours, and have someone to maintain the server. If you would rather start without managing anything technical, a hosted platform may fit better at first. We talk it through before building, and I tell you clearly which one I recommend and why.",
      },
    },
    {
      q: { es: "¿Cuánto cuesta una tienda PrestaShop?", en: "How much does a PrestaShop store cost?" },
      a: {
        es: "PrestaShop es gratuito por ser de código abierto; lo que cambia el costo es el trabajo: el diseño, el tamaño del catálogo, los módulos a la medida y las integraciones de pago y envío. Aparte pagas el hosting, el dominio y los módulos comerciales que decidas usar. Después de entender tu proyecto te comparto una propuesta con alcance y valor.",
        en: "PrestaShop itself is free because it is open source; what changes the cost is the work: design, catalog size, custom modules and payment and shipping integrations. Separately, you pay for hosting, the domain and any commercial modules you choose. Once I understand your project, I share a proposal with scope and price.",
      },
    },
  ],
  related: [
    {
      id: "shopify",
      reason: {
        es: "Si prefieres no administrar un servidor, una tienda en Shopify es la alternativa alojada a PrestaShop.",
        en: "If you would rather not manage a server, a Shopify store is the hosted alternative to PrestaShop.",
      },
    },
    {
      id: "plugins",
      reason: {
        es: "Para conectar tu tienda con inventario, facturación o un ERP, construyo la integración a la medida.",
        en: "To connect your store with inventory, invoicing or an ERP, I build the custom integration.",
      },
    },
    {
      id: "evolution",
      reason: {
        es: "Si tu tienda PrestaShop acumula módulos, parches o versiones sin soporte, la evolución por fases la ordena mientras sigues vendiendo.",
        en: "If your PrestaShop store has piled up modules, patches or unsupported versions, phased evolution cleans it up while you keep selling.",
      },
    },
  ],
};
