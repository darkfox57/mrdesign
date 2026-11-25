import { cn } from "@/lib/cn";
import { Bar, Box, Check, Lock, Pill, Screen, Toggle, Token, Warning, Wire, styles } from "./parts";

// Stage screens of the lines that build systems: apps, platform evolution and plugins. Each follows
// its line's six build steps (src/content/service-lines/<line>.ts, buildSteps[n].visualHint).

// Apps: data, screens, workflows, permissions, dashboard, live.
export function AppsScreen() {
  const rows = [0, 1, 2, 3];
  return (
    <Screen>
      <div data-out="1" className="absolute inset-0 flex items-center justify-center px-4">
        <div className="flex w-full max-w-lg items-center">
          {["Customer", "Order", "Status"].map((entity, index) => (
            <div key={entity} className="flex flex-1 items-center">
              {index > 0 ? <Wire className="w-4 flex-none md:w-8" /> : null}
              <Box part={entity} className="flex flex-1 flex-col gap-1.5 p-2.5 pt-3.5">
                <Token className="text-on-ink-muted">id</Token>
                <Bar className="w-[80%]" />
                <Bar className="w-[60%]" />
                <Bar className="w-[50%]" />
              </Box>
            </div>
          ))}
        </div>
      </div>

      <div data-in="1" data-fx="fade" className="absolute inset-3 flex gap-3 md:inset-5">
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-lg border border-ink-line">
          <div className="flex w-9 flex-none flex-col gap-2 bg-ink p-2 md:w-12">
            {[0, 1, 2, 3].map((item) => (
              <Bar key={item} tone={item === 0 ? "accent" : undefined} />
            ))}
          </div>
          <div className="relative flex min-w-0 flex-1 flex-col gap-2 bg-ink-high p-2.5">
            <span data-in="3" data-out="4" className="flex gap-1">
              {["admin", "team", "customer"].map((role) => (
                <Pill key={role} data-lit={role === "team" ? "3" : undefined}>
                  {role}
                </Pill>
              ))}
            </span>
            <div data-out="4" className="flex flex-col gap-1.5">
              {rows.map((row) => (
                <span key={row} className="flex items-center gap-2 border-b border-ink-line pb-1.5">
                  <Bar className="w-[30%]" />
                  <Bar className="flex-1" />
                  {row === 0 ? (
                    <span className="grid justify-items-end">
                      <Pill data-out="2" className="[grid-area:1/1]">
                        NEW
                      </Pill>
                      <Pill data-in="2" data-fx="pop" data-lit="2" className="[grid-area:1/1]">
                        APPROVED
                      </Pill>
                    </span>
                  ) : (
                    <Pill className="text-on-ink-muted">···</Pill>
                  )}
                  <span data-in="3" data-out="4" className="text-on-ink-muted">
                    <Lock />
                  </span>
                </span>
              ))}
              <span className="mt-1 grid grid-cols-2 gap-2">
                <span className="flex flex-col gap-1.5 rounded-md border border-ink-line p-2">
                  <Bar className="w-[70%]" />
                  <Bar className="w-[50%]" />
                </span>
                <span className="flex flex-col gap-1.5 rounded-md border border-ink-line p-2">
                  <span className="block h-3 rounded border border-ink-line" />
                  <span className="block h-3 rounded bg-brand-500" />
                </span>
              </span>
            </div>
            <div data-in="4" className="absolute inset-2.5 flex flex-col gap-2.5">
              <span className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((tile) => (
                  <span key={tile} className="flex flex-col gap-1.5 rounded-md border border-ink-line p-2">
                    <Bar className="w-[50%]" />
                    <Bar thick tone={tile === 0 ? "accent" : "light"} className="w-[70%]" />
                  </span>
                ))}
              </span>
              <span className="flex flex-1 items-end gap-2 rounded-md border border-ink-line p-2.5">
                {[45, 80, 60, 30, 70].map((height, index) => (
                  <span key={index} className="flex-1 rounded-sm bg-brand-400/80" style={{ height: `${height}%` }} />
                ))}
              </span>
            </div>
          </div>
        </div>
        <div className={cn(styles.phone, "hidden w-24 flex-none flex-col gap-1.5 bg-ink-high p-2 sm:flex md:w-28")}>
          <Bar tone="accent" className="mt-2 w-[50%]" />
          {[0, 1, 2, 3].map((row) => (
            <span key={row} className="block h-5 rounded border border-ink-line" />
          ))}
        </div>
      </div>

      <div data-in="2" data-fx="right" data-out="3" className="absolute right-4 bottom-4 flex w-[55%] items-center gap-2 rounded-lg border border-ink-line bg-paper p-2.5 text-text shadow-stage md:right-7 md:bottom-7 md:w-[45%]">
        <span className="flex size-6 flex-none items-center justify-center rounded-full bg-brand-500 text-brand-950">@</span>
        <span className="flex flex-1 flex-col gap-1">
          <Token>order.approved</Token>
          <span className={cn(styles.bar, styles.muted, "w-[70%]")} />
        </span>
      </div>

      <Pill data-in="5" data-fx="pop" data-lit="5" className="absolute bottom-5 left-14 z-10 md:bottom-8 md:left-20">
        <Check /> live
      </Pill>
    </Screen>
  );
}

