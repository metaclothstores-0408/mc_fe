import { avatars } from "../data/mock";

export default function AvatarPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-8">
      {avatars.map(avatar => (
        <button key={avatar.id} onClick={() => onSelect(avatar)} className={`group overflow-hidden rounded-xl border p-1 transition ${selected?.id === avatar.id ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20" : "border-white/10 bg-white/[.025] hover:border-white/20"}`}>
          <img src={avatar.imageUrl} alt={avatar.title} className="aspect-square w-full rounded-lg bg-zinc-900 object-cover"/>
          <div className="truncate px-1 py-1.5 text-[9px] text-zinc-500 group-hover:text-zinc-300">{String(avatar.id).padStart(2, "0")}</div>
        </button>
      ))}
    </div>
  );
}