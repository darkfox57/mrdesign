import type { Locale } from "@/i18n/routing";

export type ProjectTag = "web" | "ecommerce";

export type Project = {
  id: string;
  name: string;
  image: string;
  imageAlt: Record<Locale, string>;
  tags: ProjectTag[];
};

// Projects carried over from the previous site. Images are square product or brand photos.
export const projects: Project[] = [
  {
    id: "ejercicio-inteligente",
    name: "Ejercicio Inteligente",
    image: "/portfolio/ejercicio-inteligente.jpg",
    imageAlt: { es: "Reloj deportivo Polar con el pronóstico del clima en pantalla", en: "Polar sports watch showing a weather forecast" },
    tags: ["web", "ecommerce"],
  },
  {
    id: "llantas-y-tires",
    name: "Llantas & Tires",
    image: "/portfolio/yokohama-col.jpg",
    imageAlt: { es: "Llanta todoterreno montada en una camioneta roja", en: "Off-road tire mounted on a red SUV" },
    tags: ["web", "ecommerce"],
  },
  {
    id: "lecoq-sportif",
    name: "Le Coq Sportif",
    image: "/portfolio/lecoq-sportif.jpg",
    imageAlt: { es: "Tenis blancos de Le Coq Sportif", en: "White Le Coq Sportif sneakers" },
    tags: ["web", "ecommerce"],
  },
  {
    id: "ocula-optica",
    name: "Ocula Óptica",
    image: "/portfolio/ocula-optical.jpg",
    imageAlt: { es: "Hombre con gafas junto a una montura Zeiss de titanio", en: "Man wearing glasses next to a Zeiss titanium frame" },
    tags: ["web"],
  },
  {
    id: "movimiento-clic",
    name: "Movimiento Clic",
    image: "/portfolio/movimiento-clic.jpg",
    imageAlt: { es: "Ilustración 3D de un personaje rodeado de íconos creativos", en: "3D illustration of a character surrounded by creative icons" },
    tags: ["web"],
  },
  {
    id: "lobo-express",
    name: "Lobo Express",
    image: "/portfolio/loboexpress.jpg",
    imageAlt: { es: "Botella de whisky The Glenlivet entre frutas", en: "Bottle of The Glenlivet whisky among fruit" },
    tags: ["web", "ecommerce"],
  },
];