// Platform evolution: audit, priorities, tests, refactor, upgrade, live.
export function EvolutionScreen() {
  const tangled = [
    [0, 80],
    [1, 60],
    [2, 70],
    [2, 45],
    [1, 85],
    [3, 50],
    [3, 65],
    [2, 40],
    [1, 75],
    [0, 55],
    [1, 70],
    [2, 50],
    [4, 45],
    [4, 60],
    [3, 35],
    [2, 70],
    [1, 55],
    [0, 40],
    [1, 80],
    [2, 45],
  ];
  const findings = [
    { name: "outdated", top: "12%" },
    { name: "duplicate", top: "34%" },
    { name: "untested", top: "56%" },
    { name: "runtime", top: "78%" },
  ];
  return (
    <Screen>
      <div className="absolute inset-y-3 left-3 w-[54%] overflow-hidden rounded-lg border border-ink-line bg-ink p-2.5 md:inset-y-5 md:left-5 md:p-3.5">
        <Token className="text-on-ink-muted">legacy/app.js</Token>
        <div data-out="3" className="mt-2 flex flex-col gap-1.5">
          {tangled.map(([indent, width], index) => (
            <Bar key={index} tone={index % 4 === 1 ? "muted" : undefined} style={{ marginLeft: `${indent * 0.75}rem`, width: `${width}%` }} />
          ))}
        </div>
        <div data-in="3" className="absolute inset-x-2.5 top-9 bottom-2.5 flex flex-col gap-2 md:inset-x-3.5">
          {["<Cart />", "<Contact />", "<Auth />"].map((module) => (
            <Box key={module} part={module} data-solid="3" className="flex flex-1 flex-col justify-center gap-1.5 px-2.5">
              <Bar className="w-[70%]" />
              <Bar className="w-[45%]" />
            </Box>
          ))}
        </div>
        {findings.map((finding) => (
          <Pill key={finding.name} data-alert="0" data-out="1" className="absolute right-2 bg-ink-high" style={{ top: finding.top }}>
            <Warning /> {finding.name}
          </Pill>
        ))}
      </div>

      <div className="absolute inset-y-3 right-3 w-[38%] md:inset-y-5 md:right-5">
        <div data-in="1" data-out="2" className="absolute inset-0 grid grid-cols-3 gap-1.5">
          {["01", "02", "03"].map((phase, column) => (
            <span key={phase} className="flex flex-col gap-1.5 rounded-lg border border-ink-line bg-ink-high p-1.5">
              <Token className="text-brand-400">{phase}</Token>
              {Array.from({ length: 3 - column }, (_, card) => (
                <span key={card} data-alert="1" className="block h-6 rounded-md border border-ink-line" />
              ))}
            </span>
          ))}
        </div>

        <div data-in="2" data-out="4" className="absolute inset-x-0 top-0 flex flex-col gap-2 rounded-lg border border-ink-line bg-ink-high p-2.5">
          {["checkout.spec", "contact.spec", "login.spec"].map((spec) => (
            <span key={spec} className="flex items-center gap-2">
              <span data-lit="2" className="rounded-full border border-ink-line p-0.5">
                <Check className="size-2.5" />
              </span>
              <Token className="truncate text-on-ink-muted">{spec}</Token>
            </span>
          ))}
        </div>

        <div data-in="4" data-out="5" className="absolute inset-x-0 top-0 flex flex-col gap-2">
          {["runtime", "framework", "packages"].map((part) => (
            <span key={part} className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink-high px-2 py-1.5">
              <Token className="flex-1 truncate text-on-ink-muted">{part}</Token>
              <Pill data-lit="4">
                ↑ <Check className="size-2.5" />
              </Pill>
            </span>
          ))}
        </div>

        <div data-in="5" className="absolute inset-0 flex flex-col gap-2">
          <span className="flex flex-col gap-1.5 rounded-lg border border-ink-line bg-ink-high p-2.5">
            <Token className="text-on-ink-muted">deploy</Token>
            <span data-in="5" data-fx="grow" className="block h-1.5 rounded-full bg-live" />
          </span>
          <span className={cn(styles.paper, "flex flex-1 flex-col gap-1.5 rounded-lg p-2.5")}>
            <Token className="text-brand-600">docs/</Token>
            <Bar tone="ink" className="w-[70%]" />
            <Bar className="w-[90%]" />
            <Bar className="w-[60%]" />
          </span>
          <Pill data-lit="5" className="self-start">
            02 ›
          </Pill>
        </div>
      </div>
    </Screen>
  );
}

