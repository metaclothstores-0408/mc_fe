import React, { useState, useEffect } from "react";
import { Folder, FolderPlus, Bookmark, Check, X, Sparkles } from "lucide-react";

export default function SaveToGroupModal({
  isOpen,
  onClose,
  suggestedName = "Custom Artwork v1",
  existingGroups = ["General"],
  previewImage,
  onSave,
  isSaving = false,
}) {
  const [designName, setDesignName] = useState(suggestedName);
  const [selectedGroup, setSelectedGroup] = useState("General");
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDesignName(suggestedName);
      setSelectedGroup(existingGroups[0] || "General");
      setNewGroupName("");
      setIsCreatingNew(false);
    }
  }, [isOpen, suggestedName, existingGroups]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalGroup = isCreatingNew && newGroupName.trim()
      ? newGroupName.trim()
      : selectedGroup || "General";
    onSave({
      designName: designName.trim() || suggestedName,
      collectionGroup: finalGroup,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-md rounded-2xl border border-white/20 bg-zinc-950 shadow-2xl text-white overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-white">
              <Bookmark size={15} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Save to Collection</h2>
              <p className="text-[11px] text-zinc-400">Organize your DTF print iterations into folders</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          
          {/* Preview Thumbnail & Name Input */}
          <div className="flex items-center gap-3">
            {previewImage && (
              <div className="h-12 w-12 shrink-0 rounded-lg border border-white/15 bg-black p-1 flex items-center justify-center overflow-hidden">
                <img src={previewImage} alt="preview" className="h-full w-full object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Version Name
              </label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="mc-input w-full text-xs font-mono py-1.5"
                placeholder="Enter version title"
              />
            </div>
          </div>

          {/* Collection Group Folders (Instagram style) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <Folder size={13} className="text-zinc-400" />
                <span>Select Collection Folder</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(v => !v);
                  if (!isCreatingNew) setNewGroupName("");
                }}
                className="text-[11px] text-zinc-400 hover:text-white underline decoration-white/20 underline-offset-4 flex items-center gap-1"
              >
                <FolderPlus size={12} />
                <span>{isCreatingNew ? "Use existing" : "+ New Folder"}</span>
              </button>
            </div>

            {/* Folder selection chips */}
            {!isCreatingNew ? (
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {existingGroups.map((group) => {
                  const isSelected = selectedGroup === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setSelectedGroup(group)}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition ${
                        isSelected
                          ? "border-white bg-white/15 text-white ring-1 ring-white/30"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-semibold truncate flex items-center gap-1.5">
                        <Folder size={12} className={isSelected ? "text-white" : "text-zinc-500"} />
                        {group}
                      </span>
                      {isSelected && <Check size={13} className="text-white shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Inline Create New Folder Input */
              <div className="space-y-2 p-3 rounded-xl border border-white/20 bg-white/[0.03]">
                <label className="block text-[11px] text-zinc-400">
                  New Collection Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Dark Anime, Acid Wash Series..."
                    className="mc-input flex-1 text-xs py-1.5"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirm();
                    }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-white/10 bg-zinc-900/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition rounded-xl border border-white/10 hover:border-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving || (isCreatingNew && !newGroupName.trim())}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-black bg-white hover:bg-zinc-200 transition rounded-xl shadow-md disabled:opacity-50"
          >
            <Bookmark size={13} />
            <span>{isSaving ? "Saving…" : "Save to Collection"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

