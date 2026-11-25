import type { Locale } from "@/i18n/routing";
import type { ServiceId } from "./service-catalog";

// Approved copy of the founder guide, /empezar-mi-negocio-en-linea (odd/tasks/site-build-experience.md,
// T6, S6, S8; approved word for word in L16). Change it only with the user's approval. Server-only:
// no client module may import it (src/content/service-lines/client-boundary.test.ts).

type Localized<T> = Record<Locale, T>;

export type FounderGuideItem = {
  title: Localized<string>;
  body: Localized<string>;
  // The line of work this item leads to, with the approved link text.
  link?: { line: ServiceId; label: Localized<string> };
};

export type FounderGuideSection = {
  // The in-page anchor of the section.
  id: string;
  title: Localized<string>;
  intro: Localized<string>;
  items: FounderGuideItem[];
};

export type FounderGuide = {
  // The page's localized pathname, without the leading slash (src/i18n/routing.ts).
  slug: Localized<string>;
  metaTitle: Localized<string>;
  metaDescription: Localized<string>;
  h1: Localized<string>;
  // The answer-first paragraph under the h1.
  lead: Localized<string>;
  // The searches the page targets. Editorial reference only: never rendered, never a meta tag.
  keywords: Localized<string[]>;
  // Six steps of the guide's build stage. `visualHint` describes what its screen shows at that step.
  buildSteps: { label: Localized<string>; note: Localized<string>; logLine: Localized<string>; visualHint: string }[];
  sections: FounderGuideSection[];
  faqs: { q: Localized<string>; a: Localized<string> }[];
  cta: { title: Localized<string>; text: Localized<string>; button: Localized<string> };
};

