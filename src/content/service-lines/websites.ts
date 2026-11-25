import type { ServiceLineContent } from "./types";

// Approved copy of the "Custom websites" line page (odd/tasks/site-build-experience.md, T5 and L13).
// The user approved it word for word: change it only with the user's approval. Its slug and name
// live in src/content/services.ts.
//
// Problems this line solves (an editorial note for future copy, not shown on the page): My website
// looks outdated and no longer reflects the business; I cannot update my own site without calling
// someone; my site is slow on phones or does not show up on Google; I am starting a business and
// need a credible, professional presence; a template or builder limits what I can show about my
// services.
export const websites: ServiceLineContent = {
  h1: {
    es: "Sitios web a la medida para empresas y negocios",
    en: "Custom websites for businesses, built to grow",
  },
  metaTitle: { es: "Sitios web a la medida y páginas corporativas", en: "Custom business websites you can edit" },
  metaDescription: {
    es: "Diseño y construyo sitios web corporativos a la medida: varias páginas, panel para editar tu contenido, carga rápida y base para posicionar en Google.",
    en: "I design and build custom business websites: multiple pages, a panel to edit your own content, fast loading and a technical base ready to rank on Google.",
  },
  summary: {
    es: "Diseño y construyo sitios web corporativos de varias páginas, hechos a la medida de tu negocio, con un panel para que edites el contenido tú mismo. Son rápidos, se ven bien en el celular y salen con la base técnica para posicionarse en Google. Hablas directamente conmigo, la persona que lo construye.",
    en: "I design and build multi-page business websites, made to fit your company, with a panel so you can edit the content yourself. They load fast, work well on phones and launch with the technical groundwork to rank on Google. You talk directly to me, the person who builds it.",
  },
  audience: {
    es: "Para quienes están empezando un negocio y necesitan una presencia seria en internet, y para empresas que ya operan y quieren un sitio que muestre bien lo que hacen y que puedan mantener al día.",
    en: "For people starting a business who need a credible online presence, and for companies already operating that want a site that shows what they do and that they can keep up to date.",
  },
  keywords: {
    es: [
      "diseño de sitios web a la medida",
      "desarrollo de páginas web corporativas",
      "página web para empresa",
      "sitio web corporativo",
      "página web autoadministrable",
      "diseño de página web para pymes",
      "diseño web profesional en Colombia",
    ],
    en: [
      "custom website development",
      "corporate website design",
      "business website developer",
      "custom website with CMS",
      "multi-page website development",
      "SEO-ready business website",
      "freelance web developer for small business",
    ],
  },
  deliverables: [
    {
      code: "<SiteMap />",
      title: { es: "Mapa del sitio", en: "Site map" },
      description: {
        es: "Defino qué páginas tiene el sitio, qué va en cada una y cómo se enlazan entre sí. Es el plano sobre el que se construye todo lo demás.",
        en: "I define which pages the site has, what goes on each one and how they link to each other. It is the plan everything else is built on.",
      },
    },
    {
      code: "<DesignSystem />",
      title: { es: "Diseño visual propio", en: "Your own visual design" },
      description: {
        es: "Tipografía, colores y componentes diseñados para tu marca y reutilizados en todo el sitio. Así cada página nueva mantiene la misma coherencia.",
        en: "Typography, colors and components designed for your brand and reused across the site. Every new page keeps the same consistency.",
      },
    },
    {
      code: "<Pages />",
      title: { es: "Páginas construidas", en: "Site pages" },
      description: {
        es: "Inicio, servicios, sobre la empresa, contacto y las páginas que tu negocio necesite, livianas y adaptadas al celular. Las imágenes se optimizan para que carguen rápido.",
        en: "Home, services, about, contact and whatever pages your business needs, lightweight and adapted to phones. Images are optimized so they load fast.",
      },
    },
    {
      code: "<AdminPanel />",
      title: { es: "Panel de edición", en: "Editing panel" },
      description: {
        es: "Un panel con los campos que tu sitio usa, para que cambies textos, imágenes, servicios o noticias sin tocar código. Solo aparece lo que de verdad editas.",
        en: "A panel with the fields your site uses, so you can change text, images, services or news without touching code. It shows only what you actually edit.",
      },
    },
    {
      code: "<Seo />",
      title: { es: "Base para posicionar", en: "Search groundwork" },
      description: {
        es: "Cada página sale con título, descripción, URL limpia y datos estructurados, más un sitemap para Google. Es la base técnica que un buscador necesita para entender tu sitio.",
        en: "Every page ships with a title, description, clean URL and structured data, plus a sitemap for Google. It is the technical groundwork a search engine needs to understand your site.",
      },
    },
    {
      code: "<ContactForm />",
      title: { es: "Formularios de contacto", en: "Contact forms" },
      description: {
        es: "Formularios con validación que te hacen llegar cada solicitud. Se pueden conectar a tu correo o a la herramienta donde gestionas clientes.",
        en: "Validated forms that deliver every request to you. They can connect to your email or to the tool where you manage clients.",
      },
    },
  ],
  buildSteps: [
    {
      label: { es: "Estructura", en: "Structure" },
      note: {
        es: "Defino el mapa del sitio: qué páginas existen, qué va en cada una y cómo se enlazan.",
        en: "I define the site map: which pages exist, what goes on each and how they link.",
      },
      logLine: {
        es: "› estructura · inicio, servicios, empresa y contacto enlazados",
        en: "› structure · home, services, about and contact linked",
      },
      visualHint: "Grey wireframe boxes appear for each page as a small tree (Home branching to Services, About, Contact), with connecting lines drawing between them.",
    },
    {
      label: { es: "Diseño", en: "Design" },
      note: {
        es: "Armo el sistema visual de tu marca y lo aplico a cada plantilla de página.",
        en: "I build your brand's visual system and apply it to every page template.",
      },
      logLine: {
        es: "› diseño · tipografía, colores y componentes en su lugar",
        en: "› design · typography, colors and components in place",
      },
      visualHint: "The wireframes fill in with a header, hero, section blocks and footer; brand colors and typography fade in over the grey boxes.",
    },
    {
      label: { es: "Contenido", en: "Content" },
      note: {
        es: "Conecto cada sección a un panel para que tú edites textos e imágenes sin tocar código.",
        en: "I connect each section to a panel so you can edit text and images without touching code.",
      },
      logLine: {
        es: "› panel · servicios y noticias editables desde el panel",
        en: "› panel · services and news editable from the panel",
      },
      visualHint: "A small admin panel slides in beside the page; typing in a field updates the matching heading and image on the page in real time.",
    },
    {
      label: { es: "SEO", en: "SEO" },
      note: {
        es: "Cada página recibe su título, descripción, URL limpia y datos estructurados.",
        en: "Each page gets its title, description, clean URL and structured data.",
      },
      logLine: {
        es: "› seo · metadatos, sitemap y datos estructurados listos",
        en: "› seo · metadata, sitemap and structured data ready",
      },
      visualHint: "A search-result style preview card appears under the page showing the title, URL and description; a sitemap list ticks each page as indexed-ready.",
    },
    {
      label: { es: "Rendimiento", en: "Performance" },
      note: {
        es: "Optimizo imágenes y carga para que el sitio abra rápido también en el celular.",
        en: "I optimize images and loading so the site opens fast on phones too.",
      },
      logLine: {
        es: "› rendimiento · imágenes optimizadas y carga diferida activas",
        en: "› performance · optimized images and lazy loading on",
      },
      visualHint: "The page shrinks into a phone frame; heavy image placeholders compress and load in sequence as the view scrolls, with a simple load bar filling quickly.",
    },
    {
      label: { es: "En vivo", en: "Live" },
      note: {
        es: "Conecto el dominio, los formularios y la analítica, y el sitio se publica.",
        en: "I connect the domain, forms and analytics, and the site goes live.",
      },
      logLine: {
        es: "› publicación · dominio, formularios y analítica conectados",
        en: "› launch · domain, forms and analytics connected",
      },
      visualHint: "The browser address bar fills with the domain, the contact form sends a test message with a check mark, and a 'live' status dot turns on.",
    },
  ],
  comparison: {
    columns: {
      es: [
        "Constructor visual en línea",
        "WordPress",
        "Sitio a la medida",
      ],
      en: [
        "Online website builder",
        "WordPress",
        "Custom website",
      ],
    },
    rows: [
      {
        label: { es: "Diseño", en: "Design" },
        cells: {
          es: [
            "Parte de las plantillas del servicio y se ajusta dentro de sus límites.",
            "Parte de un tema, que puede ser comprado o desarrollado a la medida.",
            "Se diseña desde cero para tu marca y tu contenido.",
          ],
          en: [
            "Starts from the service's templates and is adjusted within their limits.",
            "Starts from a theme, which can be bought or custom-built.",
            "Designed from scratch for your brand and your content.",
          ],
        },
      },
      {
        label: { es: "Edición del contenido", en: "Content editing" },
        cells: {
          es: [
            "Editor visual del propio servicio.",
            "Panel de WordPress, muy completo y con muchas opciones.",
            "Panel con solo los campos que tu sitio necesita.",
          ],
          en: [
            "The service's own visual editor.",
            "The WordPress dashboard, very complete and with many options.",
            "A panel with only the fields your site needs.",
          ],
        },
      },
      {
        label: { es: "Alojamiento", en: "Hosting" },
        cells: {
          es: [
            "Lo aloja el mismo servicio, con un plan de pago periódico.",
            "Software libre que se instala en el hosting que elijas.",
            "Se publica en el servidor o plataforma que se elija para el proyecto.",
          ],
          en: [
            "Hosted by the service itself on a recurring paid plan.",
            "Open-source software installed on the hosting you choose.",
            "Deployed on the server or platform chosen for the project.",
          ],
        },
      },
      {
        label: { es: "Mantenimiento", en: "Maintenance" },
        cells: {
          es: [
            "Lo gestiona el proveedor del servicio.",
            "Requiere actualizar el núcleo, el tema y los plugins con regularidad.",
            "Incluye solo lo que el sitio usa, así hay menos piezas que actualizar.",
          ],
          en: [
            "Handled by the service provider.",
            "Requires regular updates to the core, theme and plugins.",
            "Includes only what the site uses, so there are fewer parts to update.",
          ],
        },
      },
    ],
    highlight: 2,
  },
  faqs: [
    {
      q: {
        es: "¿Qué es un sitio web a la medida y en qué se diferencia de una plantilla?",
        en: "What is a custom website and how is it different from a template?",
      },
      a: {
        es: "Un sitio web a la medida se diseña y se construye para tu negocio en particular: su estructura, su diseño y su panel de edición parten de lo que necesitas mostrar. Una plantilla parte de un diseño genérico que se adapta a muchos negocios, y lo que puedes cambiar depende de los límites de esa plantilla.",
        en: "A custom website is designed and built for your specific business: its structure, design and editing panel start from what you need to show. A template starts from a generic design meant for many businesses, and what you can change depends on that template's limits.",
      },
    },
    {
      q: {
        es: "¿Puedo actualizar el contenido de mi página web yo mismo?",
        en: "Can I update my website's content myself?",
      },
      a: {
        es: "Sí. Cada sitio incluye un panel donde cambias textos, imágenes, servicios o publicaciones sin tocar código. Configuro el panel con los campos que tu sitio usa, para que editar sea claro y no rompa el diseño.",
        en: "Yes. Every site includes a panel where you change text, images, services or posts without touching code. I set up the panel with the fields your site uses, so editing is clear and does not break the design.",
      },
    },
    {
      q: {
        es: "Estoy empezando mi negocio: ¿qué páginas debería tener mi primer sitio web?",
        en: "I am starting a business: which pages should my first website have?",
      },
      a: {
        es: "Para empezar suelen bastar inicio, servicios, una página sobre ti o tu empresa y contacto. Si ofreces varios servicios o quieres aparecer en Google por distintas búsquedas, cada servicio puede tener su propia página. Si por ahora vas a promocionar una sola oferta, una landing page puede ser el primer paso, y te explico cuál encaja con tu etapa.",
        en: "To start, a home page, services, an about page and contact are usually enough. If you offer several services or want to show up on Google for different searches, each service can have its own page. If for now you are promoting a single offer, a landing page can be the first step, and I explain which one fits your stage.",
      },
    },
    {
      q: { es: "¿Mi sitio web va a aparecer en Google?", en: "Will my website show up on Google?" },
      a: {
        es: "El sitio sale con la base técnica que Google necesita para entenderlo: títulos y descripciones por página, URLs limpias, datos estructurados, sitemap y carga rápida en celular. La posición en los resultados depende también del contenido y de la competencia en tu sector, así que ningún desarrollador puede prometer un lugar específico.",
        en: "The site launches with the technical groundwork Google needs to understand it: per-page titles and descriptions, clean URLs, structured data, a sitemap and fast loading on phones. Ranking also depends on your content and the competition in your industry, so no developer can promise a specific position.",
      },
    },
    {
      q: { es: "¿Cuánto cuesta hacer un sitio web corporativo?", en: "How much does a corporate website cost?" },
      a: {
        es: "El valor depende de cuántas páginas tiene el sitio, de qué contenido se edita desde el panel, de los idiomas y de las integraciones que necesites. Después de hablar sobre tu proyecto, te propongo un alcance concreto con su valor.",
        en: "The cost depends on how many pages the site has, which content is edited from the panel, the languages and the integrations you need. After we talk about your project, I propose a concrete scope with its price.",
      },
    },
    {
      q: {
        es: "¿Cuánto tiempo toma hacer una página web para mi empresa?",
        en: "How long does it take to build a website for my business?",
      },
      a: {
        es: "El tiempo depende del número de páginas, de si el contenido ya está listo y de la cantidad de rondas de revisión. Antes de empezar te comparto un plan por etapas, de la estructura a la publicación, para que sepas qué viene en cada momento.",
        en: "The time depends on the number of pages, whether the content is ready and how many review rounds there are. Before starting, I share a stage-by-stage plan, from structure to launch, so you know what comes at each point.",
      },
    },
  ],
  related: [
    {
      id: "funnels",
      reason: {
        es: "Un sitio corporativo presenta todo el negocio; las landing pages llevan campañas puntuales hacia una sola acción y se enlazan con él.",
        en: "A corporate site presents the whole business; landing pages drive specific campaigns toward one action and link back to it.",
      },
    },
    {
      id: "evolution",
      reason: {
        es: "Si ya tienes un sitio que se quedó corto, rediseñarlo o reconstruirlo por partes puede ser el primer paso.",
        en: "If you already have a site that falls short, redesigning or rebuilding it in stages can be the first step.",
      },
    },
    {
      id: "plugins",
      reason: {
        es: "Cuando el sitio necesita hablar con tu CRM, tu sistema de reservas u otra herramienta, la integración se construye aparte.",
        en: "When the site needs to talk to your CRM, booking system or another tool, that integration is built separately.",
      },
    },
  ],
};