// Plugins and integrations: map, hooks, settings, integration, tests, live.
export function PluginsScreen() {
  const links = [
    { label: "stock", top: "top-[14%]", alert: false },
    { label: "orders", top: "top-[46%]", alert: true },
  ];
  return (
    <Screen>
      <Box part="<Store />" data-solid="3" className="absolute top-[6%] bottom-[34%] left-3 flex w-[32%] flex-col justify-center gap-1.5 p-2.5 md:left-5">
        {["order.created", "product.updated"].map((event) => (
          <span key={event} data-in="1" className="flex items-center gap-1.5">
            <span data-lit="1" className="size-2 flex-none rounded-full border border-ink-line" />
            <Token className="truncate text-on-ink-muted">{event}</Token>
          </span>
        ))}
        <Bar data-out="1" className="w-[70%]" />
        <Bar data-out="1" className="w-[50%]" />
      </Box>

      <Box part="<Inventory />" data-solid="3" className="absolute top-[6%] right-3 flex h-[26%] w-[32%] flex-col justify-center gap-1.5 p-2.5 md:right-5">
        <Bar className="w-[70%]" />
        <Bar className="w-[40%]" />
      </Box>
      <Box part="<Invoicing />" data-solid="3" className="absolute top-[40%] right-3 flex h-[26%] w-[32%] flex-col justify-center gap-1.5 p-2.5 md:right-5">
        <Bar className="w-[60%]" />
        <Bar className="w-[45%]" />
      </Box>

      {links.map((link) => (
        <div key={link.label} className={cn("absolute right-[36%] left-[36%] md:right-[35%] md:left-[35%]", link.top)}>
          <Token className="mb-1 block text-center text-on-ink-muted">{link.label}</Token>
          <span className="relative block">
            <Wire data-solid="3" data-alert={link.alert ? "4" : undefined} data-lit={link.alert ? "5" : "3"} />
            <span className={styles.packet} />
            <span className={styles.packet} />
          </span>
        </div>
      ))}

      <div data-in="2" data-fx="right" data-out="3" className="absolute inset-y-3 right-3 z-10 flex w-[52%] flex-col gap-2 rounded-lg border border-ink-line bg-ink-high p-2.5 shadow-stage md:inset-y-5 md:right-5 md:p-3.5">
        <Token className="text-brand-400">{"<Settings />"}</Token>
        {[0, 1].map((row) => (
          <span key={row} className="flex items-center gap-2">
            <Bar className="flex-1" />
            <Toggle on="2" />
          </span>
        ))}
        <span className="rounded-md border border-ink-line px-2 py-1.5">
          <Token className="text-on-ink-muted">api_key ••••••••</Token>
        </span>
        <span className="flex items-center justify-between rounded-md border border-ink-line px-2 py-1.5">
          <Bar className="w-[50%]" />
          <span className="text-on-ink-muted">▾</span>
        </span>
      </div>

      <Pill data-in="4" data-fx="pop" data-out="5" className="absolute top-[58%] left-1/2 z-10 -translate-x-1/2 bg-ink-high text-on-ink-muted">
        ↻ retry
      </Pill>
      <div data-in="4" data-fx="pop" data-out="5" className="absolute bottom-3 left-1/2 z-10 flex w-[60%] -translate-x-1/2 items-center gap-2 rounded-lg border border-danger-soft bg-ink-high p-2 text-danger-soft md:bottom-5">
        <Warning />
        <Token className="truncate">sync_failed · invoice</Token>
      </div>

      <div data-in="5" className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-1 rounded-lg border border-ink-line bg-ink p-2 md:inset-x-5 md:bottom-5">
        {["order.synced", "stock.synced", "invoice.synced"].map((entry) => (
          <span key={entry} className="flex items-center gap-1.5 text-live">
            <Check className="size-2.5" />
            <Token>{entry}</Token>
          </span>
        ))}
      </div>
    </Screen>
  );
}
