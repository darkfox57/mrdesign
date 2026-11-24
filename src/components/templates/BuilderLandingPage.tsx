import type { ComponentProps } from "react";
import { Render } from "@puckeditor/core/rsc";
import { JsonLd } from "@/components/atoms/JsonLd";
import type { Locale } from "@/i18n/routing";
import { builderConfig } from "@/lib/visual-builder/config";
import { faqJsonLd } from "@/lib/visual-builder/page-data";
import type { BuilderPage } from "@/lib/visual-builder/validate";

type BreadcrumbData = Parameters<typeof JsonLd>[0]["data"];

// A landing made with the visual builder, rendered on the server from its validated blocks. The
// layout adds the header and footer; the Hero block holds the page's only h1.
export function BuilderLandingPage({ blocks, locale, breadcrumb }: { blocks: BuilderPage; locale: Locale; breadcrumb: BreadcrumbData }) {
  const faq = faqJsonLd(blocks);
  return (
    <>
      <JsonLd data={breadcrumb} />
      {faq ? <JsonLd data={{ "@context": "https://schema.org", ...faq }} /> : null}
      <Render config={builderConfig} data={blocks as ComponentProps<typeof Render<typeof builderConfig>>["data"]} metadata={{ locale }} />
    </>
  );
}
