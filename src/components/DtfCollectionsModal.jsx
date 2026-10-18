import React, { useState, useMemo } from "react";
import {
  X,
  Layers,
  Sparkles,
  Trash2,
  Check,
  ArrowRight,
  Eye,
  ShoppingBag,
  Sliders,
  Calendar,
  Columns,
  Scale,
  Folder
} from "lucide-react";
import { money } from "../lib/storage";

export default function DtfCollectionsModal({
  isOpen,
  onClose,
  collections = [],
  onApplyVersion,
  onAddToCartVersion,
  onDeleteVersion,
  activeVersionId = null,
}) {
  const [mode, setMode] = useState("list"); // 'list' | 'compare'
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("ALL");

  const groups = useMemo(() => {
    const gSet = new Set();
    collections.forEach((c) => {
      if (c.collectionGroup && c.collectionGroup.trim()) {
        gSet.add(c.collectionGroup.trim());
      } else {
        gSet.add("General");
      }
    });
    return Array.from(gSet);
  }, [collections]);

  const filteredCollections = useMemo(() => {
    if (selectedGroup === "ALL") return collections;
    return collections.filter((c) => (c.collectionGroup || "General") === selectedGroup);
  }, [collections, selectedGroup]);

  if (!isOpen) return null;

  const handleToggleCompare = (item) => {
    if (selectedForCompare.some((x) => x.id === item.id)) {
      setSelectedForCompare(selectedForCompare.filter((x) => x.id !== item.id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[0], item]);
      } else {
        const next = [...selectedForCompare, item];
        setSelectedForCompare(next);
        if (next.length === 2) {
          setMode("compare");
        }
      }
    }
  };

  const compA = selectedForCompare[0] || filteredCollections[0] || collections[0];
  const compB = selectedForCompare[1] || filteredCollections[1] || collections[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[88vh] rounded-2xl border border-white/20 bg-zinc-950 shadow-2xl text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white border border-white/10">
              <Layers size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Saved DTF Collections</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                  {collections.length} versions
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Organized iterations of your custom artwork, DTF print profiles, and silhouettes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            {collections.length >= 2 && (
              <div className="flex rounded-xl border border-white/10 bg-zinc-900 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    mode === "list" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All Versions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedForCompare.length < 2 && collections.length >= 2) {
                      setSelectedForCompare([collections[0], collections[1]]);
                    }
                    setMode("compare");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    mode === "compare" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Scale size={13} /> Compare
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-zinc-500 mb-4">
                <Layers size={26} />
              </span>
              <h3 className="text-sm font-semibold text-white">No Saved Versions Yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1">
                Upload your graphic in the Studio, adjust your desired DTF print quality controls, and click <strong>"Save Version"</strong> to organize iterations into collection folders.
              </p>
            </div>
          ) : mode === "list" ? (
            /* List Mode: Filter by Collection Group Folders + Sorted by Latest Changes (Descending) */
            <div className="space-y-4">
              
              {/* Instagram-style Folder Pills Filter */}
              {groups.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedGroup("ALL")}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold transition ${
                      selectedGroup === "ALL"
                        ? "border-white bg-white text-black shadow-sm"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span>All Folders</span>
                    <span className="font-mono text-[10px] opacity-80">({collections.length})</span>
                  </button>

                  {groups.map((grp) => {
                    const count = collections.filter((c) => (c.collectionGroup || "General") === grp).length;
                    const isAct = selectedGroup === grp;
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setSelectedGroup(grp)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold transition ${
                          isAct
                            ? "border-white bg-white text-black shadow-sm"
                            : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <Folder size={12} className={isAct ? "text-black" : "text-zinc-500"} />
                        <span>{grp}</span>
                        <span className="font-mono text-[10px] opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Version Cards */}
              <div className="space-y-3">
                {filteredCollections.map((item) => {
                  const isActive = activeVersionId === item.id;
                  const isComparing = selectedForCompare.some((x) => x.id === item.id);

                  return (
                    <div
                      key={item.id}
                      className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border p-4 transition ${
                        isActive
                          ? "border-white bg-white/10 shadow-lg ring-1 ring-white/30"
                          : "border-white/10 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900"
                      }`}
                    >
                      {/* Left: Thumbnail & Version Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative h-16 w-16 shrink-0 rounded-lg border border-white/15 bg-black/60 p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={item.previewDataUrl || item.imageDataUrl}
                            alt={item.designName}
                            className="h-full w-full object-contain"
                          />
                          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-mono font-bold text-zinc-300">
                            v{item.versionNumber || 1}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {item.designName}
                            </h4>
                            {isActive && (
                              <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                                Active in 3D
                              </span>
                            )}
                          </div>

                          {/* Badges / Specs */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                            {/* Collection Folder Badge */}
                            <span className="rounded bg-white/10 px-2 py-0.5 border border-white/15 text-white flex items-center gap-1 font-semibold">
                              <Folder size={10} className="text-zinc-400" />
                              {item.collectionGroup || "General"}
                            </span>

                            <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10 text-zinc-300">
                              {item.garmentType === "OVERSIZED_BOXY" ? "Oversized 240 GSM" : item.garmentType || "Streetwear"}
                            </span>

                            <span className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 border border-white/10 text-zinc-300">
                              <span
                                className="h-2 w-2 rounded-full border border-white/30"
                                style={{ background: item.fabricColorHex || "#0B0B0C" }}
                              />
                              {item.fabricColorName || "Noir Black"}
                            </span>

                            <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10 text-zinc-300">
                              Sheet: {item.selectedSheetPreset || "A3"}
                            </span>

                            <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10 text-zinc-300">
                              Halftone: {item.halftoneDensity ?? 0}%
                            </span>

                            {item.stripColorHex && (
                              <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10 text-zinc-300">
                                Knockout: {item.stripColorHex} ({item.stripSensitivity ?? 30}%)
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <Calendar size={11} />
                            <span>
                              {item.updatedAt ? new Date(item.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Recently updated"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <button
                          type="button"
                          onClick={() => handleToggleCompare(item)}
                          title={isComparing ? "Remove from comparison" : "Add to side-by-side compare"}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                            isComparing
                              ? "border-amber-400/50 bg-amber-500/10 text-amber-300"
                              : "border-white/10 hover:border-white/20 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Scale size={13} />
                          <span className="hidden sm:inline">{isComparing ? "Selected" : "Compare"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onApplyVersion(item);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
                        >
                          <Eye size={13} />
                          <span>Apply to 3D</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onAddToCartVersion(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-sm"
                        >
                          <ShoppingBag size={13} />
                          <span>Add to Bag</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteVersion(item.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Delete Version"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Compare Mode: Side-by-Side Comparison */
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-3 border border-white/10 text-xs">
                <span className="text-zinc-300">
                  Comparing <strong>Version {compA?.versionNumber || 1}</strong> vs <strong>Version {compB?.versionNumber || 2}</strong>
                </span>
                <span className="text-zinc-500 font-mono">
                  Review print settings & apply the best variation to your 3D tee.
                </span>
              </div>

              {compA && compB ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Version A Card */}
                  <div className="rounded-xl border border-white/20 bg-zinc-900/80 p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                            OPTION A · v{compA.versionNumber || 1}
                          </span>
                          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300 font-mono">
                            {compA.collectionGroup || "General"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{compA.designName}</h4>
                      </div>
                      <div className="h-14 w-14 rounded-lg border border-white/10 bg-black p-1 flex items-center justify-center">
                        <img src={compA.previewDataUrl || compA.imageDataUrl} alt="" className="h-full w-full object-contain" />
                      </div>
                    </div>

                    {/* Spec List */}
                    <div className="space-y-2 border-t border-b border-white/10 py-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Garment Silhouette</span>
                        <span className="font-semibold text-white">{compA.garmentType === "OVERSIZED_BOXY" ? "Oversized Boxy (240 GSM)" : compA.garmentType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Fabric Shade</span>
                        <span className="flex items-center gap-1.5 font-semibold text-white">
                          <span className="h-2.5 w-2.5 rounded-full border border-white/30" style={{ background: compA.fabricColorHex || "#0B0B0C" }} />
                          {compA.fabricColorName || "Noir Black"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">DTF Sheet Preset</span>
                        <span className="font-mono font-semibold text-white">{compA.selectedSheetPreset || "A3"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Print Scale</span>
                        <span className="font-mono text-zinc-300">{Math.round((compA.printScale || 1) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Halftone Breathability</span>
                        <span className="font-mono text-zinc-300">{compA.halftoneDensity ?? 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Knockout Color</span>
                        <span className="font-mono text-zinc-300">{compA.stripColorHex || "None"} ({compA.stripSensitivity ?? 30}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyVersion(compA);
                          onClose();
                        }}
                        className="flex-1 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5"
                      >
                        <Eye size={13} /> Preview on 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddToCartVersion(compA)}
                        className="flex-1 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag size={13} /> Add Option A
                      </button>
                    </div>
                  </div>

                  {/* Version B Card */}
                  <div className="rounded-xl border border-white/20 bg-zinc-900/80 p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                            OPTION B · v{compB.versionNumber || 2}
                          </span>
                          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300 font-mono">
                            {compB.collectionGroup || "General"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{compB.designName}</h4>
                      </div>
                      <div className="h-14 w-14 rounded-lg border border-white/10 bg-black p-1 flex items-center justify-center">
                        <img src={compB.previewDataUrl || compB.imageDataUrl} alt="" className="h-full w-full object-contain" />
                      </div>
                    </div>

                    {/* Spec List */}
                    <div className="space-y-2 border-t border-b border-white/10 py-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Garment Silhouette</span>
                        <span className="font-semibold text-white">{compB.garmentType === "OVERSIZED_BOXY" ? "Oversized Boxy (240 GSM)" : compB.garmentType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Fabric Shade</span>
                        <span className="flex items-center gap-1.5 font-semibold text-white">
                          <span className="h-2.5 w-2.5 rounded-full border border-white/30" style={{ background: compB.fabricColorHex || "#0B0B0C" }} />
                          {compB.fabricColorName || "Noir Black"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">DTF Sheet Preset</span>
                        <span className="font-mono font-semibold text-white">{compB.selectedSheetPreset || "A3"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Print Scale</span>
                        <span className="font-mono text-zinc-300">{Math.round((compB.printScale || 1) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Halftone Breathability</span>
                        <span className="font-mono text-zinc-300">{compB.halftoneDensity ?? 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Knockout Color</span>
                        <span className="font-mono text-zinc-300">{compB.stripColorHex || "None"} ({compB.stripSensitivity ?? 30}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyVersion(compB);
                          onClose();
                        }}
                        className="flex-1 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5"
                      >
                        <Eye size={13} /> Preview on 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddToCartVersion(compB)}
                        className="flex-1 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag size={13} /> Add Option B
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">
                  Select at least 2 versions from the list to compare side-by-side.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-zinc-900/60 shrink-0 text-xs">
          <span className="text-zinc-500 font-mono">
            SHADE 01 Atelier · Saved DTF Collections
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
