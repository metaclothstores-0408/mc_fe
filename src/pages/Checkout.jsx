import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import { getOrders, makeId, money, saveOrders } from "../lib/storage";

export default function Checkout({cart, clearCart, notify}) {
  const navigate=useNavigate();
  const [form,setForm]=useState({name:"",phone:"",address:"",city:"",postalCode:""});
  const [placing,setPlacing]=useState(false);
  const total=cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const change=e=>setForm({...form,[e.target.name]:e.target.value});
  const place=()=>{
    if(!cart.length)return;
    if(Object.values(form).some(v=>!v.trim())){notify("Please complete all shipping fields");return;}
    setPlacing(true);
    setTimeout(()=>{
      const order={id:makeId("MC"),orderNumber:`MC${Date.now().toString().slice(-8)}`,userId:"local-user",totalAmount:total,status:"PLACED",shipping:form,items:cart,createdAt:new Date().toISOString()};
      saveOrders([order,...getOrders()]); clearCart(); navigate(`/orders/${order.id}`);
    },500);
  };
  if(!cart.length)return <div className="mc-container py-20 text-center"><h1 className="text-2xl font-bold">Nothing to checkout.</h1></div>;
  return <div className="mc-container py-10 sm:py-14"><button onClick={()=>navigate("/cart")} className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft size={16}/> Back to bag</button><div className="grid gap-8 lg:grid-cols-[1fr_380px]"><div><h1 className="text-4xl font-black">Checkout</h1><div className="mt-8 rounded-2xl border border-white/10 bg-[#18181B] p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-400">1</div><div><h2 className="font-semibold">Shipping information</h2><p className="text-xs text-zinc-500">Where should we deliver?</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Field name="name" label="Full name" value={form.name} onChange={change}/><Field name="phone" label="Phone number" value={form.phone} onChange={change}/><div className="sm:col-span-2"><Field name="address" label="Address" value={form.address} onChange={change}/></div><Field name="city" label="City" value={form.city} onChange={change}/><Field name="postalCode" label="Postal code" value={form.postalCode} onChange={change}/></div></div><div className="mt-4 rounded-2xl border border-white/10 bg-[#18181B] p-5 text-sm text-zinc-500"><LockKeyhole className="mb-2 text-emerald-400" size={18}/> Phase 1 payment is represented by a test checkout. Razorpay/Stripe can be integrated later without changing the shopping flow.</div></div><aside className="h-fit rounded-2xl border border-white/10 bg-[#18181B] p-5 lg:sticky lg:top-24"><h2 className="font-semibold">Review order</h2><div className="mt-5 space-y-3">{cart.map(i=><div key={i.id} className="flex gap-3 text-sm"><img src={i.image} className="h-14 w-12 rounded-lg object-cover" alt=""/><div className="min-w-0 flex-1"><div className="truncate">{i.name}</div><div className="text-xs text-zinc-500">Qty {i.quantity}</div></div><span>{money(i.price*i.quantity)}</span></div>)}</div><div className="my-5 border-t border-white/10"/><div className="flex justify-between text-lg font-bold"><span>Total</span><span>{money(total)}</span></div><button disabled={placing} onClick={place} className="mc-btn-primary mt-5 w-full">{placing?"Placing...":"Place test order"} <CheckCircle2 size={17}/></button></aside></div></div>;
}
function Field({label,name,value,onChange}){return <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">{label}</span><input required name={name} value={value} onChange={onChange} className="mc-input"/></label>}
