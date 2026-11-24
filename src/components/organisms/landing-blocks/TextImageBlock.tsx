import Image from "next/image";
import type { ReactNode } from "react";
import { BACKGROUNDS, SECTION_Y, type Background } from "./styles";

type TextImageBlockProps = {
  id: string;
  title: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
  imageSide: "left" | "right";
  background: Background;
  // Shown instead of the image while editing a block that has none; the public page shows nothing.
  emptyImage?: ReactNode;
};

// A title and a paragraph next to an image from the library. Inside Columns or the hero's side
// (data-nested) it stacks and takes the colors of the section around it.
export function TextImageBlock({ id, title, text, imageUrl, imageAlt, imageSide, background, emptyImage }: TextImageBlockProps) {
  const look = BACKGROUNDS[background];
  const media = imageUrl ? (
    <Image
      src={imageUrl}
      alt={imageAlt}
      width={1200}
      height={900}
      sizes="(min-width: 64rem) 36rem, 100vw"
      className="aspect-4/3 w-full rounded-card object-cover"
    />
  ) : (
    emptyImage
  );

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`${look.section} ${SECTION_Y} in-data-nested:bg-transparent in-data-nested:py-0 in-data-nested:text-inherit in-data-nested:lg:py-0`}
    >
      <div
        className={`site-container grid items-center gap-10 in-data-nested:max-w-none in-data-nested:gap-6 in-data-nested:px-0 ${media ? "lg:grid-cols-2 in-data-nested:lg:grid-cols-1" : ""}`}
      >
        <div>
          <h2
            id={`${id}-title`}
            className={`text-headline ${look.title} in-data-nested:text-title in-data-nested:text-inherit`}
          >
            {title}
          </h2>
          {text ? (
            <p className={`text-lead mt-5 max-w-prose whitespace-pre-line ${look.text} in-data-nested:mt-3 in-data-nested:text-inherit`}>
              {text}
            </p>
          ) : null}
        </div>
        {media ? <div className={imageSide === "left" ? "lg:order-first in-data-nested:lg:order-0" : undefined}>{media}</div> : null}
      </div>
    </section>
  );
}
