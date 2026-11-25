"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./HeroStage.module.css";

export type HeroLayerItem = { number: string; name: string; description: string };
type HubLabels = { api: string; systems: [string, string, string, string] };

type HeroLayersProps = { layers: HeroLayerItem[]; legendLabel: string; hub: HubLabels };

// The plates from the bottom (integrations) to the top (interface); index = position in `layers`.
const plateClass = [styles.l1, styles.l2, styles.l3, styles.l4];

// The 3D stage is decoration (aria-hidden); its information is in the legend, which is keyboard
// reachable. Hover or focus previews a layer, a click pins it, a second click unpins it.
export function HeroLayers({ layers, legendLabel, hub }: HeroLayersProps) {
  const [hovered, setHovered] = useState(-1);
  const [pinned, setPinned] = useState(-1);
  const active = hovered > -1 ? hovered : pinned;

  const drawings = [
    <Fragment key="interface">
      <div className={styles.uiBar}>
        <i />
        <i />
        <i />
      </div>
      <div className={styles.uiHero}>
        <i />
        <i />
        <i />
      </div>
      <div className={styles.uiCards}>
        <i />
        <i />
        <i />
      </div>
    </Fragment>,
    <Fragment key="logic">
      <div className={styles.flow}>
        <i />
        <i />
        <i />
      </div>
      <div className={styles.flowRow}>
        <i />
        <i />
      </div>
    </Fragment>,
    <div key="data" className={styles.rows}>
      {Array.from({ length: 6 }, (_, index) => (
        <i key={index} />
      ))}
    </div>,
    <div key="integrations" className={styles.hub}>
      <b>{hub.api}</b>
      {hub.systems.map((system) => (
        <span key={system}>{system}</span>
      ))}
    </div>,
  ];

  return (
    <div data-hero-fade="" className="mx-auto flex w-full max-w-155 flex-col gap-5 lg:max-w-none">
      <div data-stage="" data-active={active > -1 ? active : undefined} aria-hidden="true" className={styles.stage}>
        <div data-tilt="" className={styles.tilt}>
          <div className={styles.stack}>
            {[...layers.keys()].reverse().map((index) => (
              <div
                key={index}
                data-plate=""
                data-on={active === index ? "" : undefined}
                className={cn(styles.plate, plateClass[index])}
              >
                <span className={styles.tag}>
                  {layers[index].number} · {layers[index].name}
                </span>
                {drawings[index]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div role="group" aria-label={legendLabel} className="grid grid-cols-2 gap-2">
        {layers.map((layer, index) => (
          <button
            key={layer.number}
            type="button"
            aria-pressed={pinned === index}
            onClick={() => setPinned(pinned === index ? -1 : index)}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(-1)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(-1)}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-ink-line p-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-500/7 aria-pressed:border-brand-500 aria-pressed:bg-brand-500/7 md:p-3.5"
          >
            <span className="pt-0.5 font-mono text-xs text-brand-500">{layer.number}</span>
            <span>
              <span className="block text-md font-semibold">{layer.name}</span>
              <span className="mt-0.5 hidden text-caption leading-snug text-on-ink-muted md:block">{layer.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
