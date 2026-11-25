import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import { contactIntents, phases, problems, startingProblems } from "./home";
import { demoProduct } from "./home-pieces";
import { demoStore, homeBuildSteps } from "./home-stage";

// Every string in a value, however deeply nested.
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(strings);
  return [];
}

describe("the home's process", () => {
  it("follows the approved prototype's six phases, in order", () => {
    expect(phases.map((phase) => phase.title.es)).toEqual([
      "Descubrimiento",
      "Arquitectura",
      "Diseño",
      "Desarrollo",
      "Lanzamiento",
      "Acompañamiento",
    ]);
  });

  it("puts the version ready to sell in the development phase", () => {
    const development = phases.find((phase) => phase.title.es === "Desarrollo");
    expect(development?.text.es).toBe("Primero una versión lista para vender; después, mejoras por fases que pruebas en un enlace real.");
  });

  it("keeps the support-scope placeholder only on the follow-up phase", () => {
    expect(phases.filter((phase) => phase.pending).map((phase) => phase.title.es)).toEqual(["Acompañamiento"]);
  });
});

describe("the home's voice (S5)", () => {
  // First person singular: "I" do the work. "¿Qué construimos?" invites the visitor, so it stays,
  // and the message placeholder is written in the visitor's voice, about their own company.
  const plural = /\b(empezamos|construimos|hacemos|trabajamos|nuestro|nuestra|nuestros|nuestras|nosotros|we|our|us)\b/i;
  const allowed = new Set(["¿Qué construimos?", "What shall we build?", en.Home.contact.messagePlaceholder]);
  const homeStrings = [
    ...strings({ contactIntents, phases, problems, startingProblems, demoProduct, demoStore, homeBuildSteps }),
    ...strings(es.Home),
    ...strings(en.Home),
  ];

  it("never speaks in the first person plural", () => {
    const offenders = homeStrings.filter((text) => !allowed.has(text) && plural.test(text));
    expect(offenders).toEqual([]);
  });
});

describe("the demo store", () => {
  it("names its products in each language, keeping the brand", () => {
    expect(demoStore.name).toBe("Taller Lumen");
    expect(demoStore.products.map((product) => product.name.en)).toEqual(["Lumen chair", "Ceiba bench", "Guadua stool"]);
    expect(demoStore.products.map((product) => product.name.es)).toEqual(["Silla Lumen", "Banca Ceiba", "Taburete Guadua"]);
  });

  it("uses the same chair name in the stage, its cart and the product piece", () => {
    const chair = demoStore.products[0].name;
    expect(demoProduct.name).toEqual(chair);
    expect(demoStore.cart.item.en.startsWith(chair.en)).toBe(true);
    expect(demoStore.cart.item.es.startsWith(chair.es)).toBe(true);
  });
});
