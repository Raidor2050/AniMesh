# AniMesh Performance Architecture & Recommendations

## 1. Recommended Tech Stack

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Renderer** | Three.js (r171+) `WebGLRenderer` | ~150KB gzipped. 95-99% of raw WebGL performance. ShaderMaterial + postprocessing ecosystem is mature. WebGPURenderer is ~2x slower CPU on multi-mesh scenes as of r183 — avoid for now. |
| **React Integration** | React Three Fiber (v9) for **UI shell only** | Zero reconciler overhead during steady-state render loop. Use `useFrame` for mutations, not React state. Keep the canvas as a single imperative `<Canvas>` with manual scene management underneath. |
| **Postprocessing** | `@react-three/postprocessing` + custom `Effect` subclasses | EffectComposer with MRT support. Write custom GLSL passes as Three.js `ShaderMaterial` objects. |
| **Build** | Vite 6 + TypeScript 5 | Native ESM dev, Rollup production builds with tree-shaking. |
| **Audio** | Web Audio API directly (no wrapper) | Precise `AnalyserNode` FFT data at audio worklet rate. |

**Why not raw WebGL**: A shader-heavy lab still needs a scene graph, material system, uniform management, and postprocessing chain. Rebuilding that is months of work. Three.js `ShaderMaterial` gives full GLSL control with zero framework overhead on the hot path.

**Why not React Three Fiber for everything**: The reconciler adds startup cost and can cause unnecessary re-renders if components aren't memoized correctly. Use R3F only for the React UI overlay (buttons, panels, file browser). The shader canvas should be a single imperative component using `useRef` + `useFrame`.

## 2. Build Configuration (Vite + TypeScript)

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl'; // import/export in GLSL files

export default defineConfig({
  base: '/AniMesh/', // GitHub Pages subdirectory
  plugins: [
    react(),
    glsl(), // enables #include, #pragma, import in .glsl/.frag/.vert
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'ui': ['react', 'react-dom'],
          // Shader library chunks split by category — see §5
        },
      },
    },
    chunkSizeWarningLimit: 500, // KB
  },
  assetsInclude: ['**/*.glsl', '**/*.frag', '**/*.vert'],
});
```

**GLSL handling**: Use `vite-plugin-glsl` for `#include` support, const injection, and tree-shaking of unused shader functions. Store shaders in `src/shaders/{category}/{name}.frag`.

## 3. Rendering Loop Optimization

### requestAnimationFrame pattern

```ts
// Core loop — never skip frames, never drift
class RenderLoop {
  private clock = new THREE.Clock();
  private stats: PerformanceMonitor;

  tick = () => {
    requestAnimationFrame(this.tick);

    const delta = this.clock.getDelta();  // ~16.67ms at 60fps
    const elapsed = this.clock.getElapsedTime();

    this.stats.begin();

    // 1. Update audio data (cheap — just memcpy from analyser)
    this.audioAnalyzer.update();

    // 2. Update uniforms (direct mutation, no React)
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uAudioLevel.value = this.audioAnalyzer.level;

    // 3. Update postprocessing params if quality changed
    this.adaptiveQuality.update(delta);

    // 4. Render
    this.composer.render(delta);

    this.stats.end();
  };
}
```

### Frame budget: 16.67ms total (60fps target)

| Phase | Budget | Notes |
|-------|--------|-------|
| Audio analysis | <1ms | FFT on AudioWorklet thread, main thread just reads typed array |
| Uniform updates | <0.5ms | Direct `.value` mutation on ShaderMaterial uniforms |
| Scene graph traversal | <1ms | Minimal scene — mostly fullscreen quads |
| Fragment shader | 4-12ms | The bottleneck — adaptive quality scales this |
| Postprocessing passes | 2-6ms | Bloom, chromatic aberration, etc. |
| React UI updates | <1ms | Only when panel state changes, never in hot loop |

### Avoiding jank

- **Never allocate in the render loop**: Pre-allocate all `Vector3`, `Color`, `Float32Array` objects. R3F's `useFrame` is safe for mutation if you avoid creating new objects.
- **Batch uniform updates**: Set all uniforms in a single pass before `render()`.
- **Use `renderer.setAnimationLoop()`** instead of raw `requestAnimationFrame` when possible — it handles context loss/restore automatically.
- **Avoid `gl.finish()` or `gl.readPixels()`** in production — they stall the GPU pipeline.

## 4. Adaptive Quality System

### GPU frame time measurement

Use `EXT_disjoint_timer_query` (WebGL2):

```ts
class GPUTimer {
  private ext: EXT_disjoint_timer_query;
  private query: WebGLQuery | null = null;
  private gpuTime = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  }

  begin(gl: WebGL2RenderingContext) {
    this.query = gl.createQuery();
    gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.query);
  }

  end(gl: WebGL2RenderingContext) {
    gl.endQuery(this.ext.TIME_ELAPSED_EXT);
  }

  poll(gl: WebGL2RenderingContext): number | null {
    if (!this.query) return null;
    const available = gl.getQueryParameter(this.query, gl.QUERY_RESULT_AVAILABLE_EXT);
    const disjoint = gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    if (available && !disjoint) {
      this.gpuTime = gl.getQueryParameter(this.query, gl.QUERY_RESULT_EXT) / 1e6; // ns → ms
      gl.deleteQuery(this.query);
      this.query = null;
      return this.gpuTime;
    }
    return null; // not ready yet
  }
}
```

