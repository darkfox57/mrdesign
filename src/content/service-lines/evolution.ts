import type { ServiceLineContent } from "./types";

// Approved copy of the "Platform evolution" line page (odd/tasks/site-build-experience.md, T5 and L13).
// The user approved it word for word: change it only with the user's approval. Its slug and name
// live in src/content/services.ts.
//
// Problems this line solves (an editorial note for future copy, not shown on the page): Leads here
// from home problems such as: 'every change to my site breaks something else'; 'the developer who
// built it left and nobody understands the code'; 'my platform runs on outdated versions or plugins
// I cannot update'; 'adding a feature costs too much or takes too long'; 'the site or store is slow
// and fragile but I cannot afford to stop selling'; 'I do not know if I should rebuild from scratch
// or fix what I have'.
export const evolution: ServiceLineContent = {
  h1: {
    es: "Modernización de plataformas web, sin detener tu negocio",
    en: "Web platform modernization without stopping your business",
  },
  metaTitle: { es: "Auditoría técnica y modernización web", en: "Technical audit and web platform modernization" },
  metaDescription: {
    es: "Tomo tu plataforma web actual, la audito y la mejoro por fases: refactor, actualizaciones, pruebas y documentación, sin detener la operación de tu negocio.",
    en: "I take over your existing web platform, audit it and improve it in phases: refactoring, upgrades, tests and documentation, without stopping your business.",
  },
  summary: {
    es: "Me hago cargo de una plataforma web que ya existe y que se volvió difícil de cambiar: un sitio, una tienda o una aplicación. Empiezo con una auditoría técnica, defino una hoja de ruta priorizada y la mejoro por fases con refactor, actualizaciones, pruebas y documentación, mientras tu negocio sigue operando. Hablas directamente conmigo, la persona que hace el trabajo.",
    en: "I take over an existing web platform that has become hard to change: a website, an online store or an app. I start with a technical audit, define a prioritized roadmap and improve it in phases with refactoring, upgrades, tests and documentation, while your business keeps running. You talk directly to me, the person who does the work.",
  },
  audience: {
    es: "Para negocios que ya operan con un sitio, una tienda o una aplicación que los frena, y para quienes empezaron con una plataforma hecha a la carrera y ahora necesitan que crezca.",
    en: "For businesses that already run on a website, store or app that slows them down, and for those who started with a platform built in a hurry and now need it to grow.",
  },
  keywords: {
    es: [
      "auditoría técnica de sitio web",
      "modernizar plataforma web",
      "refactorización de código",
      "rescatar proyecto web abandonado",
      "actualizar versión de php de mi sitio",
      "mejorar aplicación web existente",
      "desarrollador para mantener y mejorar software existente",
    ],
    en: [
      "technical website audit",
      "legacy web application modernization",
      "code refactoring services",
      "take over existing web project",
      "upgrade outdated web platform",
      "rescue abandoned software project",
      "improve existing web app without rewriting",
    ],
  },
  deliverables: [
    {
      code: "<Audit />",
      title: { es: "Auditoría técnica", en: "Technical audit" },
      description: {
        es: "Reviso el código, las dependencias, el servidor y los flujos críticos de tu plataforma. Te entrego un informe claro de qué está bien, qué está en riesgo y qué frena los cambios.",
        en: "I review your platform's code, dependencies, server and critical flows. You get a clear report on what works, what is at risk and what makes changes hard.",
      },
    },
    {
      code: "<Roadmap />",
      title: { es: "Hoja de ruta priorizada", en: "Prioritized roadmap" },
      description: {
        es: "Ordeno los hallazgos por impacto en tu negocio y por riesgo técnico. Cada fase tiene un objetivo concreto que puedes revisar antes de empezar.",
        en: "I rank the findings by business impact and technical risk. Each phase has a concrete goal you can review before it starts.",
      },
    },
    {
      code: "<SafetyNet />",
      title: { es: "Pruebas antes de tocar", en: "Tests before changes" },
      description: {
        es: "Antes de cambiar algo, escribo pruebas que fijan cómo funciona hoy lo importante: pagos, formularios, cuentas o pedidos. Así, si un cambio rompe uno de esos flujos, se detecta antes de publicarse.",
        en: "Before changing anything, I write tests that pin down how the important parts work today: payments, forms, accounts or orders. If a change breaks one of those flows, it is caught before it goes live.",
      },
    },
    {
      code: "<Refactor />",
      title: { es: "Refactor por fases", en: "Phased refactoring" },
      description: {
        es: "Reorganizo el código una pieza a la vez para que sea más fácil de entender y de cambiar. La plataforma sigue funcionando igual para tus clientes mientras tanto.",
        en: "I reorganize the code one piece at a time so it is easier to understand and change. Meanwhile, the platform keeps working the same way for your customers.",
      },
    },
    {
      code: "<Upgrade />",
      title: { es: "Actualización de versiones", en: "Version upgrades" },
      description: {
        es: "Llevo el lenguaje, el framework, el CMS y las dependencias a versiones con soporte. Reviso la compatibilidad antes de cada salto para proteger lo que ya funciona.",
        en: "I move the language, framework, CMS and dependencies to supported versions. I check compatibility before each jump to protect what already works.",
      },
    },
    {
      code: "<Docs />",
      title: { es: "Documentación y traspaso", en: "Documentation and handover" },
      description: {
        es: "Dejo por escrito cómo está armada la plataforma, cómo se instala y cómo se publica un cambio. La plataforma deja de depender de lo que una sola persona recuerda.",
        en: "I write down how the platform is structured, how to set it up and how to ship a change. The platform stops depending on what a single person remembers.",
      },
    },
  ],
  buildSteps: [
    {
      label: { es: "Auditoría", en: "Audit" },
      note: {
        es: "Primero entiendo lo que hay: código, dependencias, servidor y los flujos que sostienen tu negocio.",
        en: "First I understand what is there: code, dependencies, server and the flows your business relies on.",
      },
      logLine: {
        es: "› auditoría · código, dependencias y servidor revisados",
        en: "› audit · code, dependencies and server reviewed",
      },
      visualHint: "The code panel shows an existing, tangled codebase; warning markers appear on specific spots (outdated dependency, duplicated logic, no tests, old runtime version) as if a scanner were passing over it.",
    },
    {
      label: { es: "Prioridades", en: "Priorities" },
      note: {
        es: "Ordeno lo que encontré por impacto y riesgo, y lo convierto en fases con un objetivo cada una.",
        en: "I rank what I found by impact and risk, and turn it into phases with one goal each.",
      },
      logLine: {
        es: "› hoja de ruta · hallazgos ordenados por impacto y riesgo",
        en: "› roadmap · findings ranked by impact and risk",
      },
      visualHint: "The warning markers detach from the code and become cards that sort themselves into ordered columns labeled Phase 1, Phase 2, Phase 3.",
    },
    {
      label: { es: "Pruebas", en: "Tests" },
      note: {
        es: "Antes de mover una línea, cubro con pruebas lo que hoy funciona, para que un fallo en esos flujos se note antes de publicar.",
        en: "Before moving a single line, I cover what works today with tests, so a failure in those flows shows up before going live.",
      },
      logLine: {
        es: "› pruebas · lo que funciona hoy queda cubierto",
        en: "› tests · what works today is now covered",
      },
      visualHint: "Green check marks appear next to key flows (checkout, contact form, login) wrapping them like a safety net; the code itself is still unchanged.",
    },
    {
      label: { es: "Refactor", en: "Refactor" },
      note: {
        es: "Reorganizo una pieza a la vez y las pruebas confirman que los flujos cubiertos siguen funcionando igual.",
        en: "I reorganize one piece at a time and the tests confirm the covered flows still work the same.",
      },
      logLine: {
        es: "› refactor · una pieza a la vez, pruebas en verde",
        en: "› refactor · one piece at a time, tests green",
      },
      visualHint: "A tangled block of code splits into smaller, clearly named modules; the test check marks stay green throughout the transformation.",
    },
    {
      label: { es: "Actualización", en: "Upgrade" },
      note: {
        es: "Llevo versiones y dependencias a lo que tiene soporte, revisando la compatibilidad en cada salto.",
        en: "I bring versions and dependencies up to supported releases, checking compatibility at every step.",
      },
      logLine: {
        es: "› actualización · versiones con soporte, compatibilidad revisada",
        en: "› upgrade · supported versions, compatibility checked",
      },
      visualHint: "Version badges on the runtime, framework and packages tick from old numbers to current ones, each followed by a brief compatibility check that turns green.",
    },
    {
      label: { es: "En vivo", en: "Live" },
      note: {
        es: "Publico la fase sin detener la operación y dejo documentado qué cambió y cómo seguir.",
        en: "I ship the phase without stopping operations and document what changed and how to continue.",
      },
      logLine: { es: "› en vivo · fase publicada y documentada", en: "› live · phase shipped and documented" },
      visualHint: "A deploy indicator completes while a live traffic counter keeps moving uninterrupted; a documentation page slides in beside the code panel and the next phase card lights up.",
    },
  ],
  comparison: {
    columns: {
      es: [
        "Seguir parchando",
        "Reescribir desde cero",
        "Evolucionar por fases",
      ],
      en: [
        "Keep patching",
        "Rewrite from scratch",
        "Evolve in phases",
      ],
    },
    rows: [
      {
        label: { es: "Operación del negocio", en: "Business operations" },
        cells: {
          es: [
            "Sigue funcionando, pero cada cambio puede romper algo que nadie esperaba.",
            "El sistema actual sigue en uso mientras se construye el nuevo, y hay que mantener ambos.",
            "Sigue funcionando mientras se mejora por partes.",
          ],
          en: [
            "Keeps running, but each change can break something nobody expected.",
            "The current system stays in use while the new one is built, and both need upkeep.",
            "Keeps running while it is improved piece by piece.",
          ],
        },
      },
      {
        label: { es: "Cuándo ves resultados", en: "When you see results" },
        cells: {
          es: [
            "Rápido en lo pequeño, pero cada cambio tiende a costar más que el anterior.",
            "Al final, cuando el sistema nuevo reemplaza al anterior.",
            "Al cerrar cada fase.",
          ],
          en: [
            "Fast for small fixes, but each change tends to cost more than the last.",
            "At the end, when the new system replaces the old one.",
            "At the end of each phase.",
          ],
        },
      },
      {
        label: { es: "Riesgo principal", en: "Main risk" },
        cells: {
          es: [
            "La deuda técnica crece hasta que cambiar algo se vuelve inviable.",
            "Perder reglas del negocio que solo vivían en el código anterior.",
            "Que la base no sirva; la auditoría lo dice antes de empezar.",
          ],
          en: [
            "Technical debt grows until changing anything becomes unworkable.",
            "Losing business rules that only lived in the old code.",
            "That the foundation is unusable; the audit tells you before starting.",
          ],
        },
      },
      {
        label: { es: "Cuándo conviene", en: "When it makes sense" },
        cells: {
          es: [
            "Ajustes menores sobre una plataforma sana.",
            "Cuando la base ya no sostiene lo que el negocio necesita.",
            "Cuando la base sirve, pero cambiarla se volvió lento y riesgoso.",
          ],
          en: [
            "Minor tweaks on a healthy platform.",
            "When the foundation can no longer support what the business needs.",
            "When the foundation works, but changing it has become slow and risky.",
          ],
        },
      },
    ],
    highlight: 2,
  },
  faqs: [
    {
      q: {
        es: "¿Puedes hacerte cargo de una plataforma que hizo otra persona o agencia?",
        en: "Can you take over a platform built by another developer or agency?",
      },
      a: {
        es: "Sí. Es justo el punto de partida de este servicio. Empiezo con una auditoría técnica para entender cómo está construida y qué riesgos tiene, y para eso necesito acceso al código, al servidor o hosting y a las cuentas de los servicios que usa.",
        en: "Yes. That is exactly where this service starts. I begin with a technical audit to understand how it is built and what risks it carries, and for that I need access to the code, the server or hosting, and the accounts of the services it uses.",
      },
    },
    {
      q: {
        es: "¿Hay que detener el sitio o la tienda mientras la mejoras?",
        en: "Do you need to take the site or store offline while you improve it?",
      },
      a: {
        es: "Por lo general no. Trabajo por fases pequeñas, con pruebas que cubren lo que hoy funciona, y publico cada cambio de forma que se pueda revertir si algo sale mal. Si un paso necesita una pausa corta, como una actualización del servidor, te aviso antes y la programamos en el horario de menos movimiento.",
        en: "Usually not. I work in small phases, with tests covering what works today, and I ship each change in a way that can be rolled back if something goes wrong. If a step needs a short pause, such as a server upgrade, I tell you beforehand and we schedule it for your quietest hours.",
      },
    },
    {
      q: {
        es: "¿Es mejor reescribir mi plataforma desde cero o mejorar la que tengo?",
        en: "Is it better to rewrite my platform from scratch or improve the one I have?",
      },
      a: {
        es: "Depende del estado de la base, y eso es lo que responde la auditoría. Si la base sirve, evolucionarla por fases suele ser menos riesgoso porque conserva las reglas del negocio que ya funcionan. Si no sirve, te lo digo con argumentos y planteamos una reconstrucción.",
        en: "It depends on the state of the foundation, and that is what the audit answers. If the foundation is sound, evolving it in phases is usually less risky because it keeps the business rules that already work. If it is not, I tell you with clear reasons and we plan a rebuild.",
      },
    },
    {
      q: {
        es: "¿Cuánto cuesta y cuánto tarda una auditoría técnica de mi sitio?",
        en: "How much does a technical audit of my site cost and how long does it take?",
      },
      a: {
        es: "Depende del tamaño de la plataforma y de cuántas piezas la componen: código propio, CMS, plugins, integraciones y servidor. Al final recibes un informe con los hallazgos y una hoja de ruta priorizada que puedes usar conmigo o con quien tú elijas.",
        en: "It depends on the size of the platform and how many parts it has: custom code, CMS, plugins, integrations and server. At the end you get a report with the findings and a prioritized roadmap you can use with me or with whoever you choose.",
      },
    },
    {
      q: {
        es: "Estoy empezando mi negocio y me hicieron una plataforma rápida. ¿Vale la pena evolucionarla?",
        en: "I am starting my business and my platform was built quickly. Is it worth evolving it?",
      },
      a: {
        es: "Muchas veces sí: una plataforma hecha rápido puede ser una buena base si se ordena antes de crecer. La auditoría te dice qué conviene corregir ahora, como seguridad, versiones sin soporte o pagos frágiles, y qué puede esperar a que tu negocio lo pida.",
        en: "Often, yes: a platform built quickly can be a good foundation if it is cleaned up before it grows. The audit tells you what to fix now, such as security, unsupported versions or fragile payments, and what can wait until your business needs it.",
      },
    },
    {
      q: {
        es: "¿Qué pasa cuando termina una fase? ¿Sigues dando soporte?",
        en: "What happens when a phase ends? Do you keep providing support?",
      },
      a: {
        es: "Cada fase cierra con el cambio publicado, las pruebas en verde y la documentación de lo que cambió. A partir de ahí puedes seguir con la siguiente fase de la hoja de ruta, pausar o pasarle la plataforma a otro equipo con todo documentado.",
        en: "Each phase closes with the change live, the tests passing and documentation of what changed. From there you can move on to the next phase of the roadmap, pause, or hand the platform to another team with everything documented.",
      },
    },
  ],
  related: [
    {
      id: "apps",
      reason: {
        es: "Cuando la auditoría muestra que una parte necesita construirse de nuevo, o el negocio pide un módulo o una app que hoy no existe.",
        en: "When the audit shows a part needs to be rebuilt, or the business needs a module or app that does not exist yet.",
      },
    },
    {
      id: "plugins",
      reason: {
        es: "Muchas plataformas se frenan por integraciones frágiles con pagos, inventario o CRM que conviene rehacer como plugins mantenibles.",
        en: "Many platforms are held back by fragile integrations with payments, inventory or CRM that are worth rebuilding as maintainable plugins.",
      },
    },
    {
      id: "wordpress",
      reason: {
        es: "Un sitio o tienda en WordPress con versiones y plugins desactualizados se puede evolucionar por fases sin rehacerlo.",
        en: "A WordPress site or store with outdated versions and plugins can be evolved in phases without rebuilding it.",
      },
    },
  ],
};
