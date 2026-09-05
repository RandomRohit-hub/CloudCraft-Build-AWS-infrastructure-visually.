"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type NeuformMode = "dark" | "light";
type NeuformModePreference = NeuformMode | "auto";

type FocusTarget = {
  selector: string;
  role: "background" | "ui";
  width?: string;
};

type BakeKnobs = {
  size: number;
  gap: number;
  length: number;
  density: number;
  strokeWidth: number;
  mode: NeuformMode;
};

type EffectDefinition = {
  title: string;
  source: string;
  background: string | ((mode: NeuformMode) => string);
  defaultMode?: NeuformModePreference;
  supportsMode?: boolean;
  targets: readonly FocusTarget[];
  focusCss?: string;
  patch?: (source: string, knobs: BakeKnobs) => string;
};

export type GatewayFlowProps = {
  mode?: NeuformModePreference;
  speed?: number;
  size?: number;
  gap?: number;
  length?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

const GATEWAY_FLOW_DEFAULTS = {
  mode: "dark" as NeuformMode,
  speed: 1,
  size: 1,
  gap: 2,
  length: 1,
  density: 1,
  strokeWidth: 1,
  opacity: 1,
  hue: 0,
  saturation: 1,
  brightness: 1,
} as const;

const LIGHT_PAPER = "#eef1f6";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function scaleCount(base: number, density: number, minimum = 1) {
  return Math.max(minimum, Math.round(base * density));
}

function resolveMode(
  mode: NeuformMode | number | string | undefined,
  fallback: NeuformMode = "dark",
): NeuformMode {
  if (mode === undefined || mode === null) return fallback;
  if (mode === "light" || mode === 1 || mode === "1") return "light";
  return "dark";
}

function readAutomaticMode(): NeuformMode {
  if (typeof document === "undefined" || typeof window === "undefined")
    return "dark";
  const root = document.documentElement;
  const declared = root.dataset.scheme ?? root.dataset.theme;
  if (declared === "light" || declared === "dark") return declared;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useAutomaticMode(enabled: boolean) {
  const [mode, setMode] = useState<NeuformMode>(readAutomaticMode);

  useEffect(() => {
    if (
      !enabled ||
      typeof document === "undefined" ||
      typeof window === "undefined"
    )
      return undefined;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setMode(readAutomaticMode());
    const observer = new MutationObserver(update);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-scheme", "data-theme"],
    });
    media.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, [enabled]);

  return mode;
}

function resolveBackground(
  background: EffectDefinition["background"],
  mode: NeuformMode,
) {
  return typeof background === "function" ? background(mode) : background;
}

const gatewayFlowSource = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gateway Flow</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      canvas { display: block; width: 100%; height: 100%; }
    </style>
</head>
<body>
    <canvas id="c"></canvas>
    <script>
    (function() {
      const canvas = document.getElementById('c');
      const ctx = canvas.getContext('2d');
      let W, H, cx, cy;
      const NUM_LINES = 80;
      const DOT_SPACING = 28;   // px between dots along each line
      const DOT_SIZE = 1.6;     // radius of each path dot
      const PARTICLE_SIZE = 3;  // radius of the moving bright square
      const SPEED = 1.4;        // px per frame that particles move inward

      // Each line: angle from center to edge, particles array
      const lines = [];

      function resize() {
        const dpr = window.devicePixelRatio || 1;
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
        cx = W / 2;
        cy = H / 2;
        rebuildLines();
      }

      // For a given angle, find how far from center to reach the screen edge
      function edgeDistance(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        let t = Infinity;
        if (cos > 0)  t = Math.min(t, (W - cx) / cos);
        if (cos < 0)  t = Math.min(t, (-cx) / cos);
        if (sin > 0)  t = Math.min(t, (H - cy) / sin);
        if (sin < 0)  t = Math.min(t, (-cy) / sin);
        return t;
      }

      function rebuildLines() {
        lines.length = 0;
        for (let i = 0; i < NUM_LINES; i++) {
          const angle = (i / NUM_LINES) * Math.PI * 2;
          const maxDist = edgeDistance(angle);
          // Spawn particles at random positions along the line, moving inward
          const numParticles = Math.floor(1 + Math.random() * 2);
          const particles = [];
          for (let p = 0; p < numParticles; p++) {
            particles.push({
              dist: Math.random() * maxDist,   // current distance from center
              speed: SPEED * (0.7 + Math.random() * 0.8),
            });
          }
          lines.push({ angle, maxDist, particles });
        }
      }

      function render() {
        ctx.clearRect(0, 0, W, H);

        lines.forEach(line => {
          const cos = Math.cos(line.angle);
          const sin = Math.sin(line.angle);

          // --- Draw dotted path ---
          // Start dots a little away from center so center stays clean
          const startDist = 18;
          ctx.fillStyle = 'rgba(249,115,22,0.13)';
          for (let d = startDist; d < line.maxDist; d += DOT_SPACING) {
            const fade = d / line.maxDist;  // 0=near center, 1=edge → dim near edge
            const alpha = 0.05 + (1 - fade) * 0.18;
            ctx.globalAlpha = alpha;
            const x = cx + cos * d;
            const y = cy + sin * d;
            ctx.fillRect(x - DOT_SIZE, y - DOT_SIZE, DOT_SIZE * 2, DOT_SIZE * 2);
          }

          // --- Move & draw particles ---
          line.particles.forEach(p => {
            p.dist -= p.speed * ((window.__SF_CONTROLS && window.__SF_CONTROLS.speed) || 1);
            if (p.dist < 8) {
              // Reset to edge
              p.dist = line.maxDist * (0.6 + Math.random() * 0.4);
              p.speed = SPEED * (0.7 + Math.random() * 0.8);
            }

            const proximity = 1 - (p.dist / line.maxDist); // 0=edge, 1=center
            // Bright near center, dim at edge
            const brightness = 0.25 + proximity * 0.75;
            ctx.globalAlpha = brightness;

            const px = cx + cos * p.dist;
            const py = cy + sin * p.dist;
            const ps = PARTICLE_SIZE * (0.5 + proximity * 0.8);

            // Glow halo
            ctx.globalAlpha = brightness * 0.3;
            ctx.fillStyle = 'rgba(249,115,22,1)';
            ctx.fillRect(px - ps * 2.5, py - ps * 2.5, ps * 5, ps * 5);

            // Core bright square
            ctx.globalAlpha = brightness;
            ctx.fillStyle = proximity > 0.7
              ? '#ffffff'
              : proximity > 0.4
                ? '#fed7aa'
                : '#f97316';
            ctx.fillRect(px - ps, py - ps, ps * 2, ps * 2);
          });

          ctx.globalAlpha = 1;
        });

        requestAnimationFrame(render);
      }

      window.addEventListener('resize', resize);
      resize();
      render();
    })();
    </script>
</body>
</html>`;

const GATEWAY_FLOW_DEFINITION: EffectDefinition = {
  title: "Gateway Flow",
  source: gatewayFlowSource,
  supportsMode: true,
  background: (mode) => (mode === "light" ? LIGHT_PAPER : "#000000"),
  targets: [{ selector: "#c", role: "background" }],
  patch(source, { size, density }) {
    return source
      .replace(
        "const NUM_LINES = 80;",
        `const NUM_LINES = ${scaleCount(80, density, 12)};`,
      )
      .replace(
        "const DOT_SIZE = 1.6;",
        `const DOT_SIZE = ${Number((1.6 * size).toFixed(2))};`,
      );
  },
};

function buildFocusedDocument(
  definition: EffectDefinition,
  knobs: BakeKnobs & { speed: number; opacity: number },
) {
  const mode = knobs.mode;
  const background = resolveBackground(definition.background, mode);
  const controlsJson = JSON.stringify({
    mode,
    speed: knobs.speed,
    size: knobs.size,
    gap: knobs.gap,
    length: knobs.length,
    density: knobs.density,
    strokeWidth: knobs.strokeWidth,
    opacity: knobs.opacity,
  }).replace(/</g, "\\u003c");
  const patchedSource = definition.patch
    ? definition.patch(definition.source, {
        size: knobs.size,
        gap: knobs.gap,
        length: knobs.length,
        density: knobs.density,
        strokeWidth: knobs.strokeWidth,
        mode,
      })
    : definition.source;
  const controlScript = `<script data-sf-controls>
(function () {
  var controls = ${controlsJson};
  window.__SF_CONTROLS = controls;
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'threeui-controls') return;
    var next = event.data.controls || {};
    Object.keys(next).forEach(function (key) { controls[key] = next[key]; });
  });
})();
</script>`;

  return patchedSource
    .replace(/<head([^>]*)>/i, `<head$1>${controlScript}`)
    .replace(
      /<body([^>]*)>/i,
      `<body$1 style="background:${background};overflow:hidden;margin:0;padding:0;">`,
    );
}

function GatewayFlowFrame({
  definition,
  mode,
  speed = GATEWAY_FLOW_DEFAULTS.speed,
  size = GATEWAY_FLOW_DEFAULTS.size,
  gap = GATEWAY_FLOW_DEFAULTS.gap,
  length = GATEWAY_FLOW_DEFAULTS.length,
  density = GATEWAY_FLOW_DEFAULTS.density,
  strokeWidth = GATEWAY_FLOW_DEFAULTS.strokeWidth,
  opacity = GATEWAY_FLOW_DEFAULTS.opacity,
  hue = GATEWAY_FLOW_DEFAULTS.hue,
  saturation = GATEWAY_FLOW_DEFAULTS.saturation,
  brightness = GATEWAY_FLOW_DEFAULTS.brightness,
  className,
  style,
}: GatewayFlowProps & { definition: EffectDefinition }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const requestedMode =
    mode ?? definition.defaultMode ?? GATEWAY_FLOW_DEFAULTS.mode;
  const automaticMode = useAutomaticMode(requestedMode === "auto");
  const resolvedMode =
    requestedMode === "auto"
      ? automaticMode
      : resolveMode(requestedMode, GATEWAY_FLOW_DEFAULTS.mode);
  const background = resolveBackground(definition.background, resolvedMode);

  const safeSpeed = clamp(speed, 0, 3);
  const safeSize = clamp(size, 0.05, 200);
  const safeGap = clamp(gap, 0, 64);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);
  const safeStrokeWidth = clamp(strokeWidth, 0.25, 8);
  const safeOpacity = clamp(opacity, 0.05, 1);
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);

  const source = useMemo(
    () =>
      buildFocusedDocument(definition, {
        mode: resolvedMode,
        speed: GATEWAY_FLOW_DEFAULTS.speed,
        size: safeSize,
        gap: safeGap,
        length: safeLength,
        density: safeDensity,
        strokeWidth: safeStrokeWidth,
        opacity: GATEWAY_FLOW_DEFAULTS.opacity,
      }),
    [
      definition,
      resolvedMode,
      safeDensity,
      safeGap,
      safeLength,
      safeSize,
      safeStrokeWidth,
    ],
  );

  useEffect(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      {
        type: "threeui-controls",
        controls: {
          mode: resolvedMode,
          speed: safeSpeed,
          size: safeSize,
          gap: safeGap,
          length: safeLength,
          density: safeDensity,
          strokeWidth: safeStrokeWidth,
          opacity: safeOpacity,
        },
      },
      "*",
    );
  }, [
    resolvedMode,
    safeDensity,
    safeGap,
    safeLength,
    safeOpacity,
    safeSize,
    safeSpeed,
    safeStrokeWidth,
    source,
  ]);

  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title={definition.title}
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
        background,
        filter,
        ...style,
      }}
    />
  );
}

export default function GatewayFlow(props: GatewayFlowProps) {
  return <GatewayFlowFrame {...props} definition={GATEWAY_FLOW_DEFINITION} />;
}
