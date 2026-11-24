import type { Config, Slot } from "@puckeditor/core";
import { ButtonBlock } from "@/components/organisms/landing-blocks/ButtonBlock";
import { CardsBlock } from "@/components/organisms/landing-blocks/CardsBlock";
import { ColumnsBlock } from "@/components/organisms/landing-blocks/ColumnsBlock";
import { CtaBlock } from "@/components/organisms/landing-blocks/CtaBlock";
import { FaqBlock } from "@/components/organisms/landing-blocks/FaqBlock";
import { HeroBlock } from "@/components/organisms/landing-blocks/HeroBlock";
import type { Background } from "@/components/organisms/landing-blocks/styles";
import { TextImageBlock } from "@/components/organisms/landing-blocks/TextImageBlock";
import type { Locale } from "@/i18n/routing";
import { ImageField } from "./ImageField";
import { localizeHref } from "./links";
import { PAGE_FIELD_LABELS, PAGE_FIELD_LIMITS, type PageFields } from "./page-fields";
import { COLUMN_BLOCKS } from "./validate";

// Visual landing builder (Puck). Each block renders with the presentational components in
// src/components/organisms/landing-blocks, so the editor shows what the page will look like. Only
// content and a few named variants are editable: colors, fonts and spacing stay those of the brand.
// Keep in sync with validate.ts (same types, fields and slot rules), which checks every page the
// editor saves and every page the public route reads. Editor labels are Spanish (the dashboard).

type Metadata = { locale?: Locale };
const localeOf = (metadata: Metadata | undefined): Locale => metadata?.locale ?? "es";

const BACKGROUND_FIELD = {
  type: "radio" as const,
  label: "Fondo",
  options: [
    { label: "Claro", value: "paper" },
    { label: "Blanco", value: "surface" },
    { label: "Oscuro", value: "ink" },
  ],
};

const LINK_HELP = "una página del sitio (/contacto), https://… o mailto:…";

type Props = {
  Hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    background: "paper" | "ink";
    side: Slot;
  };
  Cards: { title: string; intro: string; background: Background; columns: "2" | "3"; items: { title: string; text: string }[] };
  Faq: { title: string; background: "paper" | "surface"; items: { question: string; answer: string }[] };
  Columns: { ratio: "1-1" | "2-1" | "1-2"; background: Background; left: Slot; right: Slot };
  TextImage: { title: string; text: string; imageUrl: string; imageAlt: string; imageSide: "left" | "right"; background: Background };
  Button: { label: string; href: string; variant: "primary" | "secondary"; align: "left" | "center" };
  Cta: { title: string; text: string; buttonLabel: string; buttonHref: string; background: "brand" | "ink" };
};

// Empty slots need some height while editing, or there is nowhere to drop a block.
const slotClass = (isEditing: boolean) => (isEditing ? "min-h-24" : undefined);

