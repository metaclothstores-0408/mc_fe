import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, RotateCcw, ShoppingBag, Sparkles, X } from "lucide-react";
import DtfPrintPanel from "../components/DtfPrintPanel";
import { colors, curatedDrops, garmentOptions, sizes, zones } from "../data/mock";
import { money } from "../lib/storage";
import { computePrintWidthInches, getSheetPreset, processDtfImage } from "../lib/dtfProcessor";

const TshirtViewer = lazy(() => import("../components/TshirtViewer"));

export default function Studio({ addToCart, notify }) {
  // 1. Garment and Shade
  const [garment, setGarment] = useState(garmentOptions[0]); // Oversized Boxy Tee
  const [color, setColor] = useState(colors[0]); // Noir Black
  const [size, setSize] = useState("L"); // Default size
  const [zone, setZone] = useState(zones[0]); // Chest Center

  // 2. Artwork State: Mode can be "drops" or "upload"
  // Default to null so user starts with a pure clean blank garment without forced VOID drop
  const [artMode, setArtMode] = useState("drops");
  const [selectedDrop, setSelectedDrop] = useState(null);

  // DTF Upload State
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState(null);
  const uploadedObjectUrlRef = useRef(null);
  const [dtf, setDtf] = useState({
    selectedSheetPreset: "A3",
    stripColorHex: "#ffffff",
    stripSensitivity: 30,
    halftoneDensity: 0,
    printScale: 1
  });
  const [processedUrl, setProcessedUrl] = useState(null);

  // Quick-Size Drawer State
  const [isSizeDrawerOpen, setIsSizeDrawerOpen] = useState(false);

  // Check if any graphic is active
  const hasArt = (artMode === "upload" && !!uploadedUrl) || (artMode === "drops" && !!selectedDrop);
  const printSurcharge = hasArt ? 199 : 0;
  const total = garment.price + printSurcharge;

  // Real-time DTF image processing with debouncing
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!uploadedUrl) { setProcessedUrl(null); return; }
    clearTimeout(debounceRef.current);
    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      try {
        const out = await processDtfImage(uploadedUrl, {
          stripColorHex: dtf.stripColorHex,
          stripSensitivity: dtf.stripSensitivity,
          halftoneDensity: dtf.halftoneDensity
        });
        if (!cancelled) setProcessedUrl(out || uploadedUrl);
      } catch {
        if (!cancelled) setProcessedUrl(uploadedUrl);
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [uploadedUrl, dtf.stripColorHex, dtf.stripSensitivity, dtf.halftoneDensity]);

  const handleUpload = (file) => {
    if (!file) return;
    if (uploadedObjectUrlRef.current) URL.revokeObjectURL(uploadedObjectUrlRef.current);
    const url = URL.createObjectURL(file);
    uploadedObjectUrlRef.current = url;
    setUploadedUrl(url);
    setSelectedDrop(null);
    setArtMode("upload");

    const reader = new FileReader();
    reader.onload = () => setUploadedDataUrl(reader.result);
    reader.onerror = () => setUploadedDataUrl(null);
    reader.readAsDataURL(file);
  };

  const clearUpload = () => {
    if (uploadedObjectUrlRef.current) {
      URL.revokeObjectURL(uploadedObjectUrlRef.current);
      uploadedObjectUrlRef.current = null;
    }
    setUploadedUrl(null);
    setUploadedDataUrl(null);
    setProcessedUrl(null);
    setArtMode("drops");
  };

  useEffect(() => () => {
    if (uploadedObjectUrlRef.current) URL.revokeObjectURL(uploadedObjectUrlRef.current);
  }, []);

  const dtfSheetVisualScale = (dtf.printScale ?? 1) * (dtf.selectedSheetPreset === "A4" ? 0.72 : 1.0);

  // Avatar/Image feed for 3D Viewer
  const viewerAvatar = (() => {
    if (artMode === "upload" && uploadedUrl) {
      return { id: "uploaded", title: "Custom Artwork", category: "Upload", imageUrl: processedUrl || uploadedUrl };
    }
    return null;
  })();

  // Text mark for Curated Drops (displayed cleanly on chest center)
  const viewerText = artMode === "drops" && selectedDrop ? selectedDrop.textMark : "";
  const viewerFont = "Bebas Neue";

  // Toggle drop selection: clicking already selected drop deselects it (returns to clean blank)
  const handleSelectDrop = (drop) => {
    if (selectedDrop?.id === drop.id) {
      setSelectedDrop(null);
    } else {
      setSelectedDrop(drop);
      setArtMode("drops");
      clearUpload();
    }
  };

  const handleOpenAdd = () => {
    setIsSizeDrawerOpen(true);
  };

  const handleConfirmAddToCart = (chosenSize) => {
    const finalSize = chosenSize || size;
    setSize(finalSize);

    const sheet = getSheetPreset(dtf.selectedSheetPreset);
    const printWidthInches = computePrintWidthInches(dtf.selectedSheetPreset, dtf.printScale ?? 1);

    const isCustomUpload = artMode === "upload" && !!uploadedUrl;
    const dtf_print_parameters = isCustomUpload ? {
      selected_sheet_preset: dtf.selectedSheetPreset,
      print_width_inches: printWidthInches,
      strip_color_hex: dtf.stripColorHex,
      strip_sensitivity: dtf.stripSensitivity,
      halftone_density: dtf.halftoneDensity,
      print_scale: dtf.printScale ?? 1,
      sheet_width_inches: sheet.widthInches,
      sheet_height_inches: sheet.heightInches,
      source_type: "upload",
      original_asset_url: uploadedDataUrl || uploadedUrl,
      preview_data_url: processedUrl || uploadedDataUrl || uploadedUrl
    } : null;

    addToCart({
      id: `bd-${Date.now()}`,
      productId: null,
      name: `B&D ${garment.label}${hasArt ? "" : " (Clean Blank)"}`,
      price: total,
      quantity: 1,
      size: finalSize,
      color: color.name,
      garmentType: garment.type,
      zone: zone.id,
      avatarId: null,
      avatarTitle: isCustomUpload ? "Custom Artwork" : (selectedDrop?.title || "Clean Blank"),
      image: isCustomUpload ? (processedUrl || uploadedUrl) : null,
      customText: isCustomUpload ? "" : viewerText,
      customFont: viewerFont,
      custom: hasArt,
      printSurcharge,
      dtf_print_parameters
    });

    setIsSizeDrawerOpen(false);
    notify(`Added to bag: B&D ${garment.label} (${color.name} · Size ${finalSize})`);
  };

  const reset = () => {
    setGarment(garmentOptions[0]);
    setColor(colors[0]);
    setSize("L");
    setZone(zones[0]);
    setSelectedDrop(null);
    clearUpload();
    setDtf({ selectedSheetPreset: "A3", stripColorHex: "#ffffff", stripSensitivity: 30, halftoneDensity: 0, printScale: 1 });
  };

  return (
    <div className="mc-container py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
          B&D Atelier · Tirupur Cotton
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl text-white">
          Form Follows Shade.
        </h1>
        <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-6 text-zinc-400">
          Heavyweight monochrome blanks engineered for young adults. Pure black & white shades with zero dead stock.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.35fr_380px]">
        {/* Left: 3D Garment Atelier Viewport */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d10] p-3 shadow-2xl">
            <Suspense fallback={
              <div className="grid aspect-[4/5] place-items-center rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f2f2f5_55%,#d8d8de_100%)] text-xs text-zinc-500 font-mono">
                Loading B&D 3D Atelier…
              </div>
            }>
              <TshirtViewer
                color={color.hex}
                avatar={viewerAvatar}
                zone={zone}
                text={viewerText}
                font={viewerFont}
                fontSize={120}
                printScale={dtfSheetVisualScale}
                size={size}
                garmentType={garment.type}
              />
            </Suspense>

            {/* Bottom info bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-black/10 bg-white/70 px-4 py-3 backdrop-blur shadow-sm">
              <span className="text-xs font-medium text-zinc-800">
                {garment.label} · {color.name} {!hasArt && "· Clean Blank"}
              </span>
              <span className="text-xs font-bold text-zinc-950 font-mono">
                {money(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Clean 2-Step Configuration Column */}
        <div className="space-y-5">
          
          {/* Step 1: Silhouette Cut */}
          <section className="mc-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-[10px] font-bold text-white">01</span>
                <h2 className="text-sm font-semibold text-white">Garment Silhouette</h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">{garment.gsm}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {garmentOptions.map(g => (
                <button
                  key={g.type}
                  onClick={() => setGarment(g)}
                  className={`rounded-xl border p-3 text-left transition ${
                    garment.type === g.type
                      ? "border-white bg-white/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{g.label}</span>
                    <span className="text-xs font-mono font-semibold">{money(g.price)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{g.description}</span>
                    <span className="font-mono text-zinc-400">{g.gsm}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Monochrome Shade */}
          <section className="mc-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-[10px] font-bold text-white">02</span>
                <h2 className="text-sm font-semibold text-white">Shade Selection</h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">Ready Stock Tirupur</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {colors.map(c => (
                <button
                  key={c.name}
                  onClick={() => setColor(c)}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                    color.name === c.name
                      ? "border-white bg-white/10 ring-1 ring-white/30"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-white/20 shadow-inner shrink-0"
                    style={{ background: c.hex }}
                  />
                  <div className="text-left min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{c.gsm}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Step 3: Artwork — Curated Drops vs Custom Upload */}
          <section className="mc-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-[10px] font-bold text-white">03</span>
                <h2 className="text-sm font-semibold text-white">Artwork & Graphic</h2>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {hasArt ? "+₹199 DTF Print" : "Plain (No Print)"}
              </span>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-black border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setArtMode("drops")}
                className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                  artMode === "drops" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Curated Drops
              </button>
              <button
                type="button"
                onClick={() => setArtMode("upload")}
                className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                  artMode === "upload" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Upload Artwork
              </button>
            </div>

            {/* Curated Drops Selector with Deselect / Clean Blank Option */}
            {artMode === "drops" && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {/* Clean Blank Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedDrop(null)}
                    className={`rounded-xl border p-2 text-center transition ${
                      !selectedDrop
                        ? "border-white bg-white/20 text-white ring-1 ring-white/40 shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="text-[11px] font-bold">Blank</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5 font-mono">No Print</div>
                  </button>

                  {/* Drop Cards */}
                  {curatedDrops.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSelectDrop(d)}
                      className={`rounded-xl border p-2 text-center transition ${
                        selectedDrop?.id === d.id
                          ? "border-white bg-white/20 text-white ring-1 ring-white/40 shadow-sm"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">{d.textMark}</div>
                      <div className="text-[9px] text-zinc-400 mt-0.5 truncate font-mono">{d.title.split(" ")[0]}</div>
                    </button>
                  ))}
                </div>

                {/* Active drop cancel / reset pill */}
                {selectedDrop && (
                  <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-xs">
                    <span className="text-zinc-300 font-medium">
                      Active: <strong className="text-white">{selectedDrop.title}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDrop(null)}
                      className="text-xs text-zinc-400 hover:text-white underline decoration-white/20 underline-offset-4 flex items-center gap-1"
                    >
                      <X size={13} /> Clear / Plain Tee
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Custom Upload Panel with Hidden-by-Default Controls */}
            {artMode === "upload" && (
              <DtfPrintPanel
                value={dtf}
                onChange={setDtf}
                hasSource={!!uploadedUrl}
                previewUrl={processedUrl}
                rawSourceUrl={uploadedDataUrl || uploadedUrl}
                sourceLabel="Uploaded graphic"
                onUpload={handleUpload}
                onClearUpload={clearUpload}
                uploadedUrl={uploadedUrl}
                previewDataUrl={processedUrl}
                uploadedDataUrl={uploadedDataUrl}
              />
            )}
          </section>

          {/* Pricing & Add to Bag */}
          <div className="mc-card p-5">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{garment.label} ({color.name})</span>
              <span>{money(garment.price)}</span>
            </div>
            {hasArt ? (
              <div className="mt-2 flex justify-between text-xs text-zinc-400">
                <span>DTF Chest Transfer ({selectedDrop ? selectedDrop.title : "Custom Upload"})</span>
                <span>{money(printSurcharge)}</span>
              </div>
            ) : (
              <div className="mt-2 flex justify-between text-xs text-emerald-400/90 font-mono">
                <span>Plain Blank Garment</span>
                <span>₹0 print cost</span>
              </div>
            )}
            <div className="my-3.5 border-t border-white/10" />
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-white">Total</span>
              <span className="text-xl font-black text-white font-mono">{money(total)}</span>
            </div>

            {/* Add to Bag Button: Triggers Quick-Size Drawer */}
            <button
              onClick={handleOpenAdd}
              className="mc-btn-primary mt-4 w-full flex items-center justify-center gap-2"
            >
              <ShoppingBag size={17} />
              <span>Add to Bag — Select Fit</span>
            </button>

            <button
              onClick={reset}
              className="mc-btn-ghost mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-zinc-500"
            >
              <RotateCcw size={14} />
              <span>Reset Configuration</span>
            </button>
          </div>

        </div>
      </div>

      {/* Slide-Up Quick-Size Drawer (Zero Friction Size Selection) */}
      {isSizeDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/20 bg-[#0e0e12] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Select Your Size</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Relaxed boxy cut · Sized to authentic Tirupur cotton measurements.
                </p>
              </div>
              <button
                onClick={() => setIsSizeDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Size Options Grid */}
            <div className="grid grid-cols-5 gap-2 my-5">
              {[
                { s: "S", chest: 38 },
                { s: "M", chest: 40 },
                { s: "L", chest: 42 },
                { s: "XL", chest: 44 },
                { s: "XXL", chest: 46 }
              ].map(item => (
                <button
                  key={item.s}
                  onClick={() => handleConfirmAddToCart(item.s)}
                  className={`rounded-2xl border py-3.5 text-center transition ${
                    size === item.s
                      ? "border-white bg-white/20 ring-2 ring-white/40"
                      : "border-white/15 bg-white/5 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  <div className="text-sm font-bold text-white">{item.s}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.chest}″</div>
                </button>
              ))}
            </div>

            {/* Fit guidance box */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-zinc-400 flex items-center gap-3">
              <span className="text-base">📏</span>
              <span>
                Drop-shoulder boxy drape. Pick your regular size for an authentic streetwear fit, or size down for standard cut.
              </span>
            </div>

            <p className="text-center text-[10px] text-zinc-500 mt-4 font-mono">
              Clicking a size instantly adds your {hasArt ? "custom piece" : "blank tee"} to the bag.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
