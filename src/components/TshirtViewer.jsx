import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const CLASSIC_MODEL_URL = "/models/tshirt.glb";
const OVERSIZED_MODEL_URL = "/models/Oversized_Tshirt.glb";

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
  OVERSIZED:  { label: "Oversized Streetwear (Boxy / Drop-Shoulder)", widthMul: 1.0, lengthMul: 1.0 },
  HOODIE:     { label: "Fleece Hoodie", widthMul: 1.05, lengthMul: 1.02 },
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

// Calibrated zone transforms for both classic and oversized streetwear 3D models
function zoneTransform(zoneId, isOversized = true, collarDistanceInches = 2.5) {
  // In streetwear printing, 2.5" below collar is standard placement.
  // Each inch difference shifts the 3D model plane along Y.
  const diffInches = (collarDistanceInches - 2.5);

  if (isOversized) {
    const yShift = diffInches * 0.254; // 1 inch = 0.254 units in Oversized_Tshirt.glb
    switch (zoneId) {
      case "POCKET_LEFT":
        return { position: [-1.05, 0.45 - (diffInches * 0.15), 1.14], rotation: [0, 0, 0], size: 1.35 };
      case "CHEST_CENTER":
        return { position: [0, -0.15 - yShift, 1.18], rotation: [0, 0, 0], size: 3.8 };
      case "BACK_PRINT":
      case "BACK_FULL":
      default:
        // Base center at -0.22 puts top of 4.10 high graphic at Y = 1.83 (2.5 inches below Y=2.45 back collar band)
        return { position: [0, -0.22 - yShift, -1.45], rotation: [0, Math.PI, 0], size: 4.1 };
    }
  }

  // Classic regular-fit model (tshirt.glb)
  const yShiftClassic = diffInches * 0.896;
  switch (zoneId) {
    case "POCKET_LEFT":
      return { position: [-3.8, 0.6 - (diffInches * 0.5), 4.95], rotation: [0, 0, 0], size: 4.8 };
    case "CHEST_CENTER":
      return { position: [0, 0.0 - yShiftClassic, 5.02], rotation: [0, 0, 0], size: 13.5 };
    case "BACK_PRINT":
    case "BACK_FULL":
    default:
      return { position: [0, -0.30 - yShiftClassic, -5.32], rotation: [0, Math.PI, 0], size: 14.5 };
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

function ShirtModel({ 
  color, 
  avatar, 
  text, 
  font, 
  fontSize, 
  zone, 
  printScale, 
  size = "M", 
  garmentType = "OVERSIZED",
  collarDistanceInches = 2.5
}) {
  const isOversized = garmentType !== "ROUND_NECK";
  const activeModelUrl = isOversized ? OVERSIZED_MODEL_URL : CLASSIC_MODEL_URL;
  const { scene } = useGLTF(activeModelUrl);
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
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) setAvatarImg(img);
    };
    img.onerror = () => {
      if (!cancelled) setAvatarImg(null);
    };
    img.src = avatar.imageUrl;
    return () => {
      cancelled = true;
    };
  }, [avatar?.imageUrl]);

  // ---- avatar / graphic texture with full end-to-end canvas coverage ----
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

    // Natural aspect ratio preserved, fitting 100% of the canvas end-to-end
    const naturalW = avatarImg.naturalWidth || avatarImg.width || 1024;
    const naturalH = avatarImg.naturalHeight || avatarImg.height || 1024;
    const aspect = naturalW / naturalH;
    let drawW = 1024;
    let drawH = 1024;
    let drawX = 0;
    let drawY = 0;

    if (aspect > 1) {
      // Wider than tall: fit full width (1024), center vertically
      drawH = Math.round(1024 / aspect);
      drawY = Math.round((1024 - drawH) / 2);
    } else {
      // Taller than wide: fit full height (1024), center horizontally
      drawW = Math.round(1024 * aspect);
      drawX = Math.round((1024 - drawW) / 2);
    }

    ctx.drawImage(avatarImg, drawX, drawY, drawW, drawH);
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

  // ---- text texture via CanvasTexture ----
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
    const rawSize = Number(fontSize) || 110;
    const px = Math.max(48, Math.min(180, rawSize));
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

  // Apply the solid garment color to the fabric (matte finish)
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

  const tf = zoneTransform(zone?.id, isOversized, collarDistanceInches);
  const sizeSpec = SIZE_SPECS[size] || SIZE_SPECS.M;
  const garmentProfile = GARMENT_PROFILES[garmentType] || (isOversized ? GARMENT_PROFILES.OVERSIZED : GARMENT_PROFILES.ROUND_NECK);

  const chestWidthFactor = sizeSpec.widthFactor * garmentProfile.widthMul;
  const chestDepthFactor = sizeSpec.depthFactor * garmentProfile.widthMul;
  const lengthFactor = garmentProfile.lengthMul;

  const outwardPos = useMemo(() => {
    const zOffset = isOversized
      ? (tf.position[2] >= 0 ? 0.04 : -0.04)
      : (tf.position[2] >= 0 ? 0.22 : -0.22);
    return [
      tf.position[0] * chestWidthFactor,
      tf.position[1] * lengthFactor,
      tf.position[2] * chestDepthFactor + zOffset
    ];
  }, [tf, chestWidthFactor, lengthFactor, chestDepthFactor, isOversized]);

  // printScale: DTF size multiplier (0.4..4.0), isolated — scales decal planes
  const ps = Math.max(0.4, Math.min(4.0, Number(printScale ?? 1) || 1));
  const hasTextTex = !!textTex;
  const hasAvatar = !!avatarTex;

  // Decal planes scaled to cover full chest box end-to-end
  const avatarPlane = (hasTextTex ? tf.size * 0.72 : tf.size * 1.0) * ps;
  const textPlane = tf.size * 0.95 * ps;

  return (
    <group scale={scale} position={[0, 0.1, 0]}>
      {/* Real-world garment scaling */}
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

function CameraAndControls({ viewMode = "back" }) {
  const { camera } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (!controlsRef.current) return;
    if (viewMode === "front") {
      camera.position.set(0, 0, 4.2);
    } else {
      camera.position.set(0, 0, -4.2);
    }
    camera.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [viewMode, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom
      minDistance={2.5}
      maxDistance={7}
      autoRotate={false}
    />
  );
}

export default function TshirtViewer({
  color,
  avatar,
  zone,
  text,
  font,
  fontSize = 110,
  printScale = 1,
  size = "M",
  garmentType = "ROUND_NECK",
  defaultView = "back",
  collarDistanceInches = 2.5,
  onCollarDistanceChange
}) {
  const sizeSpec = SIZE_SPECS[size] || SIZE_SPECS.M;
  const isOversized = garmentType !== "ROUND_NECK";
  const garmentProfile = GARMENT_PROFILES[garmentType] || (isOversized ? GARMENT_PROFILES.OVERSIZED : GARMENT_PROFILES.ROUND_NECK);
  const isBackZone = zone?.id === "BACK_FULL" || zone?.id === "BACK_PRINT" || !zone?.id;
  const [viewMode, setViewMode] = useState(defaultView || (isBackZone ? "back" : "front"));

  useEffect(() => {
    if (zone?.id === "CHEST_CENTER" || zone?.id === "POCKET_LEFT") {
      setViewMode("front");
    } else if (zone?.id === "BACK_FULL" || zone?.id === "BACK_PRINT") {
      setViewMode("back");
    }
  }, [zone?.id]);

  return (
    <div className="relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f2f2f5_55%,#d8d8de_100%)] shadow-[inset_0_0_80px_rgba(0,0,0,.08)]">
      <Canvas
        camera={{ position: [0, 0, -4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <ambientLight intensity={0.92} />
        <directionalLight position={[3, 5, 4]} intensity={1.15} />
        <directionalLight position={[-4, 2, 2]} intensity={0.45} />
        <directionalLight position={[0, 4, -4]} intensity={1.15} />
        <directionalLight position={[0, 6, 0]} intensity={0.35} />
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
            collarDistanceInches={collarDistanceInches}
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
        <CameraAndControls viewMode={viewMode} />
      </Canvas>

      {/* Top Left: Fit Spec Badge */}
      <div className="absolute left-4 top-4 rounded-lg border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-medium tracking-wide text-zinc-700 backdrop-blur shadow-sm flex items-center gap-1.5 z-10">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Fit: <strong className="font-semibold text-zinc-900">{sizeSpec.label}</strong> ({sizeSpec.chest}″) · {garmentProfile.label}</span>
      </div>

      {/* Top Right: Front / Back View Switcher */}
      <div className="absolute right-4 top-4 flex items-center rounded-xl border border-black/15 bg-white/80 p-0.5 backdrop-blur shadow-sm text-xs font-semibold z-10">
        <button
          type="button"
          onClick={() => setViewMode("back")}
          className={`px-3 py-1 rounded-lg transition ${
            viewMode === "back" ? "bg-black text-white shadow-sm" : "text-zinc-600 hover:text-black"
          }`}
        >
          Back View
        </button>
        <button
          type="button"
          onClick={() => setViewMode("front")}
          className={`px-3 py-1 rounded-lg transition ${
            viewMode === "front" ? "bg-black text-white shadow-sm" : "text-zinc-600 hover:text-black"
          }`}
        >
          Front View
        </button>
      </div>

      {/* On-Screen Graphic Vertical Position Nudge Pill */}
      {avatar && onCollarDistanceChange && (
        <div className="absolute left-4 bottom-4 flex items-center gap-2 rounded-xl border border-black/15 bg-white/90 px-3 py-1.5 backdrop-blur shadow-md z-10">
          <span className="text-[10px] font-bold text-zinc-900 tracking-wider font-mono">
            COLLAR: {(collarDistanceInches ?? 2.5).toFixed(1)}″
          </span>
          <div className="h-3.5 w-px bg-black/15" />
          <button
            type="button"
            title="Move Graphic Up (Closer to collar)"
            onClick={() => onCollarDistanceChange(Math.max(1.5, Math.round(((collarDistanceInches ?? 2.5) - 0.25) * 100) / 100))}
            className="grid h-5 w-5 place-items-center rounded bg-black/5 hover:bg-black hover:text-white text-zinc-800 text-[11px] font-bold transition shadow-xs"
          >
            ▲
          </button>
          <button
            type="button"
            title="Move Graphic Down (Further from collar)"
            onClick={() => onCollarDistanceChange(Math.min(5.5, Math.round(((collarDistanceInches ?? 2.5) + 0.25) * 100) / 100))}
            className="grid h-5 w-5 place-items-center rounded bg-black/5 hover:bg-black hover:text-white text-zinc-800 text-[11px] font-bold transition shadow-xs"
          >
            ▼
          </button>
        </div>
      )}

      {/* Subtle Hint */}
      <div className="absolute bottom-4 right-4 rounded-lg border border-black/10 bg-white/60 px-2.5 py-1 text-[9px] uppercase tracking-wider text-zinc-600 backdrop-blur pointer-events-none">
        Drag to rotate 360°
      </div>
    </div>
  );
}

useGLTF.preload(OVERSIZED_MODEL_URL);
useGLTF.preload(CLASSIC_MODEL_URL);