import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  UploadCloud, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Image as ImageIcon, 
  Zap, 
  Layers,
  ChevronLeft, Lock
} from "lucide-react";
import { 
  getEnhancerCache, 
  updateEnhancerCache, 
  setPendingStudioArtwork,
  getUser 
} from "../lib/storage";
import GuestAuthModal from "./GuestAuthModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function DtfEnhancer() {
  const cached = getEnhancerCache();
  const [file, setFile] = useState(cached.file);
  const [enableEnhance, setEnableEnhance] = useState(cached.enableEnhance);
  const [removeBg, setRemoveBg] = useState(cached.removeBg);
  const [isPhoto, setIsPhoto] = useState(cached.isPhoto);
  const [loading, setLoading] = useState(false);
  const [outputUrl, setOutputUrl] = useState(cached.outputUrl);
  const [outputBlob, setOutputBlob] = useState(cached.outputBlob);
  const [outputDataUrl, setOutputDataUrl] = useState(cached.outputDataUrl);
  const [imageStats, setImageStats] = useState(cached.imageStats);
  const [errorMsg, setErrorMsg] = useState("");
  const [isGuestAuthModalOpen, setIsGuestAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  const originalBaseName = (file?.name || cached.fileName || "artwork").replace(/\.[^/.]+$/, "");
  const cleanBaseName = originalBaseName.replace(/[^a-zA-Z0-9_\-\.]/g, "_") || "artwork";
  const downloadFileName = `${cleanBaseName}_dtf_output_300dpi.png`;

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setOutputUrl(null);
    setOutputBlob(null);
    setOutputDataUrl(null);
    setErrorMsg("");

    updateEnhancerCache({
      file: selected,
      fileName: selected.name,
      outputUrl: null,
      outputBlob: null,
      outputDataUrl: null,
    });

    const img = new Image();
    const objectUrl = URL.createObjectURL(selected);
    img.src = objectUrl;
    img.onload = () => {
      const w = (img.naturalWidth / 300).toFixed(1);
      const h = (img.naturalHeight / 300).toFixed(1);
      const isLowRes = img.naturalWidth < 1800 || img.naturalHeight < 1800;

      const stats = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        maxPrintInches: `${w}" × ${h}"`,
        isLowRes: isLowRes,
      };

      setImageStats(stats);
      if (isLowRes) {
        setEnableEnhance(true);
      }

      updateEnhancerCache({
        imageStats: stats,
        enableEnhance: isLowRes ? true : enableEnhance,
      });

      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleToggleEnhance = (val) => {
    setEnableEnhance(val);
    updateEnhancerCache({ enableEnhance: val });
  };

  const handleToggleRemoveBg = (val) => {
    setRemoveBg(val);
    updateEnhancerCache({ removeBg: val });
  };

  const handleTogglePhoto = (val) => {
    setIsPhoto(val);
    updateEnhancerCache({ isPhoto: val });
  };

  const handleSubmit = async () => {
    if (!getUser()) {
      setIsGuestAuthModalOpen(true);
      return;
    }
    if (!file) return;
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("enableEnhance", enableEnhance);
    formData.append("removeBg", removeBg);
    formData.append("isPhoto", isPhoto);

    try {
      const res = await fetch(`${API_BASE}/api/dtf/process`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let msg = "Failed to process image";
        try {
          const errData = await res.json();
          msg = errData.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(objUrl);

      // Read as DataURL for permanent safe retention across routes
      const reader = new FileReader();
      reader.onloadend = () => {
        const dUrl = reader.result;
        setOutputDataUrl(dUrl);
        updateEnhancerCache({
          outputBlob: blob,
          outputUrl: objUrl,
          outputDataUrl: dUrl,
        });
      };
      reader.readAsDataURL(blob);

    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToStudio = () => {
    if (!getUser()) {
      setIsGuestAuthModalOpen(true);
      return;
    }
    if (!outputUrl && !outputBlob && !outputDataUrl) return;

    const w = imageStats ? imageStats.width * (enableEnhance ? 4 : 1) : 1200;
    const h = imageStats ? imageStats.height * (enableEnhance ? 4 : 1) : 1200;

    const proceed = (finalDataUrl) => {
      setPendingStudioArtwork({
        blob: outputBlob,
        url: finalDataUrl || outputUrl,
        dataUrl: finalDataUrl || outputUrl,
        name: downloadFileName,
        originalName: file ? file.name : "artwork.png",
        width: w,
        height: h,
      });
      navigate("/studio");
    };

    if (outputDataUrl) {
      proceed(outputDataUrl);
    } else if (outputBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOutputDataUrl(reader.result);
        updateEnhancerCache({ outputDataUrl: reader.result });
        proceed(reader.result);
      };
      reader.readAsDataURL(outputBlob);
    } else {
      proceed(outputUrl);
    }
  };

  return (
    <div className="mc-container py-10 sm:py-14 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link 
            to="/studio" 
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition mb-3 font-mono"
          >
            <ChevronLeft size={14} /> Back to SHADE Atelier
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-black font-black text-xs">
              01
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              DTF Print Uploader & Enhancer
            </h1>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Real-ESRGAN Vulkan super-resolution engine & 300 DPI physical metadata injection for high-density Tirupur prints.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono text-zinc-300">
          <Zap size={14} className="text-emerald-400" />
          <span>Vulkan NCNN 4×</span>
        </div>
      </div>

      {/* File Drop Area */}
      {!getUser() ? (
        <div className="rounded-2xl border-2 border-dashed border-white/20 bg-zinc-900/40 p-8 sm:p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-white mb-3">
            <Lock size={26} />
          </div>
          <h3 className="text-base font-bold text-white">Atelier Member Sign-In Required</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            AI 4× Super-Resolution, automatic transparent background removal, and 300 DPI high-density rendering are reserved for registered Atelier members.
          </p>
          <button
            type="button"
            onClick={() => setIsGuestAuthModalOpen(true)}
            className="mt-5 px-6 py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition shadow-lg inline-flex items-center gap-2"
          >
            <span>Sign In / Join Atelier</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
      <div className="rounded-2xl border-2 border-dashed border-white/20 bg-zinc-900/40 p-8 sm:p-10 text-center hover:border-white/40 transition">
        <label className="flex flex-col items-center justify-center cursor-pointer group">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition mb-3">
            <UploadCloud size={28} />
          </div>
          <span className="text-sm font-semibold text-white">
            {file ? file.name : "Select or drag Artwork File"}
          </span>
          <span className="text-xs text-zinc-500 mt-1">
            PNG, JPG, or WEBP supported · State preserved across navigation
          </span>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </label>

        {imageStats && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
            <span className="text-zinc-300">
              Dimensions: <strong className="text-white">{imageStats.width} × {imageStats.height} px</strong>
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-zinc-300">
              Sharp Print Size: <strong className="text-white">{imageStats.maxPrintInches} @ 300 DPI</strong>
            </span>
            {imageStats.isLowRes && (
              <div className="w-full mt-2 inline-flex items-center justify-center gap-2 text-amber-400 bg-amber-400/10 border border-amber-400/20 py-2 px-4 rounded-xl text-xs font-sans">
                <AlertTriangle size={15} className="shrink-0" />
                <span>Low resolution detected for physical printing. Enabling AI 4× enhancement is recommended.</span>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Processing Preferences */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6 space-y-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
          Processing Preferences
        </h3>

        {/* Primary Toggle: AI Enhancement */}
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <input
            id="enableEnhance"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded accent-white cursor-pointer"
            checked={enableEnhance}
            onChange={(e) => handleToggleEnhance(e.target.checked)}
          />
          <label htmlFor="enableEnhance" className="cursor-pointer select-none">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                Enhance image quality (4× AI Super-Resolution via Vulkan)
              </span>
              {enableEnhance && (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.2 text-[10px] text-emerald-400 font-mono">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {enableEnhance
                ? "AI upscaling active: reconstructs edges, sharpens text, and cleans artifacts via Real-ESRGAN."
                : "Keep original resolution as-is (faster, no alteration, injects 300 DPI metadata straight through)."}
            </p>
          </label>
        </div>

        {/* Sub-Options */}
        <div className="grid sm:grid-cols-2 gap-4 pl-1 sm:pl-7">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded accent-white cursor-pointer"
              checked={removeBg}
              onChange={(e) => handleToggleRemoveBg(e.target.checked)}
            />
            <div>
              <span className="text-xs font-semibold text-white block">
                Remove Background (Make Transparent)
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">
                Isolates subject graphics via rembg tool
              </span>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 select-none transition ${
              enableEnhance ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40"
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded accent-white cursor-pointer"
              checked={isPhoto}
              disabled={!enableEnhance}
              onChange={(e) => handleTogglePhoto(e.target.checked)}
            />
            <div>
              <span className="text-xs font-semibold text-white block">
                Photo / Rap-Tee Mode
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">
                Uses realesrgan-x4plus (optimized for human portraits & realistic grain)
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action CTA Button */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
            !file || loading
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-white text-black hover:bg-zinc-200 active:scale-[0.98]"
          }`}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>
                {enableEnhance
                  ? "Upscaling via Vulkan Engine (4×)..."
                  : "Preparing 300 DPI Asset..."}
              </span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>
                {enableEnhance
                  ? "Enhance & Generate DTF Print"
                  : "Process As-Is (300 DPI Lossless)"}
              </span>
            </>
          )}
        </button>

        {(outputUrl || outputDataUrl) && (
          <button
            onClick={handleApplyToStudio}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/20 bg-white/5 font-semibold text-xs text-white hover:bg-white/10 transition flex items-center justify-center gap-2"
          >
            <span>Load in SHADE Atelier</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Result Display: Side-by-Side Comparison */}
      {(outputUrl || outputDataUrl) && (
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>DTF Production Result Ready</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Mode: {enableEnhance ? "Enhanced 4× Super-Resolution" : "Original Resolution (300 DPI Tagged)"}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Source */}
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-zinc-400">Source Input</span>
                {imageStats && (
                  <span className="font-mono text-zinc-500">
                    {imageStats.width} × {imageStats.height} px
                  </span>
                )}
              </div>
              <div className="relative aspect-square rounded-xl bg-zinc-950 flex items-center justify-center p-4 overflow-hidden border border-white/5">
                {file && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Source"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Output */}
            <div className="rounded-2xl border border-white/20 bg-[#121215] p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  DTF Print Asset ({enableEnhance ? "Enhanced 4×" : "Original Ratio"})
                </span>
                <span className="font-mono text-emerald-400 font-semibold">300 DPI</span>
              </div>
              <div className="relative aspect-square rounded-xl bg-zinc-950 flex items-center justify-center p-4 overflow-hidden border border-white/5">
                <img
                  src={outputDataUrl || outputUrl}
                  alt="Output"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href={outputUrl || outputDataUrl}
                  download={downloadFileName}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition truncate"
                  title={downloadFileName}
                >
                  <Download size={15} className="shrink-0" />
                  <span className="truncate">Download {downloadFileName}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      <GuestAuthModal 
        isOpen={isGuestAuthModalOpen} 
        onClose={() => setIsGuestAuthModalOpen(false)} 
        title="Atelier Member Required" 
        message="AI 4× Super-Resolution, automatic background removal, and direct loading into SHADE Atelier are exclusive to registered members. Sign in to run AI enhancements."
      />
    </div>
  );
}
