import type { ServiceLineContent } from "./types";

// Approved copy of the "WordPress sites and stores" line page (odd/tasks/site-build-experience.md, T5 and L13).
// The user approved it word for word: change it only with the user's approval. Its slug and name
// live in src/content/services.ts.
//
// Problems this line solves (an editorial note for future copy, not shown on the page): Home
// problems that lead here: 'My site is slow' (especially an existing WordPress site); 'I am afraid
// to edit my site / every change breaks something' or 'I depend on someone else for every small
// change'; 'My site was built with a heavy template or page builder and looks outdated'; 'I want to
// move my site to WordPress or to a new server without losing what I have'; 'I have a content site
// and now I want to sell online (WooCommerce)'.
export const wordpress: ServiceLineContent = {
  h1: {
    es: "Desarrollo WordPress: sitios y tiendas que tu equipo edita sin miedo",
    en: "WordPress development: sites and stores your team can edit with confidence",
  },
  metaTitle: {
    es: "Desarrollo WordPress a la medida y WooCommerce",
    en: "Custom WordPress development and WooCommerce",
  },
  metaDescription: {
    es: "Construyo temas WordPress a la medida, bloques de Gutenberg y tiendas WooCommerce que tu equipo edita sin romper el diseño. También acelero sitios lentos.",
    en: "I build custom WordPress themes, Gutenberg blocks and WooCommerce stores your team can edit without breaking the design. I also speed up slow sites.",
  },
  summary: {
    es: "Diseño y construyo sitios y tiendas en WordPress con temas a la medida, bloques de Gutenberg y WooCommerce, pensados para que tu equipo edite el contenido sin romper el diseño. También migro sitios a WordPress y acelero los que se volvieron lentos. Trabajas directamente conmigo, la persona que lo construye.",
    en: "I design and build WordPress sites and stores with custom themes, Gutenberg blocks and WooCommerce, made so your team can edit content without breaking the design. I also migrate sites to WordPress and speed up the ones that have become slow. You work directly with me, the person who builds it.",
  },
  audience: {
    es: "Para negocios que empiezan y quieren un sitio que puedan actualizar por su cuenta, y para empresas que ya tienen un WordPress lento, difícil de editar o que necesita empezar a vender en línea.",
    en: "For new businesses that want a site they can update on their own, and for established companies whose WordPress site is slow, hard to edit or needs to start selling online.",
  },
  keywords: {
    es: [
      "desarrollo wordpress a la medida",
      "tema wordpress personalizado",
      "desarrollador wordpress en colombia",
      "desarrollo de tienda woocommerce",
      "migrar sitio a wordpress",
      "optimizar velocidad wordpress",
      "bloques gutenberg personalizados",
      "sitio wordpress lento",
      "woocommerce o shopify",
    ],
    en: [
      "custom wordpress development",
      "custom wordpress theme",
      "woocommerce store development",
      "wordpress migration service",
      "speed up wordpress site",
      "custom gutenberg blocks",
      "freelance wordpress developer",
      "fix slow wordpress site",
      "woocommerce vs shopify",
    ],
  },
  deliverables: [
    {
      code: "<Theme />",
      title: { es: "Tema a la medida", en: "Custom theme" },
      description: {
        es: "Un tema propio, hecho para tu marca y tu contenido, sin el peso de una plantilla genérica. Incluye solo el código que tu sitio usa.",
        en: "A theme of your own, made for your brand and your content, without the weight of a generic template. It ships only the code your site uses.",
      },
    },
    {
      code: "<Blocks />",
      title: { es: "Bloques de Gutenberg", en: "Gutenberg blocks" },
      description: {
        es: "Bloques para tus secciones reales, como servicios, testimonios, preguntas o llamados a la acción, con campos claros y estilos protegidos.",
        en: "Blocks for your real sections, such as services, testimonials, FAQs or calls to action, with clear fields and locked styles.",
      },
    },
    {
      code: "<Store />",
      title: { es: "Tienda WooCommerce", en: "WooCommerce store" },
      description: {
        es: "Catálogo, ficha de producto, carrito y pago configurados en WooCommerce, con las pasarelas de pago y los envíos disponibles para tu país.",
        en: "Catalog, product page, cart and checkout set up in WooCommerce, with the payment gateways and shipping options available in your country.",
      },
    },
    {
      code: "<Migration />",
      title: { es: "Migración", en: "Migration" },
      description: {
        es: "Paso tu contenido, usuarios y productos a WordPress, o de un servidor a otro, con redirecciones para que los enlaces existentes lleven a su nueva dirección.",
        en: "I move your content, users and products to WordPress, or from one server to another, with redirects so existing links lead to their new address.",
      },
    },
    {
      code: "<Performance />",
      title: { es: "Rendimiento", en: "Performance" },
      description: {
        es: "Encuentro y corrijo lo que hace lento tu sitio: imágenes, plugins, consultas a la base de datos y caché. Mido antes y después de cada cambio.",
        en: "I find and fix what makes your site slow: images, plugins, database queries and caching. I measure before and after every change.",
      },
    },
    {
      code: "<SafeEditing />",
      title: { es: "Edición segura", en: "Safe editing" },
      description: {
        es: "Roles para cada persona del equipo y una guía corta para publicar y actualizar sin miedo a romper algo.",
        en: "Roles for each person on your team and a short guide to publish and update without fear of breaking anything.",
      },
    },
  ],
  buildSteps: [
    {
      label: { es: "Tema", en: "Theme" },
      note: {
        es: "Primero levanto la base: un tema propio con tu tipografía, tus colores y tu retícula, sin código de sobra.",
        en: "First I set up the base: a theme of your own with your typography, colors and grid, with no extra code.",
      },
      logLine: {
        es: "› tema · tipografía, colores y retícula registrados",
        en: "› theme · typography, colors and grid registered",
      },
      visualHint: "An empty WordPress admin frame; a theme settings panel fills with font, color and spacing tokens, and the front-end skeleton picks them up as they appear.",
    },
    {
      label: { es: "Bloques", en: "Blocks" },
      note: {
        es: "Cada sección de tu sitio se vuelve un bloque con campos claros y estilos que no se desacomodan.",
        en: "Each section of your site becomes a block with clear fields and styles that stay in place.",
      },
      logLine: {
        es: "› bloques · servicio, testimonio y llamado a la acción listos en el editor",
        en: "› blocks · service, testimonial and call to action ready in the editor",
      },
      visualHint: "The Gutenberg block inserter shows custom blocks appearing one by one; each block preview snaps into the page canvas with locked styling.",
    },
    {
      label: { es: "Contenido", en: "Content" },
      note: {
        es: "Cargo o migro tu contenido real y armo las páginas con esos bloques, no con texto de relleno.",
        en: "I load or migrate your real content and assemble the pages with those blocks, not with filler text.",
      },
      logLine: {
        es: "› contenido · páginas, entradas e imágenes en su lugar",
        en: "› content · pages, posts and images in place",
      },
      visualHint: "The pages and posts list populates; grey placeholder bars on the page are replaced by real headings, paragraphs and images.",
    },
    {
      label: { es: "Plantillas", en: "Templates" },
      note: {
        es: "Defino cómo se ven el blog, las categorías y los productos, para que cada página nueva salga bien sin diseñarla de nuevo.",
        en: "I define how the blog, categories and products look, so every new page comes out right without designing it again.",
      },
      logLine: {
        es: "› plantillas · entrada, archivo y producto conectados",
        en: "› templates · single, archive and product connected",
      },
      visualHint: "A site editor template list (Single, Archive, Product); switching between them shows the same content dropping into each layout.",
    },
    {
      label: { es: "Tienda", en: "Store" },
      note: {
        es: "Si vas a vender, configuro WooCommerce con catálogo, carrito, pago y envíos.",
        en: "If you are going to sell, I set up WooCommerce with catalog, cart, checkout and shipping.",
      },
      logLine: {
        es: "› tienda · catálogo, carrito y pago funcionando",
        en: "› store · catalog, cart and checkout working",
      },
      visualHint: "A product grid appears, an item is added to a cart drawer, and a checkout form fills in field by field.",
    },
    {
      label: { es: "En vivo", en: "Live" },
      note: {
        es: "Mido, quito lo que sobra, vuelvo a medir y publico el sitio.",
        en: "I measure, remove what is not needed, measure again and put the site live.",
      },
      logLine: {
        es: "› en vivo · imágenes optimizadas, caché activa, sitio publicado",
        en: "› live · images optimized, cache on, site published",
      },
      visualHint: "A request waterfall shrinks as unused scripts are removed; a speed gauge (no numbers) moves from red to green, then a status badge flips to Live.",
    },
  ],
  comparison: {
    columns: {
      es: [
        "WordPress con tema a la medida",
        "Plantilla comprada + constructor visual",
        "Sitio a la medida con panel propio",
      ],
      en: [
        "WordPress with a custom theme",
        "Bought template + page builder",
        "Custom site with its own panel",
      ],
    },
    rows: [
      {
        label: { es: "Edición del contenido", en: "Editing content" },
        cells: {
          es: [
            "Bloques hechos para tu contenido: editas textos e imágenes sin tocar el diseño",
            "Puedes cambiar todo, incluido el diseño, y es fácil desacomodarlo",
            "Panel propio con solo los campos que el sitio necesita",
          ],
          en: [
            "Blocks made for your content: you edit text and images without touching the design",
            "You can change everything, design included, and it is easy to knock it out of place",
            "Its own panel with only the fields the site needs",
          ],
        },
      },
      {
        label: { es: "Rendimiento", en: "Performance" },
        cells: {
          es: [
            "Carga solo el código que el sitio usa",
            "Suele cargar más código del que cada página necesita",
            "Se ajusta por completo a lo que el sitio necesita",
          ],
          en: [
            "Loads only the code the site uses",
            "Usually loads more code than each page needs",
            "Fully tailored to what the site needs",
          ],
        },
      },
      {
        label: { es: "Diseño", en: "Design" },
        cells: {
          es: [
            "Sin restricciones, hecho para tu marca",
            "Parte de lo que la plantilla y el constructor permiten",
            "Sin restricciones",
          ],
          en: [
            "Unrestricted, made for your brand",
            "Limited to what the template and builder allow",
            "Unrestricted",
          ],
        },
      },
      {
        label: { es: "Tienda y funciones extra", en: "Store and extra features" },
        cells: {
          es: [
            "WooCommerce y miles de plugins del ecosistema WordPress, elegidos con cuidado",
            "WooCommerce y plugins, a veces sumados sin control",
            "Cada función se construye o se integra por separado",
          ],
          en: [
            "WooCommerce and thousands of plugins from the WordPress ecosystem, chosen carefully",
            "WooCommerce and plugins, sometimes piled on without control",
            "Each feature is built or integrated separately",
          ],
        },
      },
    ],
    highlight: 0,
  },
  faqs: [
    {
      q: {
        es: "Estoy empezando mi negocio: ¿me conviene WordPress con WooCommerce o Shopify?",
        en: "I am starting a business: should I use WordPress with WooCommerce or Shopify?",
      },
      a: {
        es: "Depende de cuánto quieras controlar. WordPress y WooCommerce son software libre: contratas tu propio hosting, tienes acceso total al código y a tus datos, y alguien debe mantener las actualizaciones. Shopify es una plataforma alojada con plan mensual que se encarga de la infraestructura por ti. Si tu negocio va a vivir del contenido, como un blog o guías, además de vender, WordPress suele encajar mejor; si solo vas a vender productos y no quieres pensar en el servidor, te recomiendo mirar Shopify. Antes de empezar te explico los dos caminos con tu caso concreto.",
        en: "It depends on how much you want to control. WordPress and WooCommerce are open source: you pay for your own hosting, you have full access to the code and your data, and someone has to keep up with updates. Shopify is a hosted platform with a monthly plan that handles the infrastructure for you. If your business will rely on content, like a blog or guides, as well as sales, WordPress usually fits better; if you only sell products and do not want to think about servers, I suggest looking at Shopify. Before we start, I walk you through both options for your specific case.",
      },
    },
    {
      q: {
        es: "¿Por qué un tema WordPress a la medida y no una plantilla comprada?",
        en: "Why a custom WordPress theme instead of a bought template?",
      },
      a: {
        es: "Una plantilla comprada trae opciones para muchos casos que no son el tuyo, y buena parte de ese código se carga aunque no lo uses. Un tema a la medida incluye solo lo que tu sitio necesita, sigue tu marca sin forzarla y es más fácil de mantener, porque sé exactamente qué hace cada parte.",
        en: "A bought template ships options for many cases that are not yours, and much of that code loads even when you do not use it. A custom theme includes only what your site needs, follows your brand without forcing it and is easier to maintain, because I know exactly what each part does.",
      },
    },
    {
      q: {
        es: "¿Mi equipo puede editar el sitio WordPress sin romper el diseño?",
        en: "Can my team edit the WordPress site without breaking the design?",
      },
      a: {
        es: "Sí, ese es el objetivo. Construyo bloques de Gutenberg para tu contenido real, por ejemplo un bloque de servicio o de testimonio, con campos claros y estilos fijos. Tu equipo cambia textos, imágenes y el orden de las secciones, pero no puede desacomodar colores, tamaños ni espaciados. Además configuro roles para que cada persona vea solo lo que le corresponde.",
        en: "Yes, that is the goal. I build Gutenberg blocks for your real content, such as a service or testimonial block, with clear fields and fixed styles. Your team changes text, images and the order of sections, but cannot knock colors, sizes or spacing out of place. I also set up roles so each person sees only what they need.",
      },
    },
    {
      q: {
        es: "Mi sitio WordPress está lento, ¿se puede arreglar sin rehacerlo?",
        en: "My WordPress site is slow: can it be fixed without rebuilding it?",
      },
      a: {
        es: "Muchas veces sí. Primero mido qué lo hace lento: imágenes sin optimizar, plugins que cargan código en todas las páginas, consultas pesadas a la base de datos o un hosting que se quedó corto. Con eso te explico qué se puede corregir sobre el sitio actual y en qué casos conviene rehacer el tema. Vuelvo a medir después de cada cambio para que veas la diferencia.",
        en: "Often, yes. First I measure what makes it slow: unoptimized images, plugins that load code on every page, heavy database queries or hosting that falls short. Then I explain what can be fixed on the current site and when it makes sense to rebuild the theme. I measure again after every change so you can see the difference.",
      },
    },
    {
      q: {
        es: "¿Puedes migrar mi sitio a WordPress sin perder lo que ya tengo en Google?",
        en: "Can you migrate my site to WordPress without losing what I already have on Google?",
      },
      a: {
        es: "Nadie puede garantizar posiciones en Google, pero cuido ese punto desde el principio. Hago un inventario de tus URLs, conservo las que se pueden conservar, creo redirecciones 301 para las que cambian y paso los títulos y descripciones de cada página. Así Google y tus visitantes encuentran cada página en su nueva dirección. Migro desde otros CMS, desde sitios hechos a mano y entre servidores de WordPress.",
        en: "Nobody can guarantee Google rankings, but I take care of this from the start. I inventory your URLs, keep the ones that can be kept, set up 301 redirects for the ones that change and carry over each page's titles and descriptions. That way Google and your visitors find every page at its new address. I migrate from other CMSs, from hand-built sites and between WordPress servers.",
      },
    },
    {
      q: {
        es: "¿Qué pasa con las actualizaciones y el mantenimiento de WordPress después de lanzar?",
        en: "What happens with WordPress updates and maintenance after launch?",
      },
      a: {
        es: "WordPress, WooCommerce y los plugins publican actualizaciones con frecuencia, y algunas corrigen fallos de seguridad. Al entregar, dejo el sitio con la menor cantidad de plugins posible y documentado, para que actualizar sea sencillo. Si prefieres no encargarte tú, podemos acordar que yo lo mantenga.",
        en: "WordPress, WooCommerce and plugins release updates often, and some of them fix security issues. When I hand over the site, I leave it with as few plugins as possible and documented, so updating is simple. If you prefer not to handle it yourself, we can agree that I maintain it.",
      },
    },
  ],
  related: [
    {
      id: "plugins",
      reason: {
        es: "Cuando tu sitio WordPress o tu tienda WooCommerce necesita una función que ningún plugin resuelve bien o conectarse con otro sistema.",
        en: "When your WordPress site or WooCommerce store needs a feature no existing plugin handles well, or has to connect to another system.",
      },
    },
    {
      id: "shopify",
      reason: {
        es: "Si vas a vender y prefieres una plataforma alojada que se encargue del servidor, Shopify es la alternativa a WooCommerce.",
        en: "If you are going to sell and prefer a hosted platform that handles the server, Shopify is the alternative to WooCommerce.",
      },
    },
    {
      id: "evolution",
      reason: {
        es: "Cuando tu WordPress actual acumula cambios y parches y necesita modernizarse por etapas en lugar de rehacerse de golpe.",
        en: "When your current WordPress site has piled up changes and patches and needs to be modernized in stages instead of rebuilt all at once.",
      },
    },
  ],
};
