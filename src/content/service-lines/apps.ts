import type { ServiceLineContent } from "./types";

// Approved copy of the "Web and mobile apps" line page (odd/tasks/site-build-experience.md, T5 and L13).
// The user approved it word for word: change it only with the user's approval. Its slug and name
// live in src/content/services.ts.
//
// Problems this line solves (an editorial note for future copy, not shown on the page): My team
// runs the business on spreadsheets, email and copy-paste; several people edit the same file and
// versions get lost; customers keep asking by message or WhatsApp for order or project status they
// could check themselves; information lives in several tools that do not talk to each other; I need
// a dashboard with figures I currently assemble by hand; I have an idea for a digital product and
// do not know where to start.
export const apps: ServiceLineContent = {
  h1: {
    es: "Desarrollo de aplicaciones web y móviles a la medida",
    en: "Custom web and mobile app development",
  },
  metaTitle: { es: "Aplicaciones web y móviles a la medida", en: "Custom web and mobile app development" },
  metaDescription: {
    es: "Diseño y construyo portales de clientes, paneles internos y productos digitales a la medida, del prototipo a producción. Reemplaza tus hojas de cálculo.",
    en: "I design and build customer portals, internal dashboards and digital products, from first prototype to production. Replace spreadsheets with a real app.",
  },
  summary: {
    es: "Diseño y construyo aplicaciones web y móviles a la medida: portales para tus clientes, paneles internos para tu equipo y productos digitales, desde el primer prototipo hasta producción. Son para negocios que hoy dependen de hojas de cálculo, correos y datos copiados a mano, y para quienes quieren lanzar un producto digital propio. Hablas directamente conmigo, la persona que las construye.",
    en: "I design and build custom web and mobile applications: customer portals, internal dashboards for your team and digital products, from the first prototype to production. They are for businesses that run on spreadsheets, email threads and copy-pasted data, and for people who want to launch a digital product of their own. You talk directly to me, the person who builds them.",
  },
  audience: {
    es: "Para negocios en operación que se quedaron cortos con hojas de cálculo y procesos manuales, y para emprendedores que quieren lanzar un producto digital propio.",
    en: "For operating businesses that have outgrown spreadsheets and manual processes, and for founders who want to launch a digital product of their own.",
  },
  keywords: {
    es: [
      "desarrollo de aplicaciones web a la medida",
      "desarrollo de aplicaciones móviles",
      "software a la medida para empresas",
      "desarrollo de portal de clientes",
      "panel administrativo a la medida",
      "reemplazar excel por un sistema",
      "crear una app para mi negocio",
      "desarrollo de mvp",
    ],
    en: [
      "custom web application development",
      "mobile app development",
      "custom software for small business",
      "customer portal development",
      "internal dashboard development",
      "replace spreadsheets with an app",
      "mvp development",
    ],
  },
  deliverables: [
    {
      code: "<Prototype />",
      title: { es: "Prototipo navegable", en: "Clickable prototype" },
      description: {
        es: "Una versión clicable de las pantallas principales para validar el flujo con tu equipo o tus clientes antes de escribir el código definitivo.",
        en: "A clickable version of the main screens so you can validate the flow with your team or your customers before the final code is written.",
      },
    },
    {
      code: "<DataModel />",
      title: { es: "Modelo de datos", en: "Data model" },
      description: {
        es: "La estructura de tu información (clientes, pedidos, inventario o lo que aplique a tu negocio), diseñada pensando en cómo va a crecer tu negocio.",
        en: "The structure of your information (customers, orders, inventory or whatever your business runs on), designed with how your business will grow in mind.",
      },
    },
    {
      code: "<Screens />",
      title: { es: "Pantallas web y móviles", en: "Web and mobile screens" },
      description: {
        es: "Listas, fichas, formularios y paneles pensados para quien los usa, que funcionan en computador y en teléfono.",
        en: "Lists, detail views, forms and dashboards designed for the people who use them, working on desktop and on phones.",
      },
    },
    {
      code: "<Workflows />",
      title: { es: "Flujos automatizados", en: "Automated workflows" },
      description: {
        es: "Estados, aprobaciones, avisos por correo y validaciones que reemplazan los pasos que hoy haces a mano.",
        en: "Statuses, approvals, email notifications and validations that replace the steps you do by hand today.",
      },
    },
    {
      code: "<Roles />",
      title: { es: "Usuarios y permisos", en: "Users and permissions" },
      description: {
        es: "Inicio de sesión y accesos por rol, para que tu equipo, tus clientes y tú vean y cambien solo lo que les corresponde.",
        en: "Sign-in and role-based access, so your team, your customers and you only see and change what belongs to each of you.",
      },
    },
    {
      code: "<Release />",
      title: { es: "Puesta en producción", en: "Production release" },
      description: {
        es: "Despliegue, dominio, respaldos y documentación, para que sepas cómo está construida la aplicación y cómo seguir creciéndola.",
        en: "Deployment, domain, backups and documentation, so you know how the application is built and how to keep growing it.",
      },
    },
  ],
  buildSteps: [
    {
      label: { es: "Datos", en: "Data" },
      note: {
        es: "Primero ordeno la información: qué guardas, cómo se relaciona y quién la cambia.",
        en: "First I organize the information: what you store, how it relates and who changes it.",
      },
      logLine: {
        es: "› datos · clientes, pedidos y estados con sus relaciones",
        en: "› data · customers, orders and statuses linked together",
      },
      visualHint: "Entity boxes (Customers, Orders, Status) appear one by one and connect with relation lines, like a schema diagram drawing itself.",
    },
    {
      label: { es: "Pantallas", en: "Screens" },
      note: {
        es: "Cada tarea tiene su pantalla: listas, fichas y formularios pensados para quien los usa.",
        en: "Every task gets its own screen: lists, detail views and forms designed for the person using them.",
      },
      logLine: {
        es: "› pantallas · lista, ficha y formulario conectados a los datos",
        en: "› screens · list, detail view and form wired to the data",
      },
      visualHint: "An app shell with sidebar fills in: a table of orders, then a detail panel, then a form, side by side with a phone-sized version.",
    },
    {
      label: { es: "Flujos", en: "Workflows" },
      note: {
        es: "Los pasos que hoy haces a mano pasan a la aplicación: estados, avisos y validaciones.",
        en: "The steps you do by hand today move into the app: statuses, notifications and validations.",
      },
      logLine: {
        es: "› flujos · pedido nuevo → revisión → aprobado, con aviso por correo",
        en: "› workflows · new order → review → approved, with email notice",
      },
      visualHint: "A status pill on an order row moves from New to In review to Approved, and a small email notification card slides in.",
    },
    {
      label: { es: "Permisos", en: "Permissions" },
      note: {
        es: "Cada persona ve y cambia solo lo que le corresponde: tu equipo, tus clientes y tú.",
        en: "Each person sees and changes only what belongs to them: your team, your customers and you.",
      },
      logLine: {
        es: "› permisos · admin, equipo y cliente con accesos distintos",
        en: "› permissions · admin, team and customer with separate access",
      },
      visualHint: "The same screen rendered three ways via a role switcher (Admin, Team, Customer); columns and buttons hide or lock depending on the role.",
    },
    {
      label: { es: "Panel", en: "Dashboard" },
      note: {
        es: "Las cifras que antes armabas en una hoja de cálculo aparecen en un panel, actualizadas.",
        en: "The figures you used to assemble in a spreadsheet show up on a dashboard, kept up to date.",
      },
      logLine: {
        es: "› panel · pedidos por estado y pendientes del día",
        en: "› dashboard · orders by status and today's pending tasks",
      },
      visualHint: "A spreadsheet grid fades out and is replaced by stat tiles and a simple bar chart of orders by status (placeholder values, no real numbers).",
    },
    {
      label: { es: "En vivo", en: "Live" },
      note: {
        es: "La aplicación sale a producción con su dominio y respaldos, lista para abrir en el navegador o en el teléfono.",
        en: "The app goes to production with its domain and backups, ready to open in the browser or on a phone.",
      },
      logLine: {
        es: "› en vivo · desplegada, respaldos activos, lista en web y móvil",
        en: "› live · deployed, backups on, ready on web and mobile",
      },
      visualHint: "A browser window and a phone frame show the finished app with a green 'live' indicator; a sign-in screen appears first, then the dashboard.",
    },
  ],
  comparison: {
    columns: {
      es: [
        "Hojas de cálculo",
        "Software comercial (SaaS)",
        "Aplicación a la medida",
      ],
      en: [
        "Spreadsheets",
        "Off-the-shelf software (SaaS)",
        "Custom application",
      ],
    },
    rows: [
      {
        label: { es: "Ajuste a tu proceso", en: "Fit to your process" },
        cells: {
          es: [
            "Flexibles, pero cada persona termina con su propia versión",
            "Te adaptas a cómo lo diseñó el proveedor",
            "Se construye alrededor de cómo trabajas",
          ],
          en: [
            "Flexible, but everyone ends up with their own version",
            "You adapt to how the vendor designed it",
            "Built around the way you work",
          ],
        },
      },
      {
        label: { es: "Permisos", en: "Permissions" },
        cells: {
          es: [
            "Por archivo, hoja o rango, no por registro ni por acción",
            "Roles definidos por el proveedor",
            "Permisos por rol, registro y acción, según lo necesites",
          ],
          en: [
            "By file, sheet or range, not by record or action",
            "Roles defined by the vendor",
            "Permissions by role, record and action, as you need them",
          ],
        },
      },
      {
        label: { es: "Conexión con otras herramientas", en: "Connecting other tools" },
        cells: {
          es: [
            "Importar y exportar a mano",
            "Las integraciones que el proveedor ofrezca",
            "Se conecta con los sistemas que ya usas cuando tienen una API",
          ],
          en: [
            "Manual import and export",
            "Whatever integrations the vendor offers",
            "Connects to the systems you already use when they have an API",
          ],
        },
      },
      {
        label: { es: "Puesta en marcha", en: "Getting started" },
        cells: {
          es: [
            "Inmediata",
            "Rápida: te registras y configuras",
            "Requiere diseño y desarrollo antes de usarla",
          ],
          en: [
            "Immediate",
            "Quick: sign up and configure",
            "Needs design and development before you can use it",
          ],
        },
      },
    ],
    highlight: 2,
  },
  faqs: [
    {
      q: {
        es: "¿Cómo sé si necesito una aplicación o me basta con Excel o un software existente?",
        en: "How do I know if I need a custom app or if spreadsheets or existing software are enough?",
      },
      a: {
        es: "Hay señales claras: varias personas editan la misma hoja, se pierden versiones, copias datos de una herramienta a otra o tus clientes te escriben para preguntar algo que podrían ver solos. Si un software comercial cubre tu proceso sin forzarlo, te recomiendo usarlo. Una aplicación a la medida tiene sentido cuando tu forma de trabajar es parte de lo que te diferencia o cuando necesitas unir varias herramientas en un solo lugar.",
        en: "There are clear signs: several people edit the same sheet, versions get lost, you copy data from one tool to another, or customers message you to ask for things they could check themselves. If off-the-shelf software covers your process without forcing it, I recommend using it. A custom application makes sense when the way you work is part of what sets you apart, or when you need to bring several tools into one place.",
      },
    },
    {
      q: {
        es: "Estoy empezando mi negocio: ¿tiene sentido construir una aplicación desde ya?",
        en: "I am just starting my business. Does it make sense to build an app right away?",
      },
      a: {
        es: "Depende de qué papel juega la aplicación. Si tu negocio es el producto digital, empiezo contigo por un prototipo y una primera versión con el flujo central, para ponerla frente a usuarios reales antes de construir lo demás. Si la aplicación es para operar, muchas veces conviene arrancar con herramientas existentes y construir cuando tengas claro el proceso que quieres automatizar. Te lo digo con franqueza en la primera conversación.",
        en: "It depends on the role the app plays. If your business is the digital product, I start with you on a prototype and a first version of the core flow, so real users can try it before the rest is built. If the app is for running operations, it often makes sense to start with existing tools and build once the process you want to automate is clear. I tell you honestly in our first conversation.",
      },
    },
    {
      q: {
        es: "¿Desarrollas apps para iOS y Android o solo aplicaciones web?",
        en: "Do you build iOS and Android apps or only web applications?",
      },
      a: {
        es: "Las dos. Muchas veces una aplicación web bien hecha es suficiente, porque se abre desde el navegador del teléfono sin instalar nada. Cuando necesitas estar en App Store y Google Play o un acceso más profundo al teléfono, construyo la app móvil. Publicarla en las tiendas requiere cuentas de desarrollador de Apple y Google, y cada tienda revisa la app antes de aprobarla.",
        en: "Both. Often a well-built web application is enough, because it opens in the phone's browser with nothing to install. When you need to be on the App Store and Google Play, or need deeper access to the phone, I build the mobile app. Publishing to the stores requires Apple and Google developer accounts, and each store reviews the app before approving it.",
      },
    },
    {
      q: {
        es: "¿Qué pasa con la información que ya tengo en Excel u otras herramientas?",
        en: "What happens to the data I already have in spreadsheets or other tools?",
      },
      a: {
        es: "La traigo a la aplicación. Reviso tus archivos, limpio duplicados e inconsistencias y los importo al nuevo modelo de datos, para que empieces con tu historial y no con una base vacía. Si otra herramienta que usas tiene una API, la aplicación también puede conectarse a ella.",
        en: "I bring it into the application. I review your files, clean up duplicates and inconsistencies, and import them into the new data model, so you start with your history instead of an empty database. If another tool you use has an API, the application can connect to it as well.",
      },
    },
    {
      q: {
        es: "¿Cuánto tiempo toma tener la primera versión de la aplicación?",
        en: "How long does it take to get the first version of the app?",
      },
      a: {
        es: "Depende del número de pantallas, roles e integraciones. Trabajo por etapas: primero un prototipo para acordar el alcance, luego una primera versión con lo esencial en producción y después las mejoras. Así empiezas a usarla antes de tener todo construido.",
        en: "It depends on the number of screens, roles and integrations. I work in stages: first a prototype to agree on scope, then a first version with the essentials in production, then improvements. That way you start using it before everything is built.",
      },
    },
    {
      q: {
        es: "¿Cuánto cuesta desarrollar una aplicación a la medida?",
        en: "How much does it cost to build a custom application?",
      },
      a: {
        es: "El costo depende de cuántas pantallas, roles, flujos e integraciones necesita la aplicación. Por eso empiezo definiendo contigo el alcance de una primera versión: con eso claro puedo darte una cifra concreta en lugar de un estimado al aire.",
        en: "The cost depends on how many screens, roles, workflows and integrations the application needs. That is why I start by defining the scope of a first version with you: once that is clear, I can give you a concrete figure instead of a guess.",
      },
    },
  ],
  related: [
    {
      id: "evolution",
      reason: {
        es: "Si ya tienes una aplicación que se volvió difícil de cambiar, la evolución por fases la ordena antes de sumarle funciones.",
        en: "If you already have an app that has become hard to change, phased evolution cleans it up before new features are added.",
      },
    },
    {
      id: "plugins",
      reason: {
        es: "Si la aplicación debe conversar con tu tienda, tu facturación o tu CRM, las integraciones conectan esos sistemas sin copiar datos a mano.",
        en: "If the app needs to talk to your store, invoicing or CRM, integrations connect those systems without copying data by hand.",
      },
    },
    {
      id: "websites",
      reason: {
        es: "Un sitio web a la medida presenta tu negocio al público y lleva a tus clientes hasta el portal donde inician sesión.",
        en: "A custom website presents your business to the public and leads customers to the portal where they sign in.",
      },
    },
  ],
};
