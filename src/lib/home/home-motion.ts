import type { MotionKit } from "./motion";

// The motion table of the homepage design spec. Rules it follows:
// - only transform, opacity and clip-path are animated, and nothing is pinned;
// - reveals use opacity (never visibility), so keyboard focus still reaches hidden elements, and a
//   focused element is revealed at once;
// - only elements below the fold when this runs are hidden for a reveal;
// - everything lives in one gsap.context: the returned cleanup reverts it to the static page.
const PHONE_MAX_WIDTH = 760;
// After this long the headline is already read: replaying its entrance would only flash.
const HERO_INTRO_WINDOW_MS = 3000;

export function setupHomeMotion(root: HTMLElement, { gsap, ScrollTrigger }: MotionKit): () => void {
  const small = root.clientWidth <= PHONE_MAX_WIDTH;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const viewportHeight = window.innerHeight || 900;
  const belowFold = (element: Element) => element.getBoundingClientRect().top > viewportHeight * 0.92;
  const all = (selector: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll<HTMLElement>(selector));
  const one = (selector: string) => root.querySelector<HTMLElement>(selector);
  const listeners: Array<() => void> = [];
  const listen = (target: EventTarget, type: string, handler: EventListener) => {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  };
  const reveals = new Map<HTMLElement, ReturnType<MotionKit["gsap"]["from"]>>();

  const context = gsap.context(() => {
    // 1. Hero: the headline rises line by line, "trabaja" is underlined, the rest fades in.
    const plates = all("[data-plate]");
    const gap = small ? 30 : 46;
    const spread = small ? 64 : 110;
    gsap.set(plates, { z: (index: number) => index * gap });
    const hero = one("[data-hero]");
    const heroInView = hero ? hero.getBoundingClientRect().bottom > 0 : false;
    if (heroInView && performance.now() < HERO_INTRO_WINDOW_MS) {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from(all("[data-hero-line]"), { yPercent: 110, duration: 0.9, stagger: 0.08 })
        .fromTo(one("[data-hl]"), { "--ul": 0 }, { "--ul": 1, duration: 0.6, ease: "power2.inOut" }, "-=0.35")
        .from(all("[data-hero-fade]"), { y: 18, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.55")
        .from(plates, { y: -60, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power2.out" }, 0.25);
    }

    // 2. Hero on scroll: the layers of the product separate in depth (scrub, decorative).
    if (hero) {
      gsap.to(plates, {
        z: (index: number) => index * spread,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom 20%", scrub: 0.6 },
      });
    }

    // 3. The stage tilts with the pointer (fine pointer and wide screens only).
    const stage = one("[data-stage]");
    const tilt = one("[data-tilt]");
    if (stage && tilt && finePointer && !small && stage.parentElement) {
      const rotateX = gsap.quickTo(tilt, "rotationX", { duration: 0.6, ease: "power3" });
      const rotateY = gsap.quickTo(tilt, "rotationY", { duration: 0.6, ease: "power3" });
      listen(stage.parentElement, "pointermove", (event) => {
        const { clientX, clientY } = event as PointerEvent;
        const box = stage.getBoundingClientRect();
        rotateY(((clientX - box.left) / box.width - 0.5) * 14);
        rotateX(-((clientY - box.top) / box.height - 0.5) * 10);
      });
      listen(stage.parentElement, "pointerleave", () => {
        rotateX(0);
        rotateY(0);
      });
    }

    // 4. Scroll reveal, only for what starts below the fold.
    for (const element of all("[data-reveal]")) {
      if (!belowFold(element)) continue;
      const tween = gsap.from(element, {
        y: 28,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 88%", once: true },
      });
      reveals.set(element, tween);
    }

    // 5. Problem, solution, result: the meters fill as the cards come in.
    const transformation = one("[data-problem-panel]");
    if (transformation && belowFold(transformation)) {
      gsap.fromTo(
        all("[data-meter]", transformation),
        { scaleX: 0 },
        {
          scaleX: (index: number) => (index + 1) / 3,
          duration: 0.9,
          stagger: 0.18,
          ease: "power2.inOut",
          scrollTrigger: { trigger: transformation, start: "top 75%", once: true },
        },
      );
    }

    // 6. Service schema: nodes come in one after another.
    const schema = one("[data-schema]");
    if (schema && belowFold(schema)) {
      gsap.from(all("[data-node]", schema), {
        opacity: 0,
        x: -10,
        duration: 0.4,
        stagger: 0.08,
        scrollTrigger: { trigger: schema, start: "top 85%", once: true },
      });
    }

    // 7. Cases: the browser opens like a window.
    const browser = one("[data-stagebox]");
    if (browser && belowFold(browser)) {
      gsap.from(browser, {
        clipPath: "inset(10% 8% 10% 8% round 22px)",
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: browser, start: "top 85%", once: true },
      });
    }

    // 8. Process: the line advances with the scroll and lights each phase.
    const process = one("[data-process]");
    const track = one("[data-process-track]");
    if (process && track) {
      gsap.fromTo(
        track,
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: process, start: "top 75%", end: "bottom 55%", scrub: 0.5 } },
      );
    }
    for (const phase of all("[data-phase]")) {
      ScrollTrigger.create({
        trigger: phase,
        start: "top 72%",
        onEnter: () => phase.setAttribute("data-on", ""),
        onLeaveBack: () => phase.removeAttribute("data-on"),
      });
    }

    // 9. Magnetic calls to action (desktop with a fine pointer), the header's included.
    if (finePointer && !small) {
      for (const button of all("[data-magnetic]", document)) {
        const moveX = gsap.quickTo(button, "x", { duration: 0.4, ease: "power3" });
        const moveY = gsap.quickTo(button, "y", { duration: 0.4, ease: "power3" });
        listen(button, "pointermove", (event) => {
          const { clientX, clientY } = event as PointerEvent;
          const box = button.getBoundingClientRect();
          moveX((clientX - box.left - box.width / 2) * 0.22);
          moveY((clientY - box.top - box.height / 2) * 0.3);
        });
        listen(button, "pointerleave", () => {
          moveX(0);
          moveY(0);
        });
      }
    }
  }, root);

  // Keyboard focus inside a section still waiting for its reveal shows it at once.
  listen(root, "focusin", (event) => {
    for (const [element, tween] of reveals) {
      if (!element.contains(event.target as Node)) continue;
      tween.scrollTrigger?.kill();
      tween.progress(1);
      reveals.delete(element);
    }
  });

  root.setAttribute("data-motion", "on");
  const frame = requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    cancelAnimationFrame(frame);
    for (const remove of listeners) remove();
    context.revert();
    for (const phase of all("[data-phase]")) phase.removeAttribute("data-on");
    root.removeAttribute("data-motion");
  };
}