export const founderGuide: FounderGuide = {
  slug: { es: "empezar-mi-negocio-en-linea", en: "start-my-business-online" },
  metaTitle: { es: "Cómo empezar tu negocio en línea, paso a paso", en: "How to start a business online, step by step" },
  metaDescription: {
    es: "Qué necesitas primero para empezar tu negocio en línea: redes, una web, una tienda o una app. Pasos en orden, plataformas y errores que conviene evitar.",
    en: "What you need first to start a business online: social media, a website, a store or an app. The steps in order, platform choices and mistakes to avoid.",
  },
  h1: {
    es: "Cómo empezar tu negocio en línea, paso a paso",
    en: "How to start your business online, step by step",
  },
  lead: {
    es: "Para empezar tu negocio en línea, define primero qué vas a vender y a quién, y comprueba que alguien lo compra con los canales que ya tienes, como WhatsApp o Instagram; en esa etapa quizá todavía no necesitas una página web. Cuando el chat se quede corto, asegura un dominio propio y lanza una primera versión pequeña: un sitio sencillo o una tienda en la plataforma que encaje con tu catálogo. No necesitas todo desde el primer día, sino lo mínimo para empezar a vender, construido para que pueda crecer.",
    en: "To start a business online, first decide what you will sell and to whom, and check that people will buy it using the channels you already have, such as WhatsApp or Instagram; at that stage you may not need a website yet. When chat stops being enough, secure your own domain and launch a small first version: a simple website, or a store on the platform that fits your catalog. You don't need everything on day one, just the minimum to start selling, built so it can grow.",
  },
  keywords: {
    es: [
      "empezar mi negocio en línea",
      "cómo empezar un negocio por internet",
      "cómo vender por internet desde cero",
      "necesito página web para mi emprendimiento",
      "página web o redes sociales para mi negocio",
      "cómo empezar un negocio online desde cero",
      "cómo crear una tienda virtual en Colombia",
      "qué necesito para vender por internet en Colombia",
    ],
    en: [
      "how to start a business online",
      "how to start an online business step by step",
      "do I need a website for my small business",
      "how to sell online without a website",
      "do I need a website if I sell on instagram",
      "best ecommerce platform for beginners",
      "what do I need to start an online store",
      "landing page or website for a new business",
    ],
  },
  buildSteps: [
    {
      label: { es: "Idea y cliente", en: "Idea and customer" },
      note: {
        es: "Qué vendes, a quién y por qué te compraría a ti.",
        en: "What you sell, to whom, and why they would buy from you.",
      },
      logLine: { es: "› brief · producto y cliente definidos", en: "› brief · product and customer defined" },
      visualHint: "An empty canvas with a single sticky-note style card: a product name, one line describing the customer and one line on why they would buy. Nothing else exists yet.",
    },
    {
      label: { es: "Validación", en: "Validation" },
      note: {
        es: "Pruebas la oferta con los canales que ya tienes antes de construir.",
        en: "You test the offer on the channels you already have before building anything.",
      },
      logLine: { es: "› whatsapp · primeros pedidos recibidos", en: "› whatsapp · first orders received" },
      visualHint: "Next to the card, a phone frame appears with a short chat thread: a customer asks about the product and a payment link is shared. The card gets a small checkmark.",
    },
    {
      label: { es: "Dominio y marca", en: "Domain and brand" },
      note: {
        es: "Un dominio a tu nombre y un correo profesional desde el principio.",
        en: "A domain in your name and a professional email address from the start.",
      },
      logLine: { es: "› dns · dominio propio activo", en: "› dns · own domain active" },
      visualHint: "A browser frame slides in with the address bar filling in a placeholder domain (tunegocio.com / yourbusiness.com). A simple logo mark and an email address line appear beside it.",
    },
    {
      label: { es: "Primera versión", en: "First version" },
      note: {
        es: "Las páginas mínimas: qué ofreces, para quién y cómo comprarte o escribirte.",
        en: "The minimum pages: what you offer, who it is for, and how to buy from you or get in touch.",
      },
      logLine: { es: "› site · páginas publicadas", en: "› site · pages published" },
      visualHint: "Inside the browser frame, the page assembles block by block: a header with the logo, a clear headline, a few product cards and a contact button. Placeholder text resolves into real-looking copy.",
    },
    {
      label: { es: "Pagos y envíos", en: "Payments and shipping" },
      note: {
        es: "Cobrar en línea y entregar sin coordinar cada pedido a mano.",
        en: "Taking payments online and delivering without arranging every order by hand.",
      },
      logLine: { es: "› checkout · pasarela de pago conectada", en: "› checkout · payment gateway connected" },
      visualHint: "A cart icon and a checkout panel attach to the product cards: an order summary, a payment step and a shipping option. A thin connector line links the checkout to a generic payment block, with no brand logos.",
    },
    {
      label: { es: "Primera venta", en: "First sale" },
      note: {
        es: "Mides qué funciona y decides qué sigue en la siguiente fase.",
        en: "You measure what works and decide what comes next in the following phase.",
      },
      logLine: { es: "› analytics · primer pedido registrado", en: "› analytics · first order recorded" },
      visualHint: "A small analytics panel appears under the browser with an unlabeled line trending gently up and a single highlighted event marked 'order'. No numbers, dates or currency are shown. A faint outline of a larger 'next version' frame sits behind the site to suggest growth.",
    },
  ],
  sections: [
    {
      id: "que-necesitas-primero",
      title: {
        es: "¿Qué necesitas primero: redes, una web, una tienda o una app?",
        en: "What do you need first: social media, a website, a store or an app?",
      },
      intro: {
        es: "No siempre necesitas una página web el primer día. Si todavía estás comprobando que la gente compra, las redes sociales y WhatsApp pueden ser suficientes. Una web se gana su lugar cuando necesitas que te encuentren personas que no te conocen, que confíen en ti o recibir pedidos y pagos sin hacerlo todo por chat. Así te ayudo a decidirlo:",
        en: "You don't always need a website on day one. If you are still checking whether people will buy, social media and WhatsApp can be enough. A website earns its place when you need strangers to find you and trust you, or when you want to take orders and payments without handling everything by chat. Here is how I help founders decide:",
      },
      items: [
        {
          title: { es: "Solo redes sociales y WhatsApp", en: "Social media and WhatsApp only" },
          body: {
            es: "Tiene sentido mientras validas tu idea, le vendes sobre todo a personas que ya te conocen y los pedidos que llegan los puedes atender uno por uno en el chat. Es rápido de arrancar, pero tiene un límite: la cuenta no es tuya del todo, cada venta depende de una conversación y es difícil que te encuentre alguien que no te sigue. Cuando el chat se vuelve el cuello de botella, es momento del siguiente paso.",
            en: "It makes sense while you validate your idea, sell mostly to people who already know you and can handle each order one by one in chat. It is quick to start, but it has a ceiling: you don't fully own the account, every sale depends on a conversation, and people who don't follow you rarely find you. When the chat becomes the bottleneck, it is time for the next step.",
          },
        },
        {
          title: { es: "Un sitio web sencillo", en: "A simple website" },
          body: {
            es: "Conviene cuando necesitas que te tomen en serio personas que no te conocen, que te encuentren en Google o tener un lugar propio a donde llevar a tus clientes. Para empezar bastan pocas páginas bien escritas: qué haces, para quién, cómo trabajas y cómo contactarte. Si vas a lanzar una campaña concreta, una landing page con un solo objetivo puede ser la primera versión.",
            en: "It makes sense when you need people who don't know you to take you seriously, to be found on Google, or to have a place of your own to send customers. A few well-written pages are enough to start: what you do, who it is for, how you work and how to reach you. If you are launching a specific campaign, a landing page with a single goal can be your first version.",
          },
          link: {
            line: "websites",
            label: { es: "Sitios web a la medida", en: "Custom business websites" },
          },
        },
        {
          title: { es: "Una tienda en línea (tienda virtual)", en: "An online store" },
          body: {
            es: "Conviene cuando ya comprobaste que la gente compra, tu catálogo no cabe en un chat y quieres que el cliente elija, pague y deje sus datos de envío sin que tengas que coordinar cada pedido a mano. La plataforma correcta depende de tu catálogo y de cómo despachas; más abajo te explico cómo elegirla.",
            en: "It makes sense once you know people buy, your catalog no longer fits in a chat, and you want customers to choose, pay and enter their shipping details without you arranging every order by hand. The right platform depends on your catalog and how you ship; I explain how to choose it further down.",
          },
        },
        {
          title: { es: "Una aplicación a la medida", en: "A custom app" },
          body: {
            es: "Solo conviene cuando el producto mismo es software, o cuando tu negocio depende de un proceso que ninguna plataforma resuelve: reservas con reglas propias, un portal para tus clientes, una herramienta que vas a vender. Si tu negocio es vender productos o servicios, casi nunca es el primer paso. En ese caso te propongo empezar con un prototipo que pruebe la idea.",
            en: "It only makes sense when the product itself is software, or when your business depends on a process no platform handles: bookings with your own rules, a customer portal, a tool you plan to sell. If your business sells products or services, it is rarely the first step. In that case I suggest starting with a prototype that tests the idea.",
          },
          link: {
            line: "apps",
            label: { es: "Aplicaciones a la medida", en: "Custom apps" },
          },
        },
      ],
    },
    {
      id: "pasos-para-lanzar",
      title: {
        es: "¿Cuáles son los pasos para empezar un negocio en línea?",
        en: "What are the steps to start a business online?",
      },
      intro: {
        es: "Son seis pasos, en este orden: define qué vendes y a quién, valida con los canales que ya tienes, asegura tu dominio y tu correo, lanza una primera versión pequeña, conecta pagos y envíos, y mide para decidir la siguiente fase. El orden importa más que la herramienta.",
        en: "There are six steps, in this order: define what you sell and to whom, validate on the channels you already have, secure your domain and email, launch a small first version, connect payments and shipping, and measure to plan the next phase. The order matters more than the tool.",
      },
      items: [
        {
          title: { es: "1. Define qué vendes y a quién", en: "1. Define what you sell and to whom" },
          body: {
            es: "Escribe en una frase qué ofreces, para quién es y por qué te elegirían a ti. Esa frase va a guiar los textos, la plataforma y lo que construyes primero. Si no la tienes clara, ninguna página web lo va a resolver.",
            en: "Write in one sentence what you offer, who it is for and why they would choose you. That sentence will guide your copy, your platform and what you build first. If it isn't clear yet, no website will fix that.",
          },
        },
        {
          title: {
            es: "2. Valida con los canales que ya tienes",
            en: "2. Validate on the channels you already have",
          },
          body: {
            es: "Antes de invertir en una tienda, ofrece tu producto por WhatsApp, Instagram o un marketplace y mira si alguien compra. Una landing page con un formulario también sirve para medir el interés. Lo que aprendas aquí define qué necesita tu primera versión.",
            en: "Before investing in a store, offer your product through WhatsApp, Instagram or a marketplace and see whether anyone buys. A landing page with a form also works to measure interest. What you learn here defines what your first version needs.",
          },
          link: {
            line: "funnels",
            label: { es: "Landing pages para validar", en: "Landing pages to validate an idea" },
          },
        },
        {
          title: {
            es: "3. Asegura tu dominio y tu correo profesional",
            en: "3. Secure your domain and professional email",
          },
          body: {
            es: "Registra un dominio a tu nombre, no al de un proveedor, y crea un correo con ese dominio. Es lo primero que conviene tener propio, porque tus clientes, tus enlaces y tu posicionamiento se van a construir sobre él.",
            en: "Register a domain in your own name, not a provider's, and set up an email address on it. It is the first thing worth owning, because your customers, your links and your search presence will be built on it.",
          },
        },
        {
          title: { es: "4. Lanza una primera versión pequeña", en: "4. Launch a small first version" },
          body: {
            es: "Publica solo lo que necesitas para empezar a vender: qué ofreces, para quién, cómo comprar o contactarte y tus políticas. Lo demás puede esperar a la siguiente fase. Una primera versión bien hecha se amplía; no se tira.",
            en: "Publish only what you need to start selling: what you offer, who it is for, how to buy or get in touch, and your policies. Everything else can wait for the next phase. A well-built first version gets extended, not thrown away.",
          },
          link: {
            line: "websites",
            label: { es: "Sitios web a la medida", en: "Custom business websites" },
          },
        },
        {
          title: { es: "5. Conecta pagos y envíos", en: "5. Connect payments and shipping" },
          body: {
            es: "Elige cómo vas a cobrar (una pasarela de pago o enlaces de pago) y cómo vas a entregar, y haz una compra de prueba completa antes de anunciarte. Revisa que el medio de pago acepte los métodos que de verdad usan tus clientes.",
            en: "Decide how you will take payments (a payment gateway or payment links) and how you will deliver, and run a full test purchase before you announce anything. Check that your payment provider accepts the methods your customers actually use.",
          },
        },
        {
          title: {
            es: "6. Lanza, mide y decide la siguiente fase",
            en: "6. Launch, measure and plan the next phase",
          },
          body: {
            es: "Instala analítica desde el principio para saber de dónde llegan tus visitas y qué páginas generan pedidos o mensajes. Con esos datos decides qué construir después, en lugar de adivinar.",
            en: "Set up analytics from the start so you know where your visitors come from and which pages lead to orders or messages. With that data you decide what to build next instead of guessing.",
          },
        },
      ],
    },
    {
      id: "elegir-plataforma",
      title: {
        es: "¿Qué plataforma elegir para tu tienda: Shopify, PrestaShop, WooCommerce o a la medida?",
        en: "Which platform should you choose for your store: Shopify, PrestaShop, WooCommerce or custom?",
      },
      intro: {
        es: "La mejor plataforma es la que encaja con tu catálogo, con quién va a operar la tienda día a día y con cómo despachas, no la que está de moda. Comparo las opciones con estos criterios: tamaño del catálogo, quién la administra, pagos y envíos locales, integraciones que vas a necesitar y cuánto control quieres sobre el código y los datos.",
        en: "The best platform is the one that fits your catalog, who will run the store day to day and how you ship, not the one everyone is talking about. I compare the options on these criteria: catalog size, who manages it, local payments and shipping, the integrations you will need, and how much control you want over the code and the data.",
      },
      items: [
        {
          title: { es: "Shopify", en: "Shopify" },
          body: {
            es: "Una plataforma alojada: no administras servidores ni actualizaciones, y la operas desde un panel. Conviene si quieres concentrarte en vender y prefieres que la infraestructura sea problema de otro. A cambio, trabajas dentro de las reglas de Shopify y algunas funciones dependen de apps.",
            en: "A hosted platform: you don't manage servers or updates, and you run it from a dashboard. It suits you if you want to focus on selling and would rather leave the infrastructure to someone else. The trade-off: you work within Shopify's rules, and some features depend on apps.",
          },
          link: {
            line: "shopify",
            label: { es: "Tiendas Shopify", en: "Shopify stores" },
          },
        },
        {
          title: { es: "PrestaShop", en: "PrestaShop" },
          body: {
            es: "Código abierto que instalas en un servidor propio. Conviene si quieres control total del código y de los datos, o necesitas modificar a fondo el catálogo, los pagos o los envíos. Requiere alojamiento y mantenimiento técnico, así que conviene tener a alguien que lo cuide.",
            en: "Open-source software you install on your own server. It suits you if you want full control over the code and the data, or need to deeply customize your catalog, payments or shipping. It needs hosting and technical upkeep, so it helps to have someone looking after it.",
          },
          link: {
            line: "prestashop",
            label: { es: "Tiendas PrestaShop", en: "PrestaShop stores" },
          },
        },
        {
          title: { es: "WooCommerce (WordPress)", en: "WooCommerce (WordPress)" },
          body: {
            es: "La tienda vive dentro de WordPress. Conviene si el contenido pesa tanto como la venta (un blog, guías, páginas de servicio) o si ya usas WordPress. Igual que PrestaShop, necesita alojamiento y que alguien mantenga al día los plugins y las actualizaciones.",
            en: "The store lives inside WordPress. It suits you if content matters as much as sales (a blog, guides, service pages) or if you already use WordPress. Like PrestaShop, it needs hosting and someone to keep plugins and updates current.",
          },
          link: {
            line: "wordpress",
            label: { es: "WordPress y WooCommerce", en: "WordPress and WooCommerce" },
          },
        },
        {
          title: { es: "Una tienda o plataforma a la medida", en: "A custom store or platform" },
          body: {
            es: "Tiene sentido cuando tu modelo no encaja en ninguna plataforma: reglas de precio propias, suscripciones especiales, varios vendedores o un proceso que es tu ventaja. Para la mayoría de quienes empiezan no es el primer paso; primero conviene probar el modelo sobre una plataforma existente.",
            en: "It makes sense when your model doesn't fit any platform: your own pricing rules, unusual subscriptions, multiple sellers, or a process that is your competitive edge. For most founders it is not the first step; it is usually better to prove the model on an existing platform first.",
          },
          link: {
            line: "apps",
            label: { es: "Aplicaciones a la medida", en: "Custom apps" },
          },
        },
      ],
    },
    {
      id: "lo-minimo-para-que-te-tomen-en-serio",
      title: {
        es: "¿Qué necesitas para vender por internet desde el primer día?",
        en: "What do you need to sell online from day one?",
      },
      intro: {
        es: "No necesitas un sitio grande: necesitas un dominio propio, un correo profesional, textos claros, tu política de datos, la información que la ley pide mostrar a quien compra y forma de medir. Todo esto cabe en la primera versión.",
        en: "You don't need a big site: you need your own domain, a professional email address, clear copy, a data policy, the information the law requires you to show buyers, and a way to measure. All of this fits in a first version.",
      },
      items: [
        {
          title: { es: "Dominio propio y correo profesional", en: "Your own domain and professional email" },
          body: {
            es: "Un dominio registrado a tu nombre y un correo como hola@tunegocio.com dicen que tu negocio es real y que vas a estar ahí mañana. Además, todo lo que construyas encima sigue siendo tuyo si cambias de proveedor.",
            en: "A domain registered in your name and an address like hello@yourbusiness.com say your business is real and will still be there tomorrow. And everything you build on top stays yours if you change providers.",
          },
        },
        {
          title: { es: "Textos que explican claro qué haces", en: "Copy that clearly explains what you do" },
          body: {
            es: "Quien llega a tu sitio debe entender en pocos segundos qué ofreces, para quién es y qué hacer después. Escribe como le hablarías a un cliente, con tus datos de contacto visibles, y evita frases genéricas que podrían ser de cualquier negocio.",
            en: "Visitors should understand within seconds what you offer, who it is for and what to do next. Write the way you would talk to a customer, keep your contact details visible, and avoid generic phrases that could belong to any business.",
          },
        },
        {
          title: { es: "Política de privacidad y tratamiento de datos", en: "Privacy and data processing policy" },
          body: {
            es: "Si tu sitio recoge datos personales en un formulario o en un pedido, publica cómo los usas y pide autorización para tratarlos. En Colombia lo regula la Ley 1581 de 2012, que exige en general la autorización previa, expresa e informada de la persona; la autoridad que la vigila es la Superintendencia de Industria y Comercio (SIC). Si vendes fuera de Colombia, revisa las normas de protección de datos de tu país. Para redactar tu política, apóyate en un abogado o en las guías de la SIC.",
            en: "If your site collects personal data through a form or an order, publish how you use it and ask for permission to process it. In Colombia this is governed by Law 1581 of 2012, which generally requires the person's prior, express and informed authorization; the supervising authority is the Superintendencia de Industria y Comercio (SIC). Outside Colombia, check your own country's data protection rules. To draft your policy, rely on a lawyer or the regulator's guidance.",
          },
        },
        {
          title: {
            es: "Si vendes en Colombia: lo que tu tienda debe mostrar",
            en: "If you sell in Colombia: what your store must show",
          },
          body: {
            es: "El Estatuto del Consumidor (Ley 1480 de 2011, artículo 50, modificado por la Ley 2439 de 2024) pide que quien vende en línea muestre quién es y cómo contactarlo, describa sus productos de forma veraz, informe el precio total con impuestos y los costos de envío por separado, los medios de pago, el tiempo de entrega, el derecho de retracto y cómo ejercerlo, y las condiciones generales de tus contratos, disponibles para consultar y descargar. También pide un resumen del pedido antes de pagar, canales de atención y un enlace visible a la SIC. Una buena tienda trae espacio para todo esto desde la primera versión.",
            en: "Colombia's Consumer Protection Statute (Law 1480 of 2011, article 50, as amended by Law 2439 of 2024) requires online sellers to show who they are and how to reach them, describe products truthfully, state the total price with taxes and shipping costs separately, payment methods, delivery time, the right of withdrawal (retracto) and how to use it, and your general terms and conditions, available to read and download. It also requires an order summary before payment, support channels and a visible link to the SIC. A well-built store has room for all of this from the first version.",
          },
        },
        {
          title: {
            es: "RUT, Cámara de Comercio y facturación electrónica",
            en: "RUT, chamber of commerce registration and e-invoicing in Colombia",
          },
          body: {
            es: "Vender en línea no te exime de las obligaciones formales de cualquier negocio. Si necesitas inscribirte en el RUT, registrarte en la Cámara de Comercio o facturar electrónicamente depende de tu caso, y no puedo resolverlo por ti desde una guía: confírmalo con la DIAN, con la Cámara de Comercio de tu ciudad o con un contador antes de lanzar. Si vendes fuera de Colombia, consulta con la autoridad tributaria de tu país.",
            en: "Selling online doesn't exempt you from the formal obligations any business has. Whether you need to register in the RUT (the DIAN tax registry), register with your local Cámara de Comercio or issue electronic invoices depends on your case, and a guide can't settle that for you: confirm it with the DIAN, your city's chamber of commerce or an accountant before you launch. Outside Colombia, check with your local tax authority.",
          },
        },
        {
          title: { es: "Analítica desde el primer día", en: "Analytics from day one" },
          body: {
            es: "Mide de dónde llegan tus visitas y qué las convierte en pedidos o mensajes. Sin datos, cada decisión sobre la siguiente fase es una apuesta.",
            en: "Measure where your visitors come from and what turns them into orders or messages. Without data, every decision about the next phase is a guess.",
          },
        },
      ],
    },
    {
      id: "errores-comunes",
      title: {
        es: "Errores comunes al empezar un negocio en línea",
        en: "Common mistakes when starting a business online",
      },
      intro: {
        es: "Los errores más caros al empezar no son técnicos: son construir de más antes de validar, elegir por moda y quedarte sin el control de lo que es tuyo. Estos son los que más veo y cómo evitarlos.",
        en: "The most costly early mistakes are not technical: building too much before validating, choosing by hype, and losing control of what is yours. These are the ones I see most and how to avoid them.",
      },
      items: [
        {
          title: {
            es: "Construir todo antes de saber si alguien compra",
            en: "Building everything before knowing if anyone buys",
          },
          body: {
            es: "Una tienda completa, una app y una marca terminada no sirven si la oferta no se vende. Valida primero con lo que tienes y construye sobre lo que aprendas.",
            en: "A full store, an app and a finished brand don't help if the offer doesn't sell. Validate first with what you have and build on what you learn.",
          },
        },
        {
          title: {
            es: "Elegir la plataforma porque otro la usa",
            en: "Choosing a platform because someone else uses it",
          },
          body: {
            es: "Lo que le funciona a otro negocio puede no servirle a tu catálogo ni a tu forma de despachar. Elige por tus criterios, no por recomendación suelta.",
            en: "What works for another business may not fit your catalog or the way you ship. Choose based on your own criteria, not someone's offhand recommendation.",
          },
        },
        {
          title: {
            es: "Dejar el dominio y las cuentas a nombre de otra persona",
            en: "Leaving your domain and accounts in someone else's name",
          },
          body: {
            es: "El dominio, la tienda, la analítica y las cuentas de pago deben estar a tu nombre, con tu acceso de administrador. Si el proveedor desaparece, tu negocio no debe desaparecer con él.",
            en: "Your domain, store, analytics and payment accounts should be in your name, with your own admin access. If a provider disappears, your business shouldn't disappear with them.",
          },
        },
        {
          title: { es: "Depender de una sola red social", en: "Relying on a single social network" },
          body: {
            es: "Las redes son un gran canal para empezar, pero la cuenta y el alcance no los controlas tú. Lleva a tus clientes poco a poco a algo tuyo: tu sitio, tu lista de contactos, tu dominio.",
            en: "Social networks are a great channel to start with, but you don't control the account or its reach. Gradually bring customers to something you own: your site, your contact list, your domain.",
          },
        },
        {
          title: { es: "Lanzar sin probar el proceso de compra", en: "Launching without testing the checkout" },
          body: {
            es: "Haz pedidos de prueba completos: pago, confirmación, correo al cliente y entrega. Un error en ese camino cuesta ventas y confianza justo cuando más las necesitas.",
            en: "Place full test orders: payment, confirmation, customer email and delivery. A mistake along that path costs sales and trust exactly when you need them most.",
          },
        },
        {
          title: {
            es: "Construir algo que haya que rehacer cuando crezcas",
            en: "Building something you will have to rebuild as you grow",
          },
          body: {
            es: "Empezar pequeño está bien; empezar sobre algo que no se puede ampliar, no. Conserva tu dominio, tus URL y tus datos, y elige una base que admita nuevas funciones. Si ya tienes una plataforma que se volvió difícil de cambiar, se puede mejorar por fases sin empezar de cero.",
            en: "Starting small is fine; starting on something that can't be extended is not. Keep your domain, your URLs and your data, and choose a foundation that can take new features. If you already have a platform that has become hard to change, it can be improved in phases without starting over.",
          },
          link: {
            line: "evolution",
            label: { es: "Mejorar una plataforma existente", en: "Improve an existing platform" },
          },
        },
      ],
    },
    {
      id: "como-trabajo-contigo",
      title: { es: "Cómo trabajo contigo si estás empezando", en: "How I work with you if you are just starting" },
      intro: {
        es: "Si estás empezando, te propongo una primera versión que te permita vender pronto y que pueda crecer, construida por fases. Hablas directamente conmigo, la persona que la construye, y te digo con claridad qué necesitas ahora y qué puede esperar.",
        en: "If you are just starting, I propose a first version that lets you start selling soon and can grow, built in phases. You talk directly to me, the person who builds it, and I tell you plainly what you need now and what can wait.",
      },
      items: [
        {
          title: {
            es: "Empiezo por tu negocio, no por la tecnología",
            en: "I start with your business, not the technology",
          },
          body: {
            es: "La primera conversación es sobre qué vendes, a quién y cómo lo entregas. Con eso te digo si te sirve una landing, un sitio, una tienda o si todavía te basta con redes y WhatsApp.",
            en: "The first conversation is about what you sell, to whom and how you deliver it. With that, I tell you whether you need a landing page, a website, a store, or whether social media and WhatsApp are still enough.",
          },
        },
        {
          title: { es: "Una primera versión pensada para crecer", en: "A first version designed to grow" },
          body: {
            es: "Construyo lo mínimo para empezar a vender sobre una base que se puede ampliar: lo que se hace hoy no se tira mañana. Cuando tu operación lo pida, sumo integraciones con inventario, facturación o tu CRM, o un plugin para lo que ninguna herramienta resuelve.",
            en: "I build the minimum to start selling on a foundation that can be extended: what is built today is not thrown away tomorrow. When your operation needs it, I add integrations with inventory, invoicing or your CRM, or a plugin for what no existing tool handles.",
          },
          link: {
            line: "plugins",
            label: { es: "Plugins e integraciones", en: "Plugins and integrations" },
          },
        },
        {
          title: {
            es: "El precio y el tiempo dependen del tamaño del proyecto",
            en: "Price and timing depend on the size of the project",
          },
          body: {
            es: "No compito por precio. Lo que define el alcance es concreto: cuántas páginas o productos, qué integraciones (pagos, envíos, facturación), si hay funciones a la medida y si el contenido ya está listo. Con eso te doy una propuesta para tu caso.",
            en: "I don't compete on price. What defines the scope is concrete: how many pages or products, which integrations (payments, shipping, invoicing), whether there are custom features, and whether the content is ready. With that, I give you a proposal for your case.",
          },
        },
        {
          title: { es: "Qué preparar antes de escribirme", en: "What to prepare before you write to me" },
          body: {
            es: "No necesitas tenerlo todo. Me ayuda saber qué quieres vender, a quién, cómo lo vas a entregar, con qué cuentas hoy (logo, fotos, redes, dominio) y qué te gustaría que pasara primero.",
            en: "You don't need to have everything ready. It helps me to know what you want to sell, to whom, how you will deliver it, what you already have (logo, photos, social accounts, a domain) and what you would like to happen first.",
          },
        },
      ],
    },
  ],
  faqs: [
    {
      q: {
        es: "¿Necesito una página web para empezar mi negocio?",
        en: "Do I need a website to start my business?",
      },
      a: {
        es: "No siempre. Si estás validando tu idea y le vendes a personas que te conocen, puedes empezar con redes sociales y WhatsApp. Una web empieza a valer la pena cuando necesitas que te encuentren y confíen en ti personas que no te conocen, o cuando quieres recibir pedidos y pagos sin hacerlo todo por chat.",
        en: "Not always. If you are validating your idea and selling to people who know you, you can start with social media and WhatsApp. A website starts to pay off when you need strangers to find and trust you, or when you want to take orders and payments without handling everything by chat.",
      },
    },
    {
      q: { es: "¿Puedo vender por internet sin tener página web?", en: "Can I sell online without a website?" },
      a: {
        es: "Sí, por WhatsApp, redes sociales, enlaces de pago o un marketplace. Es una buena forma de probar si la gente compra. El límite llega cuando cada venta depende de una conversación, cuando nadie nuevo te encuentra o cuando quieres que la relación con tus clientes sea tuya y no de una plataforma.",
        en: "Yes, through WhatsApp, social media, payment links or a marketplace. It is a good way to test whether people will buy. The limit comes when every sale depends on a conversation, when new people can't find you, or when you want the customer relationship to be yours rather than a platform's.",
      },
    },
    {
      q: {
        es: "¿Qué plataforma me conviene para mi tienda en línea?",
        en: "Which platform is right for my online store?",
      },
      a: {
        es: "Depende de tu catálogo, de quién va a manejar la tienda y de cómo despachas. Shopify conviene si no quieres administrar servidores; PrestaShop, si quieres control total del código y de los datos o necesitas modificar a fondo catálogo, pagos o envíos; WooCommerce, si el contenido pesa o ya usas WordPress; y algo a la medida, solo si tu modelo no encaja en ninguna.",
        en: "It depends on your catalog, who will run the store and how you ship. Shopify suits you if you don't want to manage servers; PrestaShop if you want full control over the code and data or need to deeply customize catalog, payments or shipping; WooCommerce if content matters a lot or you already use WordPress; and a custom build only if your model fits none of them.",
      },
    },
    {
      q: {
        es: "Si empiezo con algo pequeño, ¿tendré que rehacerlo todo cuando crezca?",
        en: "If I start small, will I have to rebuild everything when I grow?",
      },
      a: {
        es: "No, si la primera versión se construye para crecer. Lo que evita rehacer es tener el dominio, las URL y los datos a tu nombre, y elegir una plataforma que admita nuevas funciones. Así la siguiente fase se suma a lo que ya tienes en lugar de reemplazarlo.",
        en: "No, if the first version is built to grow. What prevents a rebuild is owning your domain, URLs and data, and choosing a platform that can take new features. That way the next phase adds to what you have instead of replacing it.",
      },
    },
    {
      q: {
        es: "¿Necesito RUT o registro en la Cámara de Comercio para vender en línea en Colombia?",
        en: "Do I need a RUT or chamber of commerce registration to sell online in Colombia?",
      },
      a: {
        es: "Depende de tu caso, y una guía no puede resolverlo por ti. Vender en línea no te exime de las obligaciones de cualquier negocio: confirma con la DIAN, con la Cámara de Comercio de tu ciudad o con un contador si debes inscribirte en el RUT, registrarte como comerciante o facturar electrónicamente.",
        en: "It depends on your case, and a guide can't settle it for you. Selling online doesn't exempt you from the obligations any business has: confirm with the DIAN, your city's chamber of commerce or an accountant whether you need to register in the RUT, register as a merchant or issue electronic invoices.",
      },
    },
    {
      q: {
        es: "¿Cuánto cuesta y cuánto tiempo toma crear la página web o la tienda de mi negocio?",
        en: "How much does it cost and how long does it take to build a website or store for my business?",
      },
      a: {
        es: "Depende del tamaño del proyecto, por eso no publico precios ni plazos fijos. Lo que más pesa es cuántas páginas o productos tiene, qué integraciones necesitas (pagos, envíos, facturación), si hay funciones a la medida y si el contenido ya está listo. Con eso te doy una propuesta para tu caso.",
        en: "It depends on the size of the project, which is why I don't publish fixed prices or timelines. What weighs most is how many pages or products it has, which integrations you need (payments, shipping, invoicing), whether there are custom features and whether the content is ready. With that, I give you a proposal for your case.",
      },
    },
    {
      q: {
        es: "¿Puedo crear mi página web o mi tienda yo mismo, o necesito contratar a alguien?",
        en: "Can I build my website or online store myself, or should I hire someone?",
      },
      a: {
        es: "Puedes empezar tú mismo, sobre todo en la etapa de validación con redes, WhatsApp o un constructor de sitios. Contar con alguien vale la pena cuando necesitas una base que crezca, integraciones con pagos, envíos o facturación, o cuando el tiempo que le dedicas a la tecnología se lo estás quitando a vender.",
        en: "You can start on your own, especially while validating with social media, WhatsApp or a site builder. Bringing someone in is worth it when you need a foundation that grows, integrations with payments, shipping or invoicing, or when the time you spend on technology is time taken away from selling.",
      },
    },
    {
      q: {
        es: "¿Cómo hago que me encuentren en Google y en los asistentes de inteligencia artificial?",
        en: "How do I get found on Google and by AI assistants?",
      },
      a: {
        es: "Nadie puede prometerte un lugar, pero hay bases que ayudan: páginas que responden con claridad lo que tus clientes preguntan, textos visibles y no solo imágenes, un sitio que cargue bien en el celular y un dominio propio. Si atiendes en una zona concreta, crea también tu perfil de empresa en Google.",
        en: "Nobody can promise you a spot, but some foundations help: pages that clearly answer what your customers ask, content as real text rather than only images, a site that loads well on phones, and your own domain. If you serve a specific area, also create your Google Business Profile.",
      },
    },
  ],
  cta: {
    title: { es: "Cuéntame qué quieres empezar", en: "Tell me what you want to start" },
    text: {
      es: "Dime qué quieres vender, a quién y con qué cuentas hoy. Te respondo yo mismo y te propongo la primera versión que te permite empezar a vender, y lo que puede esperar.",
      en: "Tell me what you want to sell, to whom and what you already have. I'll reply personally and propose the first version that lets you start selling, and what can wait.",
    },
    button: { es: "Contarte mi idea", en: "Share my idea" },
  },
};
