import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/tshirt.glb";

// Pick black/white text so custom text stays readable on any garment color.
function readableTextColor(hex) {
  const c = (hex || "#000000").replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#111111" : "#ffffff";
}

// Measured from tshirt.glb via GLTFLoader:
// Box min (-11.84,41.50,-7.09) max (11.93,66.15,3.55) center (0.04,53.83,-1.77)
// After centering, shirt centered span ~[-11.9,11.9] x [-12.3,12.3] x [-5.3,5.3]
// Sampled front Z at centered y: y=2.2→4.66, y=1→4.74, y=0→4.83, pocket (-3.3,1.45)→4.71
// Back Z at (0,2.6) → -5.09. tf lives in same scaled group as shirt, already centered.
function zoneTransform(zoneId) {
  switch (zoneId) {
    case "POCKET_LEFT":
      return { position: [-3.8, 1.0, 4.95], rotation: [0, 0, 0], size: 4.2 };
    case "BACK_PRINT":
    case "BACK_FULL":
      return { position: [0, 2.0, -5.32], rotation: [0, Math.PI, 0], size: 9 };
    case "CHEST_CENTER":
    default:
      return { position: [0, 1.1, 5.02], rotation: [0, 0, 0], size: 8.5 };
  }
}

const FONT_WEIGHT = {
  "Bebas Neue": "400",
  Anton: "400",
  Oswald: "700",
  Montserrat: "800",
  Impact: "400",
  Georgia: "700",
  Arial: "700",
  "Courier New": "700",
};

function wrapText(ctx, str, x, y, maxWidth, lineHeight) {
  const words = String(str).split(" ");
  let line = "";
  const lines = [];
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  const totalH = lines.length * lineHeight;
  let curY = y - totalH / 2 + lineHeight / 2;
  for (const l of lines) {
    ctx.fillText(l, x, curY);
    curY += lineHeight;
  }
}

