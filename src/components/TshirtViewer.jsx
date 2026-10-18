import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/tshirt.glb";

// Indian/Tirupur cotton chest specifications (in inches):
// S: 38" chest | M: 40" chest | L: 42" chest | XL: 44" chest | XXL: 46" chest
export const SIZE_SPECS = {
  S:   { label: "S", chest: 38, widthFactor: 0.93, depthFactor: 0.94 },
  M:   { label: "M", chest: 40, widthFactor: 1.00, depthFactor: 1.00 },
  L:   { label: "L", chest: 42, widthFactor: 1.07, depthFactor: 1.04 },
  XL:  { label: "XL", chest: 44, widthFactor: 1.14, depthFactor: 1.08 },
  XXL: { label: "XXL", chest: 46, widthFactor: 1.21, depthFactor: 1.12 }
};

export const GARMENT_PROFILES = {
  ROUND_NECK: { label: "Classic Round Neck", widthMul: 1.0, lengthMul: 1.0 },
  OVERSIZED:  { label: "Oversized Streetwear (Boxy / Drop-Shoulder)", widthMul: 1.14, lengthMul: 1.03 },
  HOODIE:     { label: "Fleece Hoodie", widthMul: 1.10, lengthMul: 1.04 },
  ACID_WASH:  { label: "Acid Wash Vintage", widthMul: 1.0, lengthMul: 1.0 },
  SPORTS:     { label: "Sports Jersey", widthMul: 0.98, lengthMul: 1.0 }
};

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

function ShirtModel({ color, avatar, text, font, fontSize, zone, printScale, size = "M", garmentType = "ROUND_NECK" }) {
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
  const sizeSpec = SIZE_SPECS[size] || SIZE_SPECS.M;
  const garmentProfile = GARMENT_PROFILES[garmentType] || GARMENT_PROFILES.ROUND_NECK;

  const chestWidthFactor = sizeSpec.widthFactor * garmentProfile.widthMul;
  const chestDepthFactor = sizeSpec.depthFactor * garmentProfile.widthMul;
  const lengthFactor = garmentProfile.lengthMul;

  const outwardPos = useMemo(() => {
    const zOffset = tf.position[2] >= 0 ? 0.22 : -0.22;
    return [
      tf.position[0] * chestWidthFactor,
      tf.position[1] * lengthFactor,
      tf.position[2] * chestDepthFactor + zOffset
    ];
  }, [tf, chestWidthFactor, lengthFactor, chestDepthFactor]);

  // printScale: DTF size multiplier (0.4..4.0), isolated — only scales decal planes, never garment/camera
  const ps = Math.max(0.4, Math.min(4.0, Number(printScale ?? 1) || 1));
  const hasTextTex = !!textTex;
  const hasAvatar = !!avatarTex;
  const hasText = !!(text && String(text).trim().length > 0);
  // Avatar above, text below — scaled by DTF print scale; physical decal size relative to garment
  const avatarPlane = (hasText ? tf.size * 0.58 : tf.size * 0.78) * ps;
  // text plane size covers the 1024 canvas — shrink it so the glyph size is controlled by px above + size scaling
  const textPlane = tf.size * 0.88 * ps;

  return (
    <group scale={scale} position={[0, 0.1, 0]}>
      {/* Real-world garment scaling: S=38" to XXL=46", plus oversized drop-shoulder / hoodie silhouette */}
      <group scale={[chestWidthFactor, lengthFactor, chestDepthFactor]}>
        <primitive object={cloned} position={[-center.x, -center.y, -center.z]} />
      </group>
      <group position={outwardPos} rotation={tf.rotation}>
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

export default function TshirtViewer({ color, avatar, zone, text, font, fontSize = 96, printScale = 1, size = "M", garmentType = "ROUND_NECK" }) {
  const sizeSpec = SIZE_SPECS[size] || SIZE_SPECS.M;
  const garmentProfile = GARMENT_PROFILES[garmentType] || GARMENT_PROFILES.ROUND_NECK;

  return (
    <div className="relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f2f2f5_55%,#d8d8de_100%)] shadow-[inset_0_0_80px_rgba(0,0,0,.08)]">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.15} />
        <directionalLight position={[-4, 2, 2]} intensity={0.45} />
        <Suspense fallback={null}>
          <ShirtModel
            color={color}
            avatar={avatar}
            text={text}
            font={font}
            fontSize={fontSize}
            zone={zone}
            printScale={printScale}
            size={size}
            garmentType={garmentType}
          />
          {/* Floor shadow lowered to -1.25 to prevent waist/hem intersection reflection */}
          <ContactShadows
            position={[0, -1.25, 0]}
            opacity={0.38}
            scale={5.5}
            blur={2.4}
            far={2.5}
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

      <div className="absolute left-4 top-4 rounded-lg border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-medium tracking-wide text-zinc-700 backdrop-blur shadow-sm flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Fit: <strong className="font-semibold text-zinc-900">{sizeSpec.label}</strong> ({sizeSpec.chest}″) · {garmentProfile.label}</span>
      </div>

      <div className="absolute right-4 top-4 rounded-lg border border-black/10 bg-white/60 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-600 backdrop-blur">
        Drag to rotate · scroll to zoom
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);