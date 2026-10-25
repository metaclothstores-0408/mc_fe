import { lazy, Suspense, useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  X,
  Sliders,
  Crop,
  Scale
} from "lucide-react";
import DtfPrintPanel from "../components/DtfPrintPanel";
import ImageCropModal from "../components/ImageCropModal";
import DtfCollectionsModal from "../components/DtfCollectionsModal";
import SaveToGroupModal from "../components/SaveToGroupModal";
import { colors, curatedDrops, garmentOptions, sizes, zones } from "../data/mock";
import {
  money,
  getSessionId,
  getDtfCollections,
  saveDtfCollectionItem,
  deleteDtfCollectionItem,
  getDtfGroups,
  saveDtfGroup,
  getPendingStudioArtwork,
  clearPendingStudioArtwork,
  getActiveStudioArtwork,
  setActiveStudioArtwork,
  updateActiveStudioArtwork,
  createThumbnailDataUrl
} from "../lib/storage";
import { computePrintWidthInches, getSheetPreset, processDtfImage } from "../lib/dtfProcessor";
import { api } from "../lib/api";

const TshirtViewer = lazy(() => import("../components/TshirtViewer"));

export default function Studio({ addToCart, notify }) {
  // 1. Garment and Shade State
  const [garment, setGarment] = useState(garmentOptions[0]); // Oversized Boxy Tee
  const [color, setColor] = useState(colors[0]); // Noir Black
  const [size, setSize] = useState("L"); // Default size
  const [zone, setZone] = useState(zones[0]); // Chest Center

  // Collapsible Accordions: CLOSED BY DEFAULT per user request
  const [isSilhouetteOpen, setIsSilhouetteOpen] = useState(false);
  const [isShadeOpen, setIsShadeOpen] = useState(false);

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
    printScale: 1,
    collarDistanceInches: 2.5
  });
  const [processedUrl, setProcessedUrl] = useState(null);

  // Crop Modal State & Raw File Tracking
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSettings, setCropSettings] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [cropSourceData, setCropSourceData] = useState({
    src: null,
    file: null,
    width: 0,
    height: 0,
    name: "artwork.png"
  });

  // Saved DTF Collections & Versions State
  const [collections, setCollections] = useState([]);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
  const [isSaveGroupModalOpen, setIsSaveGroupModalOpen] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState(null);

  // Quick-Size Drawer State
  const [isSizeDrawerOpen, setIsSizeDrawerOpen] = useState(false);

  // Check if any graphic is active
  const hasArt = (artMode === "upload" && !!uploadedUrl) || (artMode === "drops" && !!selectedDrop);
  const printSurcharge = hasArt ? 199 : 0;
  const total = garment.price + printSurcharge;

  // Load collections on mount (Local cache first, then sync with backend API)
  useEffect(() => {
    const local = getDtfCollections();
    setCollections(local);
    const sid = getSessionId();
    api.getDtfCollections(sid)
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setCollections(res);
        }
      })
      .catch(() => {
        // Guest offline or backend unreachable; local storage suffices
      });
  }, []);

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

  // Upload handler with automatic aspect ratio check
  const handleUpload = (file) => {
    if (!file) return;
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const ratio = w / h;

      setCropSourceData({
        src: tempUrl,
        file,
        width: w,
        height: h,
        name: file.name
      });
      // Reset crop settings to initial 1x center for brand new uploads
      setCropSettings({ zoom: 1, pan: { x: 0, y: 0 } });

      // If image is not balanced boxy (outside 0.92 .. 1.08 range, e.g. 736x1308)
      if (ratio < 0.92 || ratio > 1.08) {
        setIsCropModalOpen(true);
        notify(`Non-boxy image detected (${w}×${h}). Aligning 1:1 boxy frame.`);
      } else {
        // Balanced square image: load directly
        applyUploadedFile(file, tempUrl, {
          src: tempUrl,
          file,
          width: w,
          height: h,
          name: file.name
        });
      }
    };
    img.src = tempUrl;
  };

  const applyUploadedFile = (file, url, cropSource) => {
    if (uploadedObjectUrlRef.current && uploadedObjectUrlRef.current !== url) {
      URL.revokeObjectURL(uploadedObjectUrlRef.current);
    }
    uploadedObjectUrlRef.current = url;
    setUploadedUrl(url);
    setSelectedDrop(null);
    setArtMode("upload");

    const reader = new FileReader();
    reader.onload = () => {
      const dUrl = reader.result;
      setUploadedDataUrl(dUrl);
      setActiveStudioArtwork({
        url,
        dataUrl: dUrl,
        name: file.name,
        cropSourceData: cropSource || {
          src: dUrl || url,
          file,
          width: 1200,
          height: 1200,
          name: file.name
        },
        cropSettings: { zoom: 1, pan: { x: 0, y: 0 } }
      });
    };
    reader.onerror = () => setUploadedDataUrl(null);
    reader.readAsDataURL(file);
  };

  // Confirm crop from ImageCropModal — preserves zoom and pan for minute adjustments
  const handleConfirmCrop = (croppedBlob, croppedDataUrl, newCropSettings) => {
    if (uploadedObjectUrlRef.current) {
      URL.revokeObjectURL(uploadedObjectUrlRef.current);
    }
    const newUrl = URL.createObjectURL(croppedBlob);
    uploadedObjectUrlRef.current = newUrl;
    setUploadedUrl(newUrl);
    setUploadedDataUrl(croppedDataUrl);
    const settings = newCropSettings || cropSettings;
    if (newCropSettings) {
      setCropSettings(newCropSettings);
    }
    setSelectedDrop(null);
    setArtMode("upload");
    setIsCropModalOpen(false);

    setActiveStudioArtwork({
      url: newUrl,
      dataUrl: croppedDataUrl,
      name: cropSourceData.name || "cropped_artwork.png",
      cropSourceData,
      cropSettings: settings
    });

    notify("Framed to 1:1 boxy streetwear DTF cut.");
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
    setActiveVersionId(null);
    setActiveStudioArtwork(null);
  };

  useEffect(() => {
    // 1. Check in-memory pending artwork from DTF Enhancer (bypasses 5MB quota)
    const pending = getPendingStudioArtwork();
    if (pending && (pending.dataUrl || pending.url || pending.blob)) {
      clearPendingStudioArtwork();
      const artDataUrl = pending.dataUrl || pending.url;

      setUploadedUrl(artDataUrl);
      setUploadedDataUrl(artDataUrl);
      setProcessedUrl(artDataUrl);

      const imgName = pending.name || "enhanced_artwork.png";

      const w = pending.width || 1200;
      const h = pending.height || 1200;
      const ratio = w / h;

      const cropSource = {
        src: artDataUrl,
        file: pending.blob || null,
        width: w,
        height: h,
        name: imgName,
      };

      // Set cropSourceData so "Adjust / Crop" works immediately without refresh!
      setCropSourceData(cropSource);
      setCropSettings({ zoom: 1, pan: { x: 0, y: 0 } });
      setSelectedDrop(null);
      setArtMode("upload");

      // Save as active studio artwork for route preservation
      setActiveStudioArtwork({
        url: artDataUrl,
        dataUrl: artDataUrl,
        name: imgName,
        originalFilename: imgName,
        width: w,
        height: h,
        cropSourceData: cropSource,
        cropSettings: { zoom: 1, pan: { x: 0, y: 0 } },
        dtf
      });

      if (ratio < 0.92 || ratio > 1.08) {
        setIsCropModalOpen(true);
        notify(`Enhanced art loaded (${w}×${h}). Aligning 1:1 boxy frame.`);
      } else {
        notify(`Loaded "${imgName}" into SHADE Atelier`);
      }
      return;
    }

    // 2. Check active studio artwork (when returning from another page like shop/cart/enhancer or back navigation)
    const active = getActiveStudioArtwork();
    if (active && (active.url || active.dataUrl) && !uploadedUrl) {
      const artUrl = active.url || active.dataUrl;
      const artDataUrl = active.dataUrl || active.url;

      setUploadedUrl(artUrl);
      setUploadedDataUrl(artDataUrl);
      setProcessedUrl(active.processedUrl || artDataUrl);

      if (active.cropSourceData) {
        setCropSourceData(active.cropSourceData);
      } else {
        setCropSourceData({
          src: artDataUrl,
          file: null,
          width: active.width || 1200,
          height: active.height || 1200,
          name: active.name || "artwork.png"
        });
      }

      if (active.cropSettings) {
        setCropSettings(active.cropSettings);
      }

      // CRITICAL: Restore every DTF setting (Vertical Placement, Knockout Color, Sensitivity, Softness, Sheet Size, Scale)!
      if (active.dtf) {
        setDtf(prev => ({ ...prev, ...active.dtf }));
      }

      if (active.activeVersionId) {
        setActiveVersionId(active.activeVersionId);
      }

      if (active.garment) {
        const matchingGarment = garmentOptions.find(g => g.type === active.garment.type) || active.garment;
        setGarment(matchingGarment);
      }

      if (active.color) {
        const matchingColor = colors.find(c => c.hex === active.color.hex || c.name === active.color.name) || active.color;
        setColor(matchingColor);
      }

      if (active.size) {
        setSize(active.size);
      }

      setSelectedDrop(null);
      setArtMode("upload");
      return;
    }

    // 3. Fallback: check legacy sessionStorage if present
    try {
      const savedArt = sessionStorage.getItem("shade_custom_artwork_data");
      if (savedArt) {
        sessionStorage.removeItem("shade_custom_artwork_data");
        setUploadedDataUrl(savedArt);
        setUploadedUrl(savedArt);
        setCropSourceData({
          src: savedArt,
          file: null,
          width: 1200,
          height: 1200,
          name: "enhanced_artwork.png",
        });
        setCropSettings({ zoom: 1, pan: { x: 0, y: 0 } });
        setSelectedDrop(null);
        setArtMode("upload");
        notify("Loaded enhanced DTF artwork into Atelier");
      }
    } catch (_) {}

    return () => {
      if (uploadedObjectUrlRef.current) URL.revokeObjectURL(uploadedObjectUrlRef.current);
    };
  }, []);

  // Continuously sync all adjustments & actions to activeStudioArtwork so back/forward navigation preserves EVERYTHING
  useEffect(() => {
    if (artMode === "upload" && (uploadedUrl || uploadedDataUrl)) {
      updateActiveStudioArtwork({
        url: uploadedUrl,
        dataUrl: uploadedDataUrl,
        processedUrl,
        name: cropSourceData.name || activeFileName,
        originalFilename: activeFileName,
        cropSourceData,
        cropSettings,
        dtf,
        activeVersionId,
        garment,
        color,
        size
      });
    }
  }, [
    uploadedUrl,
    uploadedDataUrl,
    processedUrl,
    cropSourceData,
    cropSettings,
    dtf,
    activeVersionId,
    garment,
    color,
    size,
    artMode,
    activeFileName
  ]);

  const dtfSheetVisualScale = (dtf.printScale ?? 1) * (dtf.selectedSheetPreset === "A4" ? 0.72 : 1.0);

  // Avatar/Image feed for 3D Viewer
  const viewerAvatar = (() => {
    if (artMode === "upload" && (uploadedUrl || uploadedDataUrl)) {
      return { id: "uploaded", title: "Custom Artwork", category: "Upload", imageUrl: processedUrl || uploadedDataUrl || uploadedUrl };
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

  // Auto-calculated version name
  const activeFileName = cropSourceData.name || "custom_graphic.png";
  const existingCount = collections.filter(c => c.originalFilename === activeFileName).length;
  const nextVersionNum = existingCount + 1;
  const suggestedVersionName = useMemo(() => {
    const base = activeFileName.replace(/\.[^/.]+$/, "");
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return `${base} · v${nextVersionNum} · ${dateStr}, ${timeStr}`;
  }, [activeFileName, nextVersionNum]);

  // Open Instagram-style Save to Collection Folder Modal
  const handleSaveVersion = () => {
    if (!uploadedUrl) {
      notify("Please upload or frame a graphic before saving a version.");
      return;
    }
    setIsSaveGroupModalOpen(true);
  };

  const handleConfirmSaveToGroup = async ({ designName, collectionGroup }) => {
    setIsSavingVersion(true);
    const sid = getSessionId();
    const finalGroupName = collectionGroup && collectionGroup.trim() ? collectionGroup.trim() : "General";
    saveDtfGroup(finalGroupName);

    const targetSource = processedUrl || uploadedDataUrl || uploadedUrl;
    
    // Generate an ultra-fast lightweight thumbnail (< 40KB) to prevent QuotaExceededError and latency
    let thumbnailDataUrl = targetSource;
    try {
      if (targetSource && targetSource.length > 50000) {
        thumbnailDataUrl = await createThumbnailDataUrl(targetSource, 500, 0.82);
      }
    } catch (e) {
      console.warn("Thumbnail generation error, proceeding:", e);
    }

    const versionPayload = {
      id: `dtf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId: sid,
      designName: designName || suggestedVersionName,
      collectionGroup: finalGroupName,
      originalFilename: activeFileName,
      versionNumber: nextVersionNum,
      // Store lightweight preview to ensure instant saves without exceeding 5MB quota
      imageDataUrl: thumbnailDataUrl,
      previewDataUrl: thumbnailDataUrl,
      selectedSheetPreset: dtf.selectedSheetPreset,
      printScale: dtf.printScale ?? 1,
      collarDistanceInches: dtf.collarDistanceInches ?? 2.5,
      stripColorHex: dtf.stripColorHex,
      stripSensitivity: dtf.stripSensitivity,
      halftoneDensity: dtf.halftoneDensity,
      garmentType: garment.type,
      fabricColorName: color.name,
      fabricColorHex: color.hex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately save to local storage for zero-latency instant response
    const updated = saveDtfCollectionItem(versionPayload);
    setCollections(updated);
    setActiveVersionId(versionPayload.id);
    setIsSaveGroupModalOpen(false);

    // 2. Synchronize to backend database
    try {
      await api.saveDtfCollection(versionPayload, sid);
    } catch {
      // Offline / guest mode handled via local storage seamlessly
    } finally {
      setIsSavingVersion(false);
      notify(`Saved to "${finalGroupName}": ${designName || `v${nextVersionNum}`}`);
    }
  };

  // Apply saved version directly into the 3D studio
  const handleApplyVersion = (item) => {
    // 1. Set Garment
    const matchingGarment = garmentOptions.find(g => g.type === item.garmentType) || garmentOptions[0];
    setGarment(matchingGarment);

    // 2. Set Fabric Color
    const matchingColor = colors.find(c => c.name === item.fabricColorName || c.hex === item.fabricColorHex) || colors[0];
    setColor(matchingColor);

    // 3. Set DTF Parameters
    setDtf({
      selectedSheetPreset: item.selectedSheetPreset || "A3",
      stripColorHex: item.stripColorHex || "#ffffff",
      stripSensitivity: item.stripSensitivity ?? 30,
      halftoneDensity: item.halftoneDensity ?? 0,
      printScale: item.printScale ?? 1,
      collarDistanceInches: item.collarDistanceInches ?? 2.5
    });

    // 4. Set Image
    const targetImg = item.previewDataUrl || item.imageDataUrl;
    if (uploadedObjectUrlRef.current) URL.revokeObjectURL(uploadedObjectUrlRef.current);
    uploadedObjectUrlRef.current = null;
    setUploadedUrl(targetImg);
    setUploadedDataUrl(targetImg);
    setProcessedUrl(item.previewDataUrl || targetImg);
    setCropSourceData({
      src: targetImg,
      file: null,
      width: 1024,
      height: 1024,
      name: item.originalFilename || "saved_version.png",
    });

    setSelectedDrop(null);
    setArtMode("upload");
    setActiveVersionId(item.id);
    notify(`Loaded version: ${item.designName}`);
  };

  // Direct Add to Bag from Collection Version
  const handleAddToCartVersion = (item) => {
    handleApplyVersion(item);
    setIsCollectionsModalOpen(false);
    setIsSizeDrawerOpen(true);
  };

  // Delete saved version
  const handleDeleteVersion = async (id) => {
    const updated = deleteDtfCollectionItem(id);
    setCollections(updated);
    if (activeVersionId === id) setActiveVersionId(null);
    try {
      await api.deleteDtfCollection(id, getSessionId());
    } catch (_) {}
    notify("Removed version from collections.");
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
      preview_data_url: processedUrl || uploadedDataUrl || uploadedUrl,
      collar_distance_inches: dtf.collarDistanceInches ?? 2.5,
      print_placement: `Back DTF Centered · ${(dtf.collarDistanceInches ?? 2.5).toFixed(1)}″ below collar seam`
    } : null;

    addToCart({
      id: `shade-${Date.now()}`,
      productId: null,
      name: `SHADE 01 ${garment.label}${hasArt ? "" : " (Clean Blank)"}`,
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
    notify(`Added to bag: SHADE 01 ${garment.label} (${color.name} · Size ${finalSize})`);
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
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
            SHADE 01 Atelier · Tirupur Cotton
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl text-white">
            Form Follows Shade.
          </h1>
          <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-6 text-zinc-400">
            Heavyweight monochrome blanks engineered for young adults. Pure black & white shades with zero dead stock.
          </p>
        </div>

        {/* Collections Drawer Pill Button */}
        <button
          type="button"
          onClick={() => setIsCollectionsModalOpen(true)}
          className="self-start md:self-auto flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/30 transition shadow-sm"
        >
          <Layers size={15} className="text-zinc-300" />
          <span>My DTF Collections</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-mono font-bold">
            {collections.length}
          </span>
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.35fr_380px]">
        {/* Left: 3D Garment Atelier Viewport */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d10] p-3 shadow-2xl">
            <Suspense fallback={
              <div className="grid aspect-[4/5] place-items-center rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f2f2f5_55%,#d8d8de_100%)] text-xs text-zinc-500 font-mono">
                Loading SHADE 01 3D Atelier…
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
                collarDistanceInches={dtf.collarDistanceInches ?? 2.5}
                onCollarDistanceChange={(val) => setDtf(prev => ({ ...prev, collarDistanceInches: val }))}
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

        {/* Right: Clean Configuration Column */}
        <div className="space-y-4">
          
          {/* Step 1: Silhouette Cut (CLOSED BY DEFAULT) */}
          <section className="mc-card overflow-hidden">
            <button
              type="button"
              onClick={() => setIsSilhouetteOpen(v => !v)}
              className="w-full flex items-center justify-between p-4 text-left transition hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-[10px] font-bold text-white">01</span>
                <div>
                  <h2 className="text-sm font-semibold text-white leading-none">Garment Silhouette</h2>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    {garment.label} · {money(garment.price)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                  {garment.gsm}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                  {isSilhouetteOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>
            </button>

            {isSilhouetteOpen && (
              <div className="p-4 pt-1 border-t border-white/10 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {garmentOptions.map(g => (
                    <button
                      key={g.type}
                      type="button"
                      onClick={() => setGarment(g)}
                      className={`rounded-xl border p-3 text-left transition ${
                        garment.type === g.type
                          ? "border-white bg-white/10 text-white ring-1 ring-white/30"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{g.label}</span>
                        <span className="text-xs font-mono font-semibold text-zinc-300">{money(g.price)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{g.description}</span>
                        <span className="font-mono text-zinc-400">{g.gsm}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Monochrome Shade (CLOSED BY DEFAULT) */}
          <section className="mc-card overflow-hidden">
            <button
              type="button"
              onClick={() => setIsShadeOpen(v => !v)}
              className="w-full flex items-center justify-between p-4 text-left transition hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-[10px] font-bold text-white">02</span>
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border border-white/30 shadow-inner"
                    style={{ background: color.hex }}
                  />
                  <div>
                    <h2 className="text-sm font-semibold text-white leading-none">Fabric Shade</h2>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {color.name} · Ready Stock Tirupur
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">{color.gsm}</span>
                {isShadeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isShadeOpen && (
              <div className="p-4 pt-1 border-t border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  {colors.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                        color.name === c.name
                          ? "border-white bg-white/10 ring-1 ring-white/30"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full border border-white/20 shadow-inner shrink-0"
                        style={{ background: c.hex }}
                      />
                      <div className="text-left min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{c.gsm}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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

            {/* Custom Upload Panel with Auto-Crop, Hidden-by-Default Controls & Save Version */}
            {artMode === "upload" && (
              <DtfPrintPanel
                value={dtf}
                onChange={setDtf}
                hasSource={!!uploadedUrl}
                previewUrl={processedUrl}
                rawSourceUrl={uploadedDataUrl || uploadedUrl}
                sourceLabel={cropSourceData.name || "Uploaded graphic"}
                activeFileName={activeFileName}
                onUpload={handleUpload}
                onClearUpload={clearUpload}
                uploadedUrl={uploadedUrl}
                previewDataUrl={processedUrl}
                uploadedDataUrl={uploadedDataUrl}
                onOpenCrop={() => {
                  if (cropSourceData.src) {
                    setIsCropModalOpen(true);
                  }
                }}
                onSaveVersion={handleSaveVersion}
                isSavingVersion={isSavingVersion}
                suggestedVersionName={suggestedVersionName}
              />
            )}
            <div className="pt-1 text-right">
              <Link 
                to="/enhancer" 
                className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1 font-mono transition"
              >
                <Sparkles size={12} className="text-emerald-400" />
                <span>Need 4× AI Super-Resolution or background removal? Open DTF Enhancer →</span>
              </Link>
            </div>
          </section>

          {/* Pricing & Add to Bag */}
          <div className="mc-card p-5">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{garment.label} ({color.name})</span>
              <span>{money(garment.price)}</span>
            </div>
            {hasArt ? (
              <div className="mt-2 flex justify-between text-xs text-zinc-400">
                <span>DTF Back Transfer ({selectedDrop ? selectedDrop.title : "Custom Upload"})</span>
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

      {/* Image Crop Modal for 1:1 Boxy Ratio Alignment */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropSourceData.src}
        fileName={cropSourceData.name}
        dimensions={{ width: cropSourceData.width, height: cropSourceData.height }}
        initialCropSettings={cropSettings}
        onConfirmCrop={handleConfirmCrop}
        onCancel={() => setIsCropModalOpen(false)}
      />

      {/* Saved DTF Collections & Versions Modal */}
      <DtfCollectionsModal
        isOpen={isCollectionsModalOpen}
        onClose={() => setIsCollectionsModalOpen(false)}
        collections={collections}
        onApplyVersion={handleApplyVersion}
        onAddToCartVersion={handleAddToCartVersion}
        onDeleteVersion={handleDeleteVersion}
        activeVersionId={activeVersionId}
      />

      {/* Save to Collection Folder Modal (Instagram-style grouping) */}
      <SaveToGroupModal
        isOpen={isSaveGroupModalOpen}
        onClose={() => setIsSaveGroupModalOpen(false)}
        suggestedName={suggestedVersionName}
        existingGroups={getDtfGroups()}
        previewImage={processedUrl || uploadedDataUrl || uploadedUrl}
        onSave={handleConfirmSaveToGroup}
        isSaving={isSavingVersion}
      />
    </div>
  );
}
