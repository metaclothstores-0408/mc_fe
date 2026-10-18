import React, { useState, useRef, useEffect } from "react";
import { Crop, ZoomIn, ZoomOut, RotateCcw, Check, X, AlertTriangle } from "lucide-react";

export default function ImageCropModal({
  isOpen,
  imageSrc,
  fileName = "artwork.png",
  dimensions = { width: 0, height: 0 },
  initialCropSettings = { zoom: 1, pan: { x: 0, y: 0 } },
  onConfirmCrop,
  onCancel,
}) {
  const [zoom, setZoom] = useState(initialCropSettings?.zoom ?? 1);
  const [pan, setPan] = useState(initialCropSettings?.pan ?? { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Restore the last crop zoom and pan when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(initialCropSettings?.zoom ?? 1);
      setPan(initialCropSettings?.pan ?? { x: 0, y: 0 });
    }
  }, [isOpen, initialCropSettings]);

  if (!isOpen || !imageSrc) return null;

  const origW = dimensions.width || 1;
  const origH = dimensions.height || 1;
  const isTall = origH > origW;
  const origRatio = (origW / origH).toFixed(2);

  // Mouse & Touch Pan handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Render high-res 1:1 square crop to canvas
  const handleApplyCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const exportDim = Math.max(1024, Math.min(2048, Math.max(img.naturalWidth, img.naturalHeight)));
    const canvas = document.createElement("canvas");
    canvas.width = exportDim;
    canvas.height = exportDim;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Frame size in UI
    const container = containerRef.current;
    const frameSize = container ? container.clientWidth : 240;

    // Scale factors from UI frame to high-res export canvas
    const exportScale = exportDim / frameSize;

    // Base fitted dimensions of image inside frame
    const baseFitScale = Math.max(frameSize / img.naturalWidth, frameSize / img.naturalHeight);
    const fitW = img.naturalWidth * baseFitScale;
    const fitH = img.naturalHeight * baseFitScale;

    // Render with zoom and pan
    const finalW = fitW * zoom * exportScale;
    const finalH = fitH * zoom * exportScale;
    const centerX = exportDim / 2 + pan.x * exportScale;
    const centerY = exportDim / 2 + pan.y * exportScale;
    const drawX = centerX - finalW / 2;
    const drawY = centerY - finalH / 2;

    ctx.drawImage(img, drawX, drawY, finalW, finalH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const dataUrl = canvas.toDataURL("image/png");
        onConfirmCrop(blob, dataUrl, { zoom, pan });
      },
      "image/png",
      1.0
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Container: strictly max-h-[90vh] with flex-col so bottom buttons are ALWAYS visible */}
      <div className="relative flex flex-col w-full max-w-md max-h-[90vh] rounded-2xl border border-white/20 bg-zinc-950 shadow-2xl text-white overflow-hidden">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
              <Crop size={14} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-none">Boxy Ratio Alignment</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Locked 1:1 Streetwear DTF frame</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Center Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Aspect Ratio Alert Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle size={14} className="shrink-0 text-amber-400" />
            <div className="flex-1 min-w-0 text-[11px]">
              <span>
                Original: <strong className="font-mono text-white">{origW} × {origH} px</strong> ({origRatio}:1 ratio {isTall ? "tall" : "wide"}).
              </span>
              <span className="block text-amber-300/80">
                Panned & zoomed to balanced 1:1 box. Drag to reposition.
              </span>
            </div>
          </div>

          {/* 1:1 Square Crop Viewport: responsive height to fit 100% zoom screens */}
          <div className="flex justify-center">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-xl border-2 border-white/40 overflow-hidden bg-zinc-900 cursor-grab active:cursor-grabbing select-none shadow-inner"
            >
              {/* Hidden raw image for measurements */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Raw upload"
                crossOrigin="anonymous"
                className="pointer-events-none select-none max-w-none transition-transform duration-75"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: isTall ? "auto" : "100%",
                  height: isTall ? "100%" : "auto",
                  minWidth: "100%",
                  minHeight: "100%",
                  objectFit: "cover",
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              />

              {/* Rule-of-Thirds Grid Overlay */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-b border-r border-white/15" />
                <div className="border-b border-r border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-b border-r border-white/15" />
                <div className="border-b border-r border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-white/15" />
                <div className="border-r border-white/15" />
                <div />
              </div>

              {/* Center Crosshair */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-t border-l border-white/50" />
                <div className="w-4 h-4 border-t border-r border-white/50" />
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-b border-l border-white/50" />
                <div className="w-4 h-4 border-b border-r border-white/50" />
              </div>

              {/* Locked Badge */}
              <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-0.5 text-[9px] font-mono text-zinc-300 backdrop-blur border border-white/10">
                Locked 1:1 Boxy
              </div>
            </div>
          </div>

          {/* Controls: Zoom Slider & Reset */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2.5">
              <span className="text-zinc-400">
                <ZoomOut size={13} />
              </span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-white h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-zinc-400">
                <ZoomIn size={13} />
              </span>
              <span className="text-xs font-mono text-zinc-300 w-10 text-right">
                {zoom.toFixed(2)}×
              </span>
              <button
                type="button"
                onClick={handleReset}
                title="Reset to 1x Center"
                className="p-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition text-xs flex items-center gap-1"
              >
                <RotateCcw size={11} />
              </button>
            </div>
            <p className="text-[10px] text-center text-zinc-500 font-mono">
              Drag image inside frame to align placement minutely.
            </p>
          </div>
        </div>

        {/* Sticky Pinned Footer: Always visible at bottom without scrolling */}
        <div className="flex items-center justify-end gap-2.5 px-4 py-3 border-t border-white/10 bg-zinc-900/95 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition rounded-xl border border-white/10 hover:border-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-black bg-white hover:bg-zinc-200 transition rounded-xl shadow-md"
          >
            <Check size={14} /> Confirm 1:1 Boxy Crop
          </button>
        </div>

      </div>
    </div>
  );
}