export const builderConfig: Config<Props, PageFields> = {
  // The page's own fields (shown when no block is selected), stored in the Landing columns on
  // publish. They replace Puck's default English "title" root field. The root only wraps the blocks.
  root: {
    fields: {
      title: { type: "text", label: PAGE_FIELD_LABELS.title },
      slug: { type: "text", label: `${PAGE_FIELD_LABELS.slug} (la dirección de la página)` },
      seoTitle: { type: "text", label: `${PAGE_FIELD_LABELS.seoTitle} (máximo ${PAGE_FIELD_LIMITS.seoTitle} caracteres)` },
      seoDescription: { type: "textarea", label: `${PAGE_FIELD_LABELS.seoDescription} (máximo ${PAGE_FIELD_LIMITS.seoDescription} caracteres)` },
    },
    defaultProps: { title: "", slug: "", seoTitle: "", seoDescription: "" },
    render: ({ children }) => <>{children}</>,
  },
  categories: {
    secciones: { title: "Secciones", components: ["Hero", "Cards", "TextImage", "Faq", "Cta"] },
    estructura: { title: "Estructura", components: ["Columns", "Button"] },
  },
  components: {
    Hero: {
      label: "Hero",
      fields: {
        eyebrow: { type: "text", label: "Antetítulo", contentEditable: true },
        title: { type: "textarea", label: "Título", contentEditable: true },
        lead: { type: "textarea", label: "Entrada", contentEditable: true },
        primaryLabel: { type: "text", label: "Botón principal" },
        primaryHref: { type: "text", label: `Enlace del botón principal (${LINK_HELP})` },
        secondaryLabel: { type: "text", label: "Botón secundario" },
        secondaryHref: { type: "text", label: "Enlace del botón secundario" },
        background: {
          type: "radio",
          label: "Fondo",
          options: [
            { label: "Claro", value: "paper" },
            { label: "Oscuro", value: "ink" },
          ],
        },
        side: { type: "slot", label: "Lateral", allow: [...COLUMN_BLOCKS] },
      },
      defaultProps: {
        eyebrow: "Desarrollo a la medida",
        title: "Un título claro de lo que resuelves",
        lead: "Una o dos frases que expliquen para quién es y qué cambia.",
        primaryLabel: "Cuéntame tu proyecto",
        primaryHref: "/contacto",
        secondaryLabel: "Ver servicios",
        secondaryHref: "/servicios",
        background: "paper",
        side: [],
      },
      render: ({ eyebrow, title, lead, primaryLabel, primaryHref, secondaryLabel, secondaryHref, background, side: Side, puck }) => {
        const locale = localeOf(puck.metadata as Metadata);
        return (
          <HeroBlock
            eyebrow={eyebrow}
            title={title}
            lead={lead}
            primary={{ label: primaryLabel, href: localizeHref(primaryHref, locale) }}
            secondary={{ label: secondaryLabel, href: localizeHref(secondaryHref, locale) }}
            background={background}
            side={<Side className={slotClass(puck.isEditing)} />}
          />
        );
      },
    },

    Cards: {
      label: "Tarjetas",
      fields: {
        title: { type: "text", label: "Título de la sección", contentEditable: true },
        intro: { type: "textarea", label: "Introducción (opcional)", contentEditable: true },
        background: BACKGROUND_FIELD,
        columns: {
          type: "radio",
          label: "Columnas en pantallas anchas",
          options: [
            { label: "Dos", value: "2" },
            { label: "Tres", value: "3" },
          ],
        },
        items: {
          type: "array",
          label: "Tarjetas",
          arrayFields: { title: { type: "text", label: "Título" }, text: { type: "textarea", label: "Texto" } },
          defaultItemProps: { title: "Título", text: "Texto de la tarjeta." },
          getItemSummary: (item) => item.title || "(sin título)",
        },
      },
      defaultProps: {
        title: "Lo que cambia",
        intro: "",
        background: "surface",
        columns: "3",
        items: [
          { title: "Primera idea", text: "Explica el beneficio en una frase." },
          { title: "Segunda idea", text: "Explica el beneficio en una frase." },
          { title: "Tercera idea", text: "Explica el beneficio en una frase." },
        ],
      },
      render: ({ id, title, intro, background, columns, items }) => (
        <CardsBlock id={id} title={title} intro={intro} background={background} columns={columns} items={items} />
      ),
    },

    TextImage: {
      label: "Texto con imagen",
      fields: {
        title: { type: "text", label: "Título", contentEditable: true },
        text: { type: "textarea", label: "Texto", contentEditable: true },
        imageUrl: { type: "custom", label: "Imagen", render: ImageField },
        imageAlt: { type: "text", label: "Texto alternativo de la imagen" },
        imageSide: {
          type: "radio",
          label: "Imagen a la",
          options: [
            { label: "Derecha", value: "right" },
            { label: "Izquierda", value: "left" },
          ],
        },
        background: BACKGROUND_FIELD,
      },
      defaultProps: { title: "Un título", text: "Un párrafo que explique la idea.", imageUrl: "", imageAlt: "", imageSide: "right", background: "paper" },
      render: ({ id, title, text, imageUrl, imageAlt, imageSide, background, puck }) => (
        <TextImageBlock
          id={id}
          title={title}
          text={text}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          imageSide={imageSide}
          background={background}
          emptyImage={
            puck.isEditing ? (
              <div className="grid aspect-4/3 place-items-center rounded-card border border-dashed border-field text-sm text-current">
                {/* text-current: the placeholder reads on light and dark sections alike. */}
                Sin imagen
              </div>
            ) : null
          }
        />
      ),
    },

    Faq: {
      label: "Preguntas frecuentes",
      fields: {
        title: { type: "text", label: "Título", contentEditable: true },
        background: {
          type: "radio",
          label: "Fondo",
          options: [
            { label: "Claro", value: "paper" },
            { label: "Blanco", value: "surface" },
          ],
        },
        items: {
          type: "array",
          label: "Preguntas",
          arrayFields: { question: { type: "text", label: "Pregunta" }, answer: { type: "textarea", label: "Respuesta" } },
          defaultItemProps: { question: "¿Pregunta?", answer: "Respuesta." },
          getItemSummary: (item) => item.question || "(sin pregunta)",
        },
      },
      defaultProps: {
        title: "Preguntas frecuentes",
        background: "paper",
        items: [{ question: "¿Cuánto tarda el proyecto?", answer: "Depende del alcance. Te doy una fecha antes de empezar." }],
      },
      render: ({ id, title, background, items }) => <FaqBlock id={id} title={title} background={background} items={items} />,
    },

    Cta: {
      label: "Llamado a la acción",
      fields: {
        title: { type: "text", label: "Título", contentEditable: true },
        text: { type: "textarea", label: "Texto", contentEditable: true },
        buttonLabel: { type: "text", label: "Botón" },
        buttonHref: { type: "text", label: `Enlace del botón (${LINK_HELP})` },
        background: {
          type: "radio",
          label: "Fondo",
          options: [
            { label: "Magenta", value: "brand" },
            { label: "Oscuro", value: "ink" },
          ],
        },
      },
      defaultProps: { title: "¿Tienes un proyecto en mente?", text: "", buttonLabel: "Cuéntame tu proyecto", buttonHref: "/contacto", background: "brand" },
      render: ({ id, title, text, buttonLabel, buttonHref, background, puck }) => (
        <CtaBlock
          id={id}
          title={title}
          text={text}
          buttonLabel={buttonLabel}
          buttonHref={localizeHref(buttonHref, localeOf(puck.metadata as Metadata))}
          background={background}
        />
      ),
    },

    Button: {
      label: "Botón",
      fields: {
        label: { type: "text", label: "Texto" },
        href: { type: "text", label: `Enlace (${LINK_HELP})` },
        variant: {
          type: "radio",
          label: "Estilo",
          options: [
            { label: "Principal", value: "primary" },
            { label: "Secundario", value: "secondary" },
          ],
        },
        align: {
          type: "radio",
          label: "Alineación",
          options: [
            { label: "Izquierda", value: "left" },
            { label: "Centro", value: "center" },
          ],
        },
      },
      defaultProps: { label: "Cuéntame tu proyecto", href: "/contacto", variant: "primary", align: "left" },
      render: ({ label, href, variant, align, puck }) => (
        <ButtonBlock label={label} href={localizeHref(href, localeOf(puck.metadata as Metadata))} variant={variant} align={align} />
      ),
    },

    Columns: {
      label: "Columnas",
      fields: {
        ratio: {
          type: "select",
          label: "Proporción",
          options: [
            { label: "Mitad y mitad", value: "1-1" },
            { label: "Ancha a la izquierda", value: "2-1" },
            { label: "Ancha a la derecha", value: "1-2" },
          ],
        },
        background: BACKGROUND_FIELD,
        left: { type: "slot", label: "Columna izquierda", allow: [...COLUMN_BLOCKS] },
        right: { type: "slot", label: "Columna derecha", allow: [...COLUMN_BLOCKS] },
      },
      defaultProps: { ratio: "1-1", background: "paper", left: [], right: [] },
      render: ({ ratio, background, left: Left, right: Right, puck }) => (
        <ColumnsBlock
          ratio={ratio}
          background={background}
          left={<Left className={slotClass(puck.isEditing)} />}
          right={<Right className={slotClass(puck.isEditing)} />}
        />
      ),
    },
  },
};
