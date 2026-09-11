import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, RotateCcw, ShoppingBag, X } from "lucide-react";
import AvatarPicker from "../components/AvatarPicker";
import DtfPrintPanel from "../components/DtfPrintPanel";
import { colors, garmentOptions, sizes, zones } from "../data/mock";
import { money } from "../lib/storage";
import { computePrintWidthInches, getSheetPreset, processDtfImage } from "../lib/dtfProcessor";

const TshirtViewer = lazy(() => import("../components/TshirtViewer"));

export default function Studio({ addToCart, notify }) {
  const [garment,setGarment]=useState(garmentOptions[0]);
  const [color,setColor]=useState(colors[0]);
  const [size,setSize]=useState("M");
  const [zone,setZone]=useState(zones[0]);
  const [avatar,setAvatar]=useState(null);
  const [text,setText]=useState("");
  const [font,setFont]=useState("Bebas Neue");
  const [fontSize,setFontSize]=useState(96);
  const fonts=[
    { label:"Bebas Neue", value:"Bebas Neue" },
    { label:"Anton", value:"Anton" },
    { label:"Oswald", value:"Oswald" },
    { label:"Montserrat ExtraBold", value:"Montserrat" },
    { label:"Impact", value:"Impact" },
    { label:"Georgia", value:"Georgia" },
    { label:"Arial", value:"Arial" },
    { label:"Courier New", value:"Courier New" },
  ];
  const printSurcharge=199;
  const total=garment.price+printSurcharge;

  // --- DTF middleware isolated state ---
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState(null);
  const uploadedObjectUrlRef = useRef(null);
  const [dtf, setDtf] = useState({ selectedSheetPreset:"A3", stripColorHex:"#ffffff", stripSensitivity:30, halftoneDensity:0, printScale:1 });
  const [processedUrl, setProcessedUrl] = useState(null);
  // Source is uploaded image if present, else avatar imageUrl
  const rawSourceUrl = uploadedUrl || avatar?.imageUrl || null;
  // Server-fetchable URL for download (blob: URLs can't be fetched by Java) — prefer data: URL for uploads
  const downloadSourceUrl = uploadedDataUrl || avatar?.imageUrl || null;
  const sourceLabel = uploadedUrl ? "Uploaded image" : (avatar ? avatar.title : "—");
  const hasSource = !!rawSourceUrl;
  // Debounced realtime preview — does not reset garment/color/camera (isolated middleware)
  const debounceRef = useRef(null);
  useEffect(()=>{
    if(!rawSourceUrl){ setProcessedUrl(null); return; }
    clearTimeout(debounceRef.current);
    let cancelled=false;
    debounceRef.current=setTimeout(async ()=>{
      try{
        const out = await processDtfImage(rawSourceUrl, { stripColorHex: dtf.stripColorHex, stripSensitivity: dtf.stripSensitivity, halftoneDensity: dtf.halftoneDensity });
        if(!cancelled) setProcessedUrl(out || rawSourceUrl);
      } catch { if(!cancelled) setProcessedUrl(rawSourceUrl); }
    }, 120);
    return ()=>{ cancelled=true; clearTimeout(debounceRef.current); };
  }, [rawSourceUrl, dtf.stripColorHex, dtf.stripSensitivity, dtf.halftoneDensity]);

  const handleUpload = (file)=>{
    if(!file) return;
    if(uploadedObjectUrlRef.current) URL.revokeObjectURL(uploadedObjectUrlRef.current);
    const url = URL.createObjectURL(file);
    uploadedObjectUrlRef.current = url;
    setUploadedUrl(url);
    // Build data: URL for server-side high-res render (blob: URLs are browser-local and Java can't fetch them)
    const reader = new FileReader();
    reader.onload = () => setUploadedDataUrl(reader.result);
    reader.onerror = () => setUploadedDataUrl(null);
    reader.readAsDataURL(file);
  };
  const clearUpload = ()=>{
    if(uploadedObjectUrlRef.current){ URL.revokeObjectURL(uploadedObjectUrlRef.current); uploadedObjectUrlRef.current=null; }
    setUploadedUrl(null); setUploadedDataUrl(null); setProcessedUrl(null);
  };
  useEffect(()=>()=>{ if(uploadedObjectUrlRef.current) URL.revokeObjectURL(uploadedObjectUrlRef.current); },[]);
  // Viewer scale = user printScale × sheet factor (A4 ~28% smaller than A3 at same %). Maps to physical width.
  const dtfSheetVisualScale = (dtf.printScale ?? 1) * (dtf.selectedSheetPreset === "A4" ? 0.72 : 1.0);
  // Avatar to feed into 3D viewer — middleware output if processed, else raw
  const viewerAvatar = (()=> {
    if(uploadedUrl){
      return { id:"uploaded", title:"Uploaded", category:"Upload", imageUrl: processedUrl || uploadedUrl };
    }
    if(!avatar) return null;
    if(processedUrl) return Object.assign({}, avatar, { imageUrl: processedUrl, _originalImageUrl: avatar.imageUrl });
    return avatar;
  })();

  const reset=()=>{setGarment(garmentOptions[0]);setColor(colors[0]);setSize("M");setZone(zones[0]);setAvatar(null);setText("");setFont("Bebas Neue");setFontSize(96); clearUpload(); setDtf({selectedSheetPreset:"A3",stripColorHex:"#ffffff",stripSensitivity:30,halftoneDensity:0,printScale:1});};
  const add=()=>{
    if(!uploadedUrl && !avatar && !String(text).trim()){notify("Add an avatar, upload an image, or custom text");return;}
    const effectiveSourceUrl = uploadedUrl || avatar?.imageUrl || null;
    // Physical width in inches — garment-invariant (spec example: A3 @ 50% = 5.85)
    const sheet=getSheetPreset(dtf.selectedSheetPreset);
    const printWidthInches=computePrintWidthInches(dtf.selectedSheetPreset, dtf.printScale ?? 1);
    // Spec-exact required keys: selected_sheet_preset, print_width_inches, strip_color_hex, strip_sensitivity, halftone_density
    const dtf_print_parameters = hasSource ? {
      selected_sheet_preset: dtf.selectedSheetPreset,
      print_width_inches: printWidthInches,
      strip_color_hex: dtf.stripColorHex,
      strip_sensitivity: dtf.stripSensitivity,
      halftone_density: dtf.halftoneDensity,
      // Extras for lossless 300 DPI on demand (backward-compatible)
      print_scale: dtf.printScale ?? 1,
      sheet_width_inches: sheet.widthInches,
      sheet_height_inches: sheet.heightInches,
      source_type: uploadedUrl ? "upload" : "avatar",
      original_asset_url: uploadedDataUrl || rawSourceUrl,
      preview_data_url: processedUrl || uploadedDataUrl || rawSourceUrl
    } : null;
    addToCart({
      id:`studio-${Date.now()}`, productId:null, name:`MC Studio — ${garment.label}`, price:total, quantity:1, size,
      color:color.name, garmentType:garment.type, zone:zone.id,
      avatarId: avatar?.id ?? (uploadedUrl ? "upload" : null),
      avatarTitle: avatar?.title ?? (uploadedUrl ? "Uploaded" : null),
      image: processedUrl || effectiveSourceUrl || avatar?.imageUrl || null,
      originalImage: rawSourceUrl,
      customText:text, customFont:font, customFontSize:fontSize,
      custom:true, printSurcharge,
      dtf_print_parameters
    });
    notify("Custom design added to bag");
  };

  return <div className="mc-container py-8 sm:py-12">
    <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-400">MC Studio</p><h1 className="text-4xl font-black tracking-tight sm:text-5xl">Make it yours.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Configure your Phase 1 personalized apparel using curated avatars. No AI image generation or artwork uploads are used here.</p></div>
    <div className="grid gap-8 xl:grid-cols-[1.35fr_380px]">
      <div className="xl:sticky xl:top-24 xl:self-start">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-glow">
          <Suspense fallback={<div className="grid aspect-[4/5] place-items-center rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_28%,#fafafa_0%,#e4e4e7_45%,#a1a1aa_100%)] text-xs text-zinc-500">Loading 3D preview…</div>}>
            <TshirtViewer color={color.hex} avatar={viewerAvatar} zone={zone} text={text} font={font} fontSize={fontSize} printScale={dtfSheetVisualScale} />
          </Suspense>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-black/10 bg-white/55 px-4 py-3 backdrop-blur"><span className="text-xs text-zinc-600">{zone.label}</span><span className="text-xs font-semibold text-zinc-900">{money(total)}</span></div>
        </div>
      </div>

      <div className="space-y-5">
        <section className="mc-card p-5"><Step n="01" title="Garment"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{garmentOptions.map(g=><button key={g.type} onClick={()=>setGarment(g)} className={`rounded-xl border p-3 text-left transition ${garment.type===g.type?"border-violet-500 bg-violet-500/10":"border-white/10 bg-white/[.02]"}`}><span className="block text-sm font-semibold">{g.label}</span><span className="mt-1 block text-xs text-zinc-500">{money(g.price)}</span></button>)}</div></Step></section>
        <section className="mc-card p-5"><Step n="02" title="Color"><div className="flex flex-wrap gap-3">{colors.map(c=><button key={c.name} title={c.name} onClick={()=>setColor(c)} className={`rounded-full border p-1 ${color.name===c.name?"border-violet-500 ring-2 ring-violet-500/20":"border-white/10"}`}><span className="block h-9 w-9 rounded-full border border-white/10" style={{background:c.hex}}/></button>)}</div><div className="mt-3 text-xs text-zinc-500">{color.name}</div></Step></section>
        <section className="mc-card p-5"><Step n="03" title="Size"><div className="grid grid-cols-5 gap-2">{sizes.map(s=><button key={s} onClick={()=>setSize(s)} className={`rounded-xl border py-3 text-sm font-semibold ${size===s?"border-violet-500 bg-violet-500/10":"border-white/10"}`}>{s}</button>)}</div></Step></section>
        <section className="mc-card p-5"><Step n="04" title="Print zone"><div className="relative"><select value={zone.id} onChange={e=>setZone(zones.find(z=>z.id===e.target.value))} className="mc-input appearance-none">{zones.map(z=><option key={z.id} value={z.id}>{z.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-zinc-500" size={17}/></div></Step></section>
        <section className="mc-card p-5"><Step n="05" title="Choose avatar"><AvatarPicker selected={avatar} onSelect={setAvatar}/>{avatar && <div className="mt-4 flex items-center gap-3 rounded-xl bg-violet-500/10 p-3"><img src={avatar.imageUrl} className="h-10 w-10 rounded-lg bg-zinc-900 object-cover" alt=""/><div className="min-w-0"><div className="truncate text-sm font-semibold">{avatar.title}</div><div className="text-xs text-zinc-500">{avatar.category} · click avatar again to remove</div></div><Check className="ml-auto text-violet-400" size={18}/><button type="button" onClick={() => setAvatar(null)} aria-label="Remove avatar" className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-white"><X size={14} /></button></div>}{avatar && <button type="button" onClick={() => setAvatar(null)} className="mt-3 text-xs font-medium text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-white">Remove avatar</button>}</Step></section>
        <DtfPrintPanel value={dtf} onChange={setDtf} hasSource={hasSource} previewUrl={processedUrl} rawSourceUrl={downloadSourceUrl || rawSourceUrl} sourceLabel={sourceLabel} onUpload={handleUpload} onClearUpload={clearUpload} uploadedUrl={uploadedUrl} previewDataUrl={processedUrl} uploadedDataUrl={uploadedDataUrl} />
        <section className="mc-card p-5"><Step n="06" title="Custom text"><input value={text} onChange={e=>setText(e.target.value)} maxLength={24} placeholder="e.g. STAY METAL" className="mc-input w-full" style={{ fontFamily: `"${font}", sans-serif` }}/><div className="mt-3 grid gap-3"><div className="flex items-center gap-2"><span className="w-10 shrink-0 text-xs text-zinc-500">Font</span><div className="relative flex-1"><select value={font} onChange={e=>setFont(e.target.value)} className="mc-input appearance-none" style={{ fontFamily: `"${font}", sans-serif` }}>{fonts.map(f=><option key={f.value} value={f.value} style={{ fontFamily: `"${f.value}", sans-serif` }}>{f.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-zinc-500" size={17}/></div></div><div className="flex items-center gap-3"><span className="w-10 shrink-0 text-xs text-zinc-500">Size</span><input type="range" min={48} max={150} step={2} value={fontSize} onChange={e=>setFontSize(Number(e.target.value))} className="h-1 flex-1 appearance-none rounded-full bg-white/10 accent-violet-500"/><span className="w-10 text-right text-xs font-semibold tabular-nums text-zinc-300">{fontSize}px</span></div></div>{text ? <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm leading-tight" style={{ fontFamily: `"${font}", sans-serif`, fontSize: `${Math.max(11, Math.min(22, (fontSize/96)*16))}px`, fontWeight: font==="Montserrat"||font==="Oswald" ? 700 : 400 }}>{text}</div> : null}<p className="mt-2 text-[11px] text-zinc-600">Text is printed on the {zone.label.toLowerCase()} in the chosen font. Drag the slider to resize — updates live on the 3D model.</p></Step></section>
        <div className="mc-card p-5"><div className="flex justify-between text-sm"><span className="text-zinc-500">Base garment</span><span>{money(garment.price)}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-zinc-500">Custom print</span><span>{money(printSurcharge)}</span></div><div className="my-4 border-t border-white/10"/><div className="flex justify-between"><span className="font-semibold">Total</span><span className="text-lg font-bold">{money(total)}</span></div><button onClick={add} className="mc-btn-primary mt-5 w-full"><ShoppingBag size={17}/> Add custom design to bag</button><button onClick={reset} className="mc-btn-ghost mt-2 w-full"><RotateCcw size={15}/> Reset</button></div>
      </div>
    </div>
  </div>;
}
function Step({n,title,children}){return <><div className="mb-4 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-[10px] font-bold text-violet-300">{n}</span><h2 className="font-semibold">{title}</h2></div>{children}</>}
