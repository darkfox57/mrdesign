import type { Locale } from "@/i18n/routing";
import { contact } from "./contact";

export type LegalSection = { title: string; paragraphs: string[] };
export type LegalDocument = { title: string; description: string; updated: string; sections: LegalSection[] };

// Reviewed text is pending: confirm the legal name and ID of the data controller before launch.
const UPDATED = "2026-11-23";

export const privacyPolicy: Record<Locale, LegalDocument> = {
  es: {
    title: "Política de privacidad",
    description: "Cómo Mr. Design recoge, usa y protege los datos personales que envías por este sitio.",
    updated: UPDATED,
    sections: [
      {
        title: "Responsable del tratamiento",
        paragraphs: [
          `Mr. Design, con domicilio en ${contact.city}, Colombia, es responsable de los datos personales que recibe por este sitio. Puedes escribir a ${contact.email} para cualquier asunto relacionado con tus datos.`,
        ],
      },
      {
        title: "Qué datos recojo",
        paragraphs: [
          "Solo los que escribes en el formulario de contacto: nombre, email, empresa y teléfono (opcionales), el tipo de proyecto y tu mensaje.",
          "El sitio no usa cookies de publicidad ni de seguimiento.",
        ],
      },
      {
        title: "Para qué los uso",
        paragraphs: [
          "Para responder tu mensaje, preparar una propuesta y mantener la comunicación sobre tu proyecto. No los vendo ni los comparto con terceros para fines comerciales.",
        ],
      },
      {
        title: "Encargados",
        paragraphs: [
          "Los datos se guardan en servidores contratados para alojar este sitio, y los avisos de nuevos mensajes se envían con un proveedor de email transaccional. Ambos tratan los datos solo para prestar ese servicio.",
        ],
      },
      {
        title: "Tus derechos",
        paragraphs: [
          `Según la Ley 1581 de 2012 y el Decreto 1377 de 2013, puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización que diste. Escribe a ${contact.email} y te respondo en los plazos que fija la ley: 10 días hábiles para consultas y 15 días hábiles para reclamos.`,
        ],
      },
      {
        title: "Cuánto tiempo los guardo",
        paragraphs: [
          "Mientras dure la relación comercial o hasta que pidas eliminarlos, salvo que una obligación legal exija conservarlos más tiempo.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    description: "How Mr. Design collects, uses and protects the personal data you send through this site.",
    updated: UPDATED,
    sections: [
      {
        title: "Data controller",
        paragraphs: [
          `Mr. Design, based in ${contact.city}, Colombia, is responsible for the personal data received through this site. Write to ${contact.email} about anything related to your data.`,
        ],
      },
      {
        title: "What data I collect",
        paragraphs: [
          "Only what you type in the contact form: name, email, company and phone (optional), the project type and your message.",
          "The site does not use advertising or tracking cookies.",
        ],
      },
      {
        title: "What I use it for",
        paragraphs: [
          "To reply to your message, prepare a proposal and keep in touch about your project. I do not sell it or share it with third parties for marketing.",
        ],
      },
      {
        title: "Processors",
        paragraphs: [
          "The data is stored on servers contracted to host this site, and new-message alerts are sent through a transactional email provider. Both process the data only to provide that service.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          `Under Colombian Law 1581 of 2012 and Decree 1377 of 2013, you can access, update, correct and delete your data, and withdraw your consent. Write to ${contact.email} and I will reply within the legal deadlines: 10 business days for inquiries and 15 business days for claims.`,
        ],
      },
      {
        title: "How long I keep it",
        paragraphs: [
          "For as long as the business relationship lasts or until you ask for deletion, unless a legal obligation requires keeping it longer.",
        ],
      },
    ],
  },
};

export const termsAndConditions: Record<Locale, LegalDocument> = {
  es: {
    title: "Términos y condiciones",
    description: "Condiciones de uso del sitio web de Mr. Design.",
    updated: UPDATED,
    sections: [
      {
        title: "Uso del sitio",
        paragraphs: [
          "Este sitio presenta los servicios de desarrollo de Mr. Design. Puedes navegarlo y usar el formulario de contacto libremente, siempre que no lo uses para enviar spam ni contenido ilegal.",
        ],
      },
      {
        title: "Propuestas y contratos",
        paragraphs: [
          "La información del sitio es orientativa y no constituye una oferta. El alcance, el precio y los plazos de cada proyecto se acuerdan por escrito en una propuesta aceptada por ambas partes.",
        ],
      },
      {
        title: "Propiedad intelectual",
        paragraphs: [
          "Los textos, el diseño y el código de este sitio pertenecen a Mr. Design. Las marcas y las imágenes de los proyectos del portafolio pertenecen a sus respectivos dueños y se muestran como referencia del trabajo realizado.",
        ],
      },
      {
        title: "Ley aplicable",
        paragraphs: ["Estos términos se rigen por las leyes de la República de Colombia."],
      },
    ],
  },
  en: {
    title: "Terms and conditions",
    description: "Terms of use of the Mr. Design website.",
    updated: UPDATED,
    sections: [
      {
        title: "Use of the site",
        paragraphs: [
          "This site presents Mr. Design's development services. You may browse it and use the contact form freely, as long as you do not use it to send spam or illegal content.",
        ],
      },
      {
        title: "Proposals and contracts",
        paragraphs: [
          "The information on the site is for guidance and is not an offer. The scope, price and timeline of each project are agreed in writing in a proposal accepted by both parties.",
        ],
      },
      {
        title: "Intellectual property",
        paragraphs: [
          "The text, design and code of this site belong to Mr. Design. The brands and images of portfolio projects belong to their respective owners and are shown as a reference of the work done.",
        ],
      },
      {
        title: "Governing law",
        paragraphs: ["These terms are governed by the laws of the Republic of Colombia."],
      },
    ],
  },
};
