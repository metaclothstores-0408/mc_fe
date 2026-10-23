import React, { useState } from "react";
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
  ChevronLeft
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function DtfEnhancer() {
  const [file, setFile] = useState(null);
  const [enableEnhance, setEnableEnhance] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [isPhoto, setIsPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const [imageStats, setImageStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setOutputUrl(null);
    setOutputBlob(null);
    setErrorMsg("");

    const img = new Image();
    const objectUrl = URL.createObjectURL(selected);
    img.src = objectUrl;
    img.onload = () => {
      const w = (img.naturalWidth / 300).toFixed(1);
      const h = (img.naturalHeight / 300).toFixed(1);
      const isLowRes = img.naturalWidth < 1800 || img.naturalHeight < 1800;

      setImageStats({
        width: img.naturalWidth,
        height: img.naturalHeight,
        maxPrintInches: `${w}" × ${h}"`,
        isLowRes: isLowRes,
      });

      // Auto-suggest enabling enhancement if image is too small for a full print
      if (isLowRes) {
        setEnableEnhance(true);
      }
      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleSubmit = async () => {
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
      setOutputBlob(blob);
      setOutputUrl(URL.createObjectURL(blob));
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToStudio = () => {
    if (!outputUrl) return;
    // Store in session storage so Studio.jsx can pick it up if redirected
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        sessionStorage.setItem("shade_custom_artwork_data", reader.result);
        navigate("/studio");
      } catch (e) {
        console.warn("Could not save to session storage, opening studio directly:", e);
        navigate("/studio");
      }
    };
    if (outputBlob) {
      reader.readAsDataURL(outputBlob);
    } else {
      navigate("/studio");
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
      <div className="rounded-2xl border-2 border-dashed border-white/20 bg-zinc-900/40 p-8 sm:p-10 text-center hover:border-white/40 transition">
        <label className="flex flex-col items-center justify-center cursor-pointer group">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition mb-3">
            <UploadCloud size={28} />
          </div>
          <span className="text-sm font-semibold text-white">
            {file ? file.name : "Select or drag Artwork File"}
          </span>
          <span className="text-xs text-zinc-500 mt-1">
            PNG, JPG, or WEBP supported
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
            onChange={(e) => setEnableEnhance(e.target.checked)}
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
              onChange={(e) => setRemoveBg(e.target.checked)}
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
              onChange={(e) => setIsPhoto(e.target.checked)}
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

        {outputUrl && (
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
      {outputUrl && (
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
                <img
                  src={URL.createObjectURL(file)}
                  alt="Source"
                  className="max-h-full max-w-full object-contain"
                />
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
                  src={outputUrl}
                  alt="Output"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href={outputUrl}
                  download="print_ready_dtf_300dpi.png"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition"
                >
                  <Download size={15} />
                  <span>Download Print-Ready PNG (300 DPI)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
