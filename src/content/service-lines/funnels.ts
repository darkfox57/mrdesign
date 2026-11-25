import type { ServiceLineContent } from "./types";

// Approved copy of the "Landing pages and funnels" line page (odd/tasks/site-build-experience.md, T5 and L13).
// The user approved it word for word: change it only with the user's approval. Its slug and name
// live in src/content/services.ts.
//
// Problems this line solves (an editorial note for future copy, not shown on the page): We get
// traffic or visits but almost no inquiries; we pay for ads and do not know which campaign brings
// leads; form submissions arrive by email with no source and get lost; we want to test an offer or
// idea before investing in a full site or store; we are launching a product, service or event and
// need a dedicated page for the campaign.
export const funnels: ServiceLineContent = {
  h1: {
    es: "Diseño de landing pages y embudos de conversión para tus campañas",
    en: "Landing page design and conversion funnels for your campaigns",
  },
  metaTitle: { es: "Landing pages y embudos de conversión", en: "Landing page design and conversion funnels" },
  metaDescription: {
    es: "Diseño landing pages por campaña y embudos de conversión con formularios medidos, para que el tráfico que ya tienes se convierta en contactos.",
    en: "I design campaign landing pages and conversion funnels with measured forms and tracking, so the traffic you already get turns into leads.",
  },
  summary: {
    es: "Diseño y construyo landing pages para campañas concretas y embudos de conversión: páginas con un solo objetivo, formularios que registran de dónde viene cada contacto y medición para saber qué campaña funciona. Es para negocios que ya reciben visitas pero no consultas, y para quienes quieren validar una oferta antes de construir un sitio completo. Hablas directamente conmigo, la persona que la construye.",
    en: "I design and build landing pages for specific campaigns and conversion funnels: pages with a single goal, forms that record where each lead comes from, and tracking that shows which campaign works. It is for businesses that already get visits but no inquiries, and for founders who want to validate an offer before building a full website. You talk directly to me, the person who builds it.",
  },
  audience: {
    es: "Para negocios que pagan anuncios o reciben tráfico sin convertirlo en contactos, y para quienes están empezando y quieren probar una oferta con una sola página antes de invertir en algo más grande.",
    en: "For businesses that run ads or get traffic without turning it into leads, and for people starting out who want to test an offer with a single page before investing in something bigger.",
  },
  keywords: {
    es: [
      "diseño de landing pages",
      "landing page para campañas",
      "embudo de conversión",
      "crear landing page para anuncios",
      "landing page para captar clientes",
      "diseño de embudos de venta",
      "landing page para validar una idea",
      "formulario de contacto con seguimiento de conversiones",
      "landing page vs sitio web",
    ],
    en: [
      "landing page design",
      "campaign landing page",
      "conversion funnel development",
      "landing page for ads",
      "lead generation landing page",
      "sales funnel design",
      "landing page to validate an idea",
      "conversion tracking setup for forms",
      "landing page vs website",
    ],
  },
  deliverables: [
    {
      code: "<CampaignPage />",
      title: { es: "Landing por campaña", en: "Campaign landing page" },
      description: {
        es: "Una página con un solo objetivo, escrita para el anuncio o el mensaje que trae a la persona, sin el menú ni las salidas de un sitio completo.",
        en: "A page with a single goal, written for the ad or message that brings the visitor in, without the menu and exits of a full website.",
      },
    },
    {
      code: "<LeadForm />",
      title: { es: "Formulario medido", en: "Tracked lead form" },
      description: {
        es: "Pide solo los datos necesarios, valida con mensajes claros y guarda cada envío con su origen de campaña para que sepas de dónde llegó.",
        en: "It asks only for the data you need, validates with clear messages and stores every submission with its campaign source so you know where it came from.",
      },
    },
    {
      code: "<FunnelSteps />",
      title: { es: "Embudo por pasos", en: "Step-by-step funnel" },
      description: {
        es: "Conecto la página de captura, la página de gracias y el siguiente paso, como agendar una llamada, escribir por WhatsApp o descargar un recurso.",
        en: "I connect the capture page, the thank-you page and the next step, such as booking a call, writing on WhatsApp or downloading a resource.",
      },
    },
    {
      code: "<Tracking />",
      title: { es: "Medición de conversiones", en: "Conversion tracking" },
      description: {
        es: "Configuro los eventos que importan, como el envío del formulario o el clic a WhatsApp, en las herramientas que ya usas, por ejemplo Google Analytics o el píxel de Meta.",
        en: "I set up the events that matter, such as a form submission or a WhatsApp click, in the tools you already use, for example Google Analytics or the Meta pixel.",
      },
    },
    {
      code: "<Variants />",
      title: { es: "Lista para pruebas A/B", en: "Ready for A/B tests" },
      description: {
        es: "Construyo la página para que puedas probar dos titulares u ofertas y decidir con datos cuál se queda.",
        en: "I build the page so you can test two headlines or offers and decide with data which one stays.",
      },
    },
    {
      code: "<FastMobile />",
      title: { es: "Rápida en el celular", en: "Fast on mobile" },
      description: {
        es: "Una página ligera pensada para quien llega desde un anuncio en el teléfono, porque una página lenta pierde visitas antes de mostrar la oferta.",
        en: "A lightweight page built for people arriving from an ad on their phone, because a slow page loses visitors before it shows the offer.",
      },
    },
  ],
  buildSteps: [
    {
      label: { es: "Oferta", en: "Offer" },
      note: {
        es: "Primero defino una sola acción para la página y el mensaje que la sostiene.",
        en: "First I define a single action for the page and the message that supports it.",
      },
      logLine: {
        es: "› oferta · un objetivo, un titular y un llamado a la acción",
        en: "› offer · one goal, one headline and one call to action",
      },
      visualHint: "A blank canvas where only a headline, a short subhead and a single CTA button fade in; everything else stays as grey placeholder blocks.",
    },
    {
      label: { es: "Estructura", en: "Structure" },
      note: {
        es: "Ordeno las secciones en el orden en que piensa quien llega del anuncio: qué es, para quién, por qué confiar y qué hacer.",
        en: "I order the sections the way someone arriving from an ad thinks: what it is, who it is for, why trust it and what to do.",
      },
      logLine: {
        es: "› estructura · propuesta, beneficios, confianza y acción en su lugar",
        en: "› structure · promise, benefits, trust and action in place",
      },
      visualHint: "Placeholder blocks snap into a single vertical column (hero, benefits, trust, CTA) and the top navigation menu is removed with a strike-through.",
    },
    {
      label: { es: "Formulario", en: "Form" },
      note: {
        es: "El formulario pide solo lo necesario y guarda cada envío con su origen de campaña.",
        en: "The form asks only for what is needed and stores each submission with its campaign source.",
      },
      logLine: {
        es: "› formulario · campos, validación y origen de campaña conectados",
        en: "› form · fields, validation and campaign source wired up",
      },
      visualHint: "A form with three fields assembles; a hidden 'utm_source' tag attaches to it and a sample submission drops into a small leads list.",
    },
    {
      label: { es: "Medición", en: "Tracking" },
      note: {
        es: "Conecto los eventos de conversión para ver qué campaña trae contactos y cuál no.",
        en: "I connect the conversion events to see which campaign brings leads and which does not.",
      },
      logLine: {
        es: "› medición · eventos de envío y clic a WhatsApp registrados",
        en: "› tracking · form submit and WhatsApp click events recorded",
      },
      visualHint: "Small event pins light up on the form button and the WhatsApp button, each drawing a line to a simple funnel diagram (visit → form → thank you).",
    },
    {
      label: { es: "Variantes", en: "Variants" },
      note: {
        es: "Preparo una segunda versión del titular para comparar con datos y no con intuición.",
        en: "I prepare a second version of the headline to compare with data instead of intuition.",
      },
      logLine: {
        es: "› variantes · versión A y versión B listas para repartir tráfico",
        en: "› variants · version A and version B ready to split traffic",
      },
      visualHint: "The page splits into two side-by-side copies labeled A and B that differ only in the headline; no result numbers are shown.",
    },
    {
      label: { es: "En vivo", en: "Live" },
      note: {
        es: "La página sale publicada, rápida en el celular y lista para recibir el tráfico de tu campaña.",
        en: "The page goes live, fast on mobile and ready to receive your campaign traffic.",
      },
      logLine: {
        es: "› en vivo · página publicada y envío de prueba recibido",
        en: "› live · page published and test submission received",
      },
      visualHint: "The page shrinks into a phone frame, a 'live' indicator turns on and a test lead notification appears.",
    },
  ],
  comparison: {
    columns: {
      es: [
        "Landing page o embudo",
        "Sitio web completo",
        "Página de plantilla",
      ],
      en: [
        "Landing page or funnel",
        "Full website",
        "Template page",
      ],
    },
    rows: [
      {
        label: { es: "Objetivo", en: "Goal" },
        cells: {
          es: [
            "Una sola acción por campaña: dejar datos, agendar o comprar",
            "Presentar el negocio, sus servicios y su contenido",
            "Publicar rápido con el diseño que trae la plantilla",
          ],
          en: [
            "One action per campaign: leave details, book or buy",
            "Present the business, its services and its content",
            "Publish quickly with the design the template provides",
          ],
        },
      },
      {
        label: { es: "Navegación", en: "Navigation" },
        cells: {
          es: [
            "Sin menú ni salidas que distraigan de la acción",
            "Menú y varias páginas para explorar",
            "Depende de lo que permita la plantilla",
          ],
          en: [
            "No menu or exits that pull attention away from the action",
            "Menu and several pages to explore",
            "Depends on what the template allows",
          ],
        },
      },
      {
        label: { es: "Medición", en: "Tracking" },
        cells: {
          es: [
            "Eventos de conversión y origen de cada contacto desde el primer día",
            "Analítica general del sitio; las conversiones se configuran aparte",
            "Depende de las integraciones de la herramienta",
          ],
          en: [
            "Conversion events and the source of every lead from day one",
            "General site analytics; conversions are set up separately",
            "Depends on the tool's integrations",
          ],
        },
      },
      {
        label: { es: "Cuándo conviene", en: "Best for" },
        cells: {
          es: [
            "Campañas pagadas, lanzamientos y validar una oferta",
            "Presencia y contenido a largo plazo",
            "Una prueba sencilla sin requisitos de medición",
          ],
          en: [
            "Paid campaigns, launches and validating an offer",
            "Long-term presence and content",
            "A simple test with no tracking requirements",
          ],
        },
      },
    ],
    highlight: 0,
  },
  faqs: [
    {
      q: {
        es: "¿Qué es una landing page y en qué se diferencia de un sitio web?",
        en: "What is a landing page and how is it different from a website?",
      },
      a: {
        es: "Una landing page es una página creada para una campaña y una sola acción, como dejar tus datos o agendar una llamada. Un sitio web presenta todo tu negocio y tiene menú y varias páginas. La landing quita las distracciones para que quien llega desde un anuncio haga una cosa concreta.",
        en: "A landing page is a page built for one campaign and one action, such as leaving your details or booking a call. A website presents your whole business and has a menu and several pages. A landing page removes distractions so someone arriving from an ad does one specific thing.",
      },
    },
    {
      q: {
        es: "¿Por qué mi página recibe visitas pero no contactos?",
        en: "Why does my page get visits but no leads?",
      },
      a: {
        es: "Las causas más comunes son un mensaje que no coincide con el anuncio, demasiadas opciones en la misma página, un formulario largo o confuso y una página lenta en el celular. También pasa que sí llegan contactos, pero no se mide de dónde vienen. Reviso esos puntos y construyo la página para corregirlos y medirlos.",
        en: "The most common causes are a message that does not match the ad, too many options on the same page, a long or confusing form and a page that is slow on mobile. It also happens that leads do arrive but nobody measures where they come from. I review those points and build the page to fix and measure them.",
      },
    },
    {
      q: {
        es: "Estoy empezando un negocio: ¿me sirve una landing page para validar mi idea?",
        en: "I am starting a business: can a landing page help me validate my idea?",
      },
      a: {
        es: "Sí. Una página con tu oferta, un formulario y medición te muestra si hay personas interesadas antes de invertir en un sitio completo o una tienda. Con lo que aprendas de esos contactos decides qué construir después.",
        en: "Yes. A page with your offer, a form and tracking shows you whether people are interested before you invest in a full website or store. What you learn from those leads helps you decide what to build next.",
      },
    },
    {
      q: {
        es: "¿Cómo sé qué campaña me trae clientes?",
        en: "How do I know which campaign brings me customers?",
      },
      a: {
        es: "Cada enlace de campaña lleva parámetros UTM y el formulario guarda ese origen junto con cada envío. Además configuro eventos de conversión en herramientas como Google Analytics o el píxel de Meta. Así puedes comparar campañas por los contactos que generan y no solo por los clics.",
        en: "Each campaign link carries UTM parameters, and the form stores that source with every submission. I also set up conversion events in tools such as Google Analytics or the Meta pixel. That way you can compare campaigns by the leads they generate, not just by clicks.",
      },
    },
    {
      q: {
        es: "¿Puedo editar la landing page después de publicarla?",
        en: "Can I edit the landing page after it is published?",
      },
      a: {
        es: "Sí. Te entrego una página que puedes editar en sus textos e imágenes, y te explico cómo hacerlo. Si un cambio toca la estructura, el formulario o la medición, lo hago yo para no romper el seguimiento.",
        en: "Yes. I deliver a page you can edit in its text and images, and I show you how. If a change affects the structure, the form or the tracking, I make it myself so the tracking keeps working.",
      },
    },
    {
      q: {
        es: "¿Cuánto tiempo toma tener lista una landing page o un embudo?",
        en: "How long does it take to get a landing page or funnel ready?",
      },
      a: {
        es: "Depende de cuántos pasos tenga el embudo, de si ya tienes los textos y las imágenes, y de si tus cuentas de anuncios y analítica ya están creadas. Una sola página con formulario toma menos que un embudo con varias páginas y variantes. Te doy un plazo concreto después de la primera conversación.",
        en: "It depends on how many steps the funnel has, whether you already have the copy and images, and whether your ad and analytics accounts already exist. A single page with a form takes less than a funnel with several pages and variants. I give you a specific timeline after our first conversation.",
      },
    },
  ],
  related: [
    {
      id: "websites",
      reason: {
        es: "Cuando la oferta ya está validada, el siguiente paso suele ser un sitio completo que presente todo el negocio.",
        en: "Once the offer is validated, the next step is often a full website that presents the whole business.",
      },
    },
    {
      id: "plugins",
      reason: {
        es: "Los contactos del formulario pueden llegar directo a tu CRM, tu herramienta de correo o tu WhatsApp con una integración.",
        en: "Form leads can go straight to your CRM, email tool or WhatsApp through an integration.",
      },
    },
    {
      id: "shopify",
      reason: {
        es: "Si el embudo termina en una compra, una tienda Shopify puede recibir esa venta con su propio carrito y pagos.",
        en: "If the funnel ends in a purchase, a Shopify store can take that sale with its own cart and payments.",
      },
    },
  ],
};