**Fallback**: If `EXT_disjoint_timer_query` unavailable, use CPU-side `performance.now()` around `renderer.render()` — less accurate but useful for relative comparison.

### Resolution scaling

```ts
class AdaptiveQuality {
  private scale = 1.0;          // 0.25 — 1.0
  private targetFPS = 60;
  private frameBudget = 1000 / this.targetFPS; // 16.67ms
  private scaleUpCounter = 0;
  private readonly SCALE_UP_THRESHOLD = 60; // frames of headroom before scaling up

  update(delta: number, gpuTime: number | null) {
    const effectiveTime = gpuTime ?? (delta * 1000);

    if (effectiveTime > this.frameBudget) {
      // Over budget — scale down proportionally
      const overshoot = effectiveTime / this.frameBudget;
      this.scale = Math.max(0.25, this.scale / overshoot);
      this.scaleUpCounter = 0;
    } else {
      // Under budget — scale up conservatively
      const headroom = 1 - (effectiveTime / this.frameBudget);
      if (headroom > 0.06) {
        this.scaleUpCounter++;
        if (this.scaleUpCounter > this.SCALE_UP_THRESHOLD) {
          this.scale = Math.min(1.0, this.scale * 1.02);
          this.scaleUpCounter = 0;
        }
      }
    }
  }

  apply(renderer: THREE.WebGLRenderer, resolution: { width: number; height: number }) {
    const w = Math.floor(resolution.width * this.scale);
    const h = Math.floor(resolution.height * this.scale);
    renderer.setSize(w, h, false);
    // Update postprocessing composer to match
  }
}
```

### Quality tiers

| Tier | Resolution | Post FX | Bloom | Max Uniforms |
|------|-----------|---------|-------|--------------|
| **LOW** | 0.35x | 1 pass | Off | 8 |
| **MEDIUM** | 0.55x | 2 passes | Half-res | 16 |
| **HIGH** | 0.75x | 3 passes | Full-res | 32 |
| **ULTRA** | 1.0x | 4+ passes | Full-res + HDR | 64 |

Auto-detect on startup: run a 30-frame benchmark with a representative shader. Measure median GPU time. Map to tier. Allow manual override in settings panel.

## 5. Lazy Loading Strategies

### Shader compilation caching

```ts
// Compile shaders eagerly during idle time using requestIdleCallback
const shaderQueue: { name: string; vert: string; frag: string }[] = [];

async function compileNextShader(gl: WebGL2RenderingContext) {
  if (shaderQueue.length === 0) return;

  const { name, vert, frag } = shaderQueue.shift()!;
  const startTime = performance.now();

  const vs = compileShader(gl, gl.VERTEX_SHADER, vert);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag);
  const program = linkProgram(gl, vs, fs);

  const compileTime = performance.now() - startTime;
  console.log(`Compiled ${name} in ${compileTime.toFixed(1)}ms`);

  // Cache compiled program binary if available
  const binary = gl.getProgramBinary(program);
  if (binary) {
    localStorage.setItem(`shader_binary_${name}`, JSON.stringify({
      format: binary.binaryFormat,
      data: Array.from(new Uint8Array(binary.binaryString)),
    }));
  }

  compiledPrograms.set(name, program);

  // Continue on next idle frame
  if (shaderQueue.length > 0) {
    requestIdleCallback(() => compileNextShader(gl));
  }
}
```

**Important**: Browsers cache compiled shaders internally after first compile. The browser-level cache is the primary optimization. Application-level caching via `getProgramBinary`/`setProgramBinary` provides additional benefit for repeat visits.

### Lazy loading shader library

```ts
// Code-split shader categories
// src/shaders/generative/index.ts — lazy loaded
export async function loadGenerativeShaders() {
  const modules = await Promise.all([
    import('./voronoi.frag'),
    import('./noise.frag'),
    import('./fractal.frag'),
  ]);
  return modules.map(m => m.default);
}

// Route-based splitting
const ShaderLab = React.lazy(() => import('./pages/ShaderLab'));
const Gallery = React.lazy(() => import('./pages/Gallery'));
```

## 6. Resource Management

### Disposal pattern

```ts
class ShaderManager {
  private programs = new Map<string, WebGLProgram>();
  private materials = new Map<string, THREE.ShaderMaterial>();
  private renderTargets = new Map<string, THREE.WebGLRenderTarget>();

  switchShader(name: string) {
    // Dispose previous shader resources
    this.disposeCurrent();

    // Load new
    const material = this.createMaterial(name);
    this.materials.set(name, material);
  }

  disposeCurrent() {
    for (const [, rt] of this.renderTargets) {
      rt.dispose();               // frees GPU texture memory
    }
    this.renderTargets.clear();

    for (const [, mat] of this.materials) {
      mat.dispose();              // frees program + uniforms
      // Also dispose any textures owned by this material
      Object.values(mat.uniforms).forEach(u => {
        if (u.value?.isTexture) u.value.dispose();
      });
    }
    this.materials.clear();
  }

  dispose() {
    this.disposeCurrent();
    for (const [, prog] of this.programs) {
      this.gl.deleteProgram(prog);
    }
    this.programs.clear();
  }
}
```

