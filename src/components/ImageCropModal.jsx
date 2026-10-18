import React, { useState, useRef, useEffect, useCallback } from "react";
import { Crop, ZoomIn, ZoomOut, RotateCcw, Check, X, AlertTriangle } from "lucide-react";

export default function ImageCropModal({
  isOpen,
  imageSrc,
  fileName = "artwork.png",
  dimensions = { width: 0, height: 0 },
  onConfirmCrop,
  onCancel,
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Reset zoom and pan when modal opens with new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

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
    const frameSize = container ? container.clientWidth : 320;

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
        onConfirmCrop(blob, dataUrl);
      },
      "image/png",
      1.0
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-zinc-950 p-6 shadow-2xl text-white">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
                <Crop size={14} />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Boxy Ratio Alignment</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Frame your artwork inside the locked 1:1 box for crisp chest DTF heat-press.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Aspect Ratio Alert Pill */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-200">
          <AlertTriangle size={15} className="shrink-0 text-amber-400" />
          <div className="flex-1 min-w-0">
            <span>
              Detected: <strong className="font-mono text-white">{origW} × {origH} px</strong> ({origRatio}:1 ratio {isTall ? "tall portrait" : "wide"}).
            </span>
            <span className="block text-[11px] text-amber-300/80 mt-0.5">
              Locked to balanced <strong>1:1 Boxy Streetwear Frame</strong>. Drag to center.
            </span>
          </div>
        </div>

        {/* 1:1 Square Crop Viewport */}
        <div className="mt-4 flex justify-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-xl border-2 border-white/40 overflow-hidden bg-zinc-900 cursor-grab active:cursor-grabbing select-none shadow-inner"
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
            <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-1 text-[10px] font-mono text-zinc-300 backdrop-blur border border-white/10">
              Locked 1:1 Boxy
            </div>
          </div>
        </div>

        {/* Controls: Zoom Slider & Reset */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">
              <ZoomOut size={15} />
            </span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-white h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-zinc-400">
              <ZoomIn size={15} />
            </span>
            <span className="text-xs font-mono text-zinc-300 w-10 text-right">
              {zoom.toFixed(1)}×
            </span>
            <button
              type="button"
              onClick={handleReset}
              title="Reset Zoom & Pan"
              className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition text-xs flex items-center gap-1"
            >
              <RotateCcw size={12} />
            </button>
          </div>
          <p className="text-[11px] text-center text-zinc-500 font-mono">
            Drag image inside the frame to adjust placement.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition rounded-xl border border-white/10 hover:border-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-black bg-white hover:bg-zinc-200 transition rounded-xl shadow-md"
          >
            <Check size={14} /> Confirm 1:1 Boxy Crop
          </button>
        </div>

      </div>
    </div>
  );
}