function ShirtModel({ color, avatar, text, font, fontSize, zone, printScale }) {
  const { scene } = useGLTF(MODEL_URL);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Center the model at the origin and scale it to fit the view.
  const { center, scale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { center: c, scale: 2.4 / maxDim };
  }, [cloned]);

  // ---- avatar image cache: don't refetch on every text keystroke ----
  const [avatarImg, setAvatarImg] = useState(null);
  useEffect(() => {
    if (!avatar?.imageUrl) {
      setAvatarImg(null);
      return;
    }
    let cancelled = false;
    let objectUrl = null;
    fetch(avatar.imageUrl, { mode: "cors" })
      .then((r) => {
        if (!r.ok) throw new Error("fetch " + r.status);
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          URL.revokeObjectURL(objectUrl);
          setAvatarImg(img);
        };
        img.onerror = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          setAvatarImg(null);
        };
        img.src = objectUrl;
      })
      .catch(() => {
        if (!cancelled) setAvatarImg(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatar?.imageUrl]);

  // ---- avatar texture (transparent, does not block text updates) ----
  const [avatarTex, setAvatarTex] = useState(null);
  useEffect(() => {
    if (!avatarImg) {
      setAvatarTex((prev) => {
        if (prev) prev.dispose?.();
        return null;
      });
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.drawImage(avatarImg, 256, 256, 512, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.flipY = true;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    setAvatarTex((prev) => {
      if (prev && prev !== tex) prev.dispose?.();
      return tex;
    });
  }, [avatarImg]);

  // ---- text texture via CanvasTexture — real system-font support + size slider ----
  // drei/Text with system font names falls back to its bundled font, so font changes never showed.
  // Canvas 2D respects ctx.font and reacts instantly to font / fontSize.
  const [textTex, setTextTex] = useState(null);
  useEffect(() => {
    const hasText = !!(text && String(text).trim().length > 0);
    if (!hasText) {
      setTextTex((prev) => {
        if (prev) prev.dispose?.();
        return null;
      });
      return;
    }
    let cancelled = false;
    const safeFont = font && String(font).trim() ? String(font).trim() : "Bebas Neue";
    const rawSize = Number(fontSize) || 96;
    const px = Math.max(32, Math.min(160, rawSize));
    const wt = FONT_WEIGHT[safeFont] || "700";
    const fill = readableTextColor(color);
    const doDraw = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 1024, 1024);
      ctx.fillStyle = fill;
      ctx.strokeStyle = fill === "#ffffff" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)";
      ctx.lineWidth = Math.max(4, px * 0.065);
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.font = `${wt} ${px}px "${safeFont}", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxW = 900;
    const lineH = px * 1.15;
    const str = String(text);
    const x = 512, y = 512;
    if (ctx.measureText(str).width > maxW) {
      const words = str.split(" ");
      let line = "";
      const lines = [];
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      const totalH = lines.length * lineH;
      let curY = y - totalH / 2 + lineH / 2;
      for (const l of lines) { ctx.strokeText(l, x, curY); ctx.fillText(l, x, curY); curY += lineH; }
    } else {
        ctx.strokeText(str, x, y);
        ctx.fillText(str, x, y);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.flipY = true;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      setTextTex((prev) => {
        if (prev && prev !== tex) prev.dispose?.();
        return tex;
      });
    };
    if (typeof document !== "undefined" && document.fonts && document.fonts.load) {
      document.fonts.load(`${wt} ${px}px "${safeFont}"`).then(doDraw).catch(doDraw);
    } else {
      doDraw();
    }
    return () => { cancelled = true; };
  }, [text, font, fontSize, color]);

  // Apply the solid garment color to the fabric (matte finish) + push it slightly back to avoid z-fight.
  useEffect(() => {
    cloned.traverse((o) => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m.map) m.map = null;
          if (m.color && m.color.set) m.color.set(color);
          if (m.metalness !== undefined) m.metalness = 0.04;
          if (m.roughness !== undefined) m.roughness = 0.82;
          m.polygonOffset = true;
          m.polygonOffsetFactor = 1;
          m.polygonOffsetUnits = 1;
          m.needsUpdate = true;
        });
      }
    });
  }, [color, cloned]);

  const tf = zoneTransform(zone?.id);
  const outward = useMemo(() => {
    const n = tf.position[2] >= 0 ? 0.18 : -0.18;
    return [tf.position[0], tf.position[1], tf.position[2] + n];
  }, [tf]);
  // printScale: DTF size multiplier (0.4..4.0), isolated — only scales decal planes, never garment/camera
  // shirt centred span ~23.8 ( -11.9→11.9 ). CHEST base 8.5 *0.78*3.6≈23.9 = seam-to-seam, 4.0≈26.5 = boxy bleed
  const ps = Math.max(0.4, Math.min(4.0, Number(printScale ?? 1) || 1));
  const hasTextTex = !!textTex;
  const hasAvatar = !!avatarTex;
  const hasText = !!(text && String(text).trim().length > 0);
  // Avatar above, text below — layout in local decal space, stays glued on rotate; scaled by printScale
  const avatarPlane = (hasText ? tf.size * 0.58 : tf.size * 0.78) * ps;
  // text plane size covers the 1024 canvas — shrink it so the glyph size is controlled by px above + size scaling
  const textPlane = tf.size * 0.88 * ps;

  return (
    <group scale={scale} position={[0, 0.1, 0]}>
      <primitive object={cloned} position={[-center.x, -center.y, -center.z]} />
      <group position={outward} rotation={tf.rotation}>
        {hasAvatar && (
          <mesh position={[0, hasTextTex ? tf.size * 0.18 : 0, 0.02]} renderOrder={10}>
            <planeGeometry args={[avatarPlane, avatarPlane]} />
            <meshBasicMaterial
              map={avatarTex}
              transparent
              alphaTest={0.02}
              side={THREE.FrontSide}
              depthWrite={false}
              depthTest
              toneMapped={false}
            />
          </mesh>
        )}
        {hasTextTex && (
          <mesh position={[0, hasAvatar ? -tf.size * 0.28 : 0, 0.06]} renderOrder={11}>
            <planeGeometry args={[textPlane, textPlane]} />
            <meshBasicMaterial
              map={textTex}
              transparent
              alphaTest={0.02}
              side={THREE.FrontSide}
              depthWrite={false}
              depthTest
              toneMapped={false}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

export default function TshirtViewer({ color, avatar, zone, text, font, fontSize = 96, printScale = 1 }) {
  return (
    <div className="relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_28%,#fafafa_0%,#e4e4e7_45%,#a1a1aa_100%)] shadow-[inset_0_0_120px_rgba(0,0,0,.12)]">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} />
        <directionalLight position={[-4, 2, 2]} intensity={0.5} />
        <Suspense fallback={null}>
          <ShirtModel color={color} avatar={avatar} text={text} font={font} fontSize={fontSize} zone={zone} printScale={printScale} />
          <ContactShadows
            position={[0, -0.6, 0]}
            opacity={0.45}
            scale={6}
            blur={2.6}
            far={3}
            color="#000000"
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={3}
          maxDistance={7}
          autoRotate={!avatar && !(text && String(text).trim())}
          autoRotateSpeed={1.2}
        />
      </Canvas>

      <div className="absolute right-4 top-4 rounded-lg border border-black/10 bg-white/55 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-600 backdrop-blur">
        Drag to rotate · scroll to zoom
      </div>
      {zone && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-black/10 bg-white/55 px-4 py-3 backdrop-blur">
          <span className="text-xs text-zinc-600">{zone.label}</span>
        </div>
      )}
    </div>
  );
}

useGLTF.preload(MODEL_URL);