### Rules

- **Always call `.dispose()` on**: `Geometry`, `Material`, `Texture`, `WebGLRenderTarget`, `BufferAttribute`.
- **Never dispose shared resources** (e.g., a geometry used by 10 materials).
- **Track allocations**: Wrap `createObjectURL` calls and ensure `revokeObjectURL` is called.
- **Monitor `renderer.info.memory`**: textures and geometries counts should not grow monotonically. If they do, you have a leak.

## 7. GitHub Pages Deployment

### SPA routing — use hash router

GitHub Pages cannot serve `index.html` for arbitrary paths. Two options:

1. **Hash router** (recommended for AniMesh): URLs like `/#/editor/voronoi`. Simple, no server config needed.
2. **404.html redirect**: Place a `public/404.html` that redirects to `index.html?redirect=<path>`. More complex, fragile.

### Caching strategy

```
# Vite outputs:
/dist/
  index.html              ← no-cache (always revalidate)
  assets/
    index-[hash].js       ← immutable (1 year cache)
    index-[hash].css      ← immutable (1 year cache)
    three-[hash].js       ← immutable (separate chunk, cached independently)
```

Vite's default `[hash]` filenames give us cache-busting for free. Set `Cache-Control: max-age=31536000, immutable` for hashed assets via a custom `_headers` file or GitHub Pages defaults.

### Bundle targets

| Metric | Target | Notes |
|--------|--------|-------|
| Initial JS (gzipped) | <150KB | Three.js core + React + app shell |
| Shader library (total) | <50KB gzipped | Split by category, lazy-loaded |
| Total first load | <300KB | Acceptable for broadband; show loading screen |
| Time to first shader render | <2s | On 4G connection |

## 8. React Performance

### Anti-patterns to avoid

```tsx
// BAD: state updates on every frame
function ShaderPanel() {
  const [fps, setFps] = useState(0);
  useFrame(() => setFps(performance.now())); // re-renders 60x/sec!
}

// GOOD: ref-based updates, no re-render
function ShaderPanel() {
  const fpsRef = useRef<HTMLSpanElement>(null);
  useFrame(() => {
    if (fpsRef.current) fpsRef.current.textContent = fps.toFixed(0);
  });
}
```

### Rules

- **High-frequency data (FPS, audio level, time)**: Use `useRef` + direct DOM mutation. Never React state.
- **Low-frequency data (shader selection, quality tier, panel open/close)**: Normal React state is fine.
- **Separate React state from render loop**: The canvas and UI are independent. React should never trigger a Three.js re-render.
- **Memoize shader components**: `React.memo` on any component that takes a shader name as prop.

### Profiling

1. React DevTools Profiler → flamegraph → look for unexpected re-renders during playback.
2. Chrome Performance tab → record 5 seconds → look for long "Recalculate Style" or "Layout" entries.
3. `renderer.info.render.calls` — should stay under 50 for a fullscreen-shader app.

## 9. Performance Overlay

```tsx
function PerformanceOverlay({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useFrame((state) => {
    if (!visible || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d')!;
    const info = state.gl.info;

    ctx.clearRect(0, 0, 200, 120);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 200, 120);

    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${state.fps.toFixed(0)}`, 8, 16);
    ctx.fillText(`Draw calls: ${info.render.calls}`, 8, 32);
    ctx.fillText(`Triangles: ${info.render.triangles}`, 8, 48);
    ctx.fillText(`Textures: ${info.memory.textures}`, 8, 64);
    ctx.fillText(`Geometries: ${info.memory.geometries}`, 8, 80);
    ctx.fillText(`GPU: ${gpuTimer.gpuTime?.toFixed(1) ?? '?'} ms`, 8, 96);
  });

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={120}
      style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000 }}
    />
  );
}
```

**Why a 2D canvas overlay**: Rendering debug info via React DOM elements would trigger re-renders. A separate 2D canvas updated via `useFrame` has zero React overhead and zero WebGL interference. The 2D canvas runs on a separate compositor layer.

**Frame time graph**: Keep a circular buffer of last 120 GPU times. Draw as a simple bar chart on the overlay canvas. Color green (<12ms), yellow (12-16ms), red (>16ms).

## Performance Budgets Summary

| Metric | Target | Hard limit |
|--------|--------|-----------|
| Frame time (total) | <14ms | 16.67ms |
| GPU frame time | <12ms | 15ms |
| Draw calls | <10 | 20 |
| Texture memory | <256MB | 512MB |
| JS bundle (gzipped) | <150KB | 250KB |
| Initial load (total) | <300KB | 500KB |
| Time to first render | <1.5s | 3s |
| Shader compile (cold) | Spread across frames | No single frame >50ms |
| React re-renders/sec | 0 during playback | <2 |
