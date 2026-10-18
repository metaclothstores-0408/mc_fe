import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, Loader2, Sliders, UploadCloud, X } from "lucide-react";
import { SHEET_PRESETS, computePrintWidthInches, hexToHue, hueToHex, validateHex } from "../lib/dtfProcessor";
import { api } from "../lib/api";

export default function DtfPrintPanel(p) {
  const hue = useMemo(() => hexToHue(p.value.stripColorHex || "#ffffff"), [p.value.stripColorHex]);
  const valid = validateHex(p.value.stripColorHex);
  const upd = (o) => p.onChange(Object.assign({}, p.value, o));
  const scale = p.value.printScale ?? 1;
  const sheetId = p.value.selectedSheetPreset || "A3";
  const sheet = SHEET_PRESETS[sheetId] || SHEET_PRESETS.A3;
  const wIn = computePrintWidthInches(sheetId, scale);

  // Collapsible quality settings — HIDDEN BY DEFAULT per user request
  const [isExpanded, setIsExpanded] = useState(false);

  // Download state
  const [downloading, setDownloading] = useState(false);
  const [downErr, setDownErr] = useState("");

  async function handleDownload() {
    if (!p.hasSource) { setDownErr("Upload an image first."); return; }
    const maybeBlob = String(p.rawSourceUrl || "");
    if (maybeBlob.startsWith("blob:") && !p.uploadedDataUrl && !p.previewDataUrl) {
      setDownErr("Please re-upload the file to generate high-resolution PNG.");
      return;
    }
    setDownErr(""); setDownloading(true);
    try {
      const srcCandidate = p.rawSourceUrl || p.uploadedDataUrl || p.previewDataUrl || p.previewUrl || null;
      const effectiveSource = (srcCandidate && String(srcCandidate).startsWith("blob:")) 
        ? (p.uploadedDataUrl || p.previewDataUrl || p.previewUrl || srcCandidate) 
        : srcCandidate;
      const payload = {
        original_asset_url: effectiveSource,
        dtf_print_parameters: {
          selected_sheet_preset: sheetId,
          print_width_inches: wIn,
          strip_color_hex: p.value.stripColorHex,
          strip_sensitivity: p.value.stripSensitivity,
          halftone_density: p.value.halftoneDensity,
          print_scale: scale,
          sheet_width_inches: sheet.widthInches,
          sheet_height_inches: sheet.heightInches,
          preview_data_url: p.previewDataUrl || p.previewUrl || null,
          original_asset_url: p.uploadedDataUrl || p.rawSourceUrl || null
        }
      };
      const blob = await api.downloadDtfPng(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; 
      a.download = "B_AND_D_PRINT_READY_DTF.png";
      document.body.appendChild(a); 
      a.click(); 
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) { 
      setDownErr(e.message || "Download failed"); 
    } finally { 
      setDownloading(false); 
    }
  }

  return (
    <section className="mc-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-[10px] font-bold text-white">DTF</span>
          <div>
            <h2 className="text-sm font-semibold leading-none text-white">Custom Graphic Upload</h2>
            <p className="mt-1 text-[11px] text-zinc-500">Center chest DTF transfer · Tirupur press</p>
          </div>
        </div>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
          300 DPI LOSSLESS
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* Upload State / Dropzone */}
        {!p.uploadedUrl ? (
          <label className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center cursor-pointer hover:border-white/40 hover:bg-white/[0.04] transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition mb-2">
              <UploadCloud size={20} />
            </div>
            <span className="text-xs font-semibold text-white">Upload Your Artwork or Brand Logo</span>
            <span className="text-[11px] text-zinc-500 mt-1">PNG, JPG, or WEBP · Automatic transparent background knockout</span>
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              className="hidden" 
              onChange={e => {
                const f = e.target.files && e.target.files[0];
                if (f) p.onUpload(f);
                e.target.value = "";
              }} 
            />
          </label>
        ) : (
          <div className="rounded-xl border border-white/15 bg-white/[0.03] p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 shrink-0 rounded-lg border border-white/10 bg-zinc-900 overflow-hidden flex items-center justify-center"
                   style={{ backgroundImage: "conic-gradient(#27272a 25%,transparent 0 50%,#27272a 0 75%,transparent 0)", backgroundSize: "8px 8px" }}>
                <img src={p.previewUrl || p.uploadedUrl} alt="uploaded" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate max-w-[170px]">
                  {p.sourceLabel || "custom_graphic.png"}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Mapped to Chest DTF (A3)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs font-medium text-zinc-300 hover:text-white underline decoration-white/20 underline-offset-4">
                Replace
                <input 
                  type="file" 
                  accept="image/png,image/jpeg,image/webp" 
                  className="hidden" 
                  onChange={e => {
                    const f = e.target.files && e.target.files[0];
                    if (f) p.onUpload(f);
                    e.target.value = "";
                  }} 
                />
              </label>
              <button 
                type="button" 
                onClick={p.onClearUpload} 
                aria-label="Remove uploaded image" 
                className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Fine-Tuning Controls (CLOSED BY DEFAULT) */}
        {p.hasSource && (
          <div className="rounded-xl border border-white/10 overflow-hidden bg-black/30">
            <button
              type="button"
              onClick={() => setIsExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition"
            >
              <span className="flex items-center gap-2">
                <Sliders size={14} className="text-zinc-400" />
                <span>Advanced Print Quality Controls</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                {isExpanded ? <>Collapse <ChevronUp size={14}/></> : <>Expand <ChevronDown size={14}/></>}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-white/10 bg-[#101014] p-4 space-y-4">
                {/* Sheet Size */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Transfer Sheet Size</label>
                  <select 
                    value={sheetId} 
                    onChange={e => upd({ selectedSheetPreset: e.target.value })} 
                    className="mc-input w-full"
                  >
                    <option value="A3">A3 Sheet (11.7″ × 16.5″) — High-Impact Chest Statement</option>
                    <option value="A4">A4 Sheet (8.3″ × 11.7″) — Subtle Standard Print</option>
                  </select>
                </div>

                {/* Remove Background Color */}
                <div>
                  <div className="mb-1.5 flex justify-between text-xs font-semibold text-zinc-300">
                    <span>Background Knockout Color</span>
                    <span className="font-mono text-zinc-400">{valid ? p.value.stripColorHex : "#ffffff"}</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button 
                      type="button" 
                      onClick={() => upd({ stripColorHex: "#ffffff" })} 
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${p.value.stripColorHex === "#ffffff" ? "border-white bg-white/15 text-white" : "border-white/10 text-zinc-400"}`}
                    >
                      White (#FFF)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => upd({ stripColorHex: "#000000" })} 
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${p.value.stripColorHex === "#000000" ? "border-white bg-white/15 text-white" : "border-white/10 text-zinc-400"}`}
                    >
                      Black (#000)
                    </button>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={360} 
                    value={hue} 
                    onChange={e => upd({ stripColorHex: hueToHex(Number(e.target.value)) })} 
                    className="h-2 w-full appearance-none rounded-full cursor-pointer" 
                    style={{ background: "linear-gradient(90deg,#ff0000 0%,#ffff00 17%,#00ff00 33%,#00ffff 50%,#0000ff 67%,#ff00ff 83%,#ff0000 100%)" }} 
                  />
                </div>

                {/* Knockout Sensitivity */}
                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-zinc-300">
                    <span>Knockout Sensitivity</span>
                    <span className="font-mono text-zinc-400">{p.value.stripSensitivity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    step={1} 
                    value={p.value.stripSensitivity} 
                    onChange={e => upd({ stripSensitivity: Number(e.target.value) })} 
                    className="h-1 w-full appearance-none rounded-full bg-white/10 accent-white" 
                  />
                </div>

                {/* Halftone / Softness */}
                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-zinc-300">
                    <span>Vintage Halftone Softness</span>
                    <span className="font-mono text-zinc-400">{p.value.halftoneDensity === 0 ? "Crisp (0%)" : `${p.value.halftoneDensity}%`}</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    step={1} 
                    value={p.value.halftoneDensity} 
                    onChange={e => upd({ halftoneDensity: Number(e.target.value) })} 
                    className="h-1 w-full appearance-none rounded-full bg-white/10 accent-white" 
                  />
                </div>

                {/* Download Button */}
                <div className="pt-2 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={handleDownload} 
                    disabled={downloading} 
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition disabled:opacity-50"
                  >
                    {downloading ? (
                      <><Loader2 size={15} className="animate-spin" /> Generating 300 DPI PNG…</>
                    ) : (
                      <><Download size={15} /> Download Production DTF (300 DPI)</>
                    )}
                  </button>
                  {downErr && <p className="mt-2 text-[11px] text-red-400">{downErr}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
