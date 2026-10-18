import { Link, useParams } from "react-router-dom";
import { Check, ChevronLeft, Clock3, PackageCheck, Printer, Truck } from "lucide-react";
import { getOrders, money } from "../lib/storage";
import { api } from "../lib/api";
import { useEffect, useMemo, useState } from "react";

const stages=[["PLACED","Order placed",Clock3],["IN_PRINTING","In printing",Printer],["SHIPPED","Shipped",Truck],["DELIVERED","Delivered",PackageCheck]];

export default function OrderDetail(){
 const {id}=useParams();
 const localOrder=useMemo(()=>getOrders().find(o=>String(o.id)===String(id)),[id]);
 const [liveOrder,setLiveOrder]=useState(null);

 useEffect(()=>{
   let cancelled = false;
   const token = localStorage.getItem("accessToken");
   if(token && id && !String(id).startsWith("MC-")){
     api.trackOrder(id).then(trackRes=>{
       if(cancelled) return;
       if(trackRes && trackRes.status){
         setLiveOrder(prev => ({
           ...(prev || localOrder || {}),
           status: trackRes.status,
           orderNumber: trackRes.orderNumber,
           timeline: trackRes.timeline
         }));
       }
     }).catch(()=>{});

     api.myOrders().then(all=>{
       if(cancelled || !Array.isArray(all)) return;
       const found = all.find(o => String(o.id) === String(id));
       if(found) setLiveOrder(prev => ({ ...(prev || {}), ...found }));
     }).catch(()=>{});
   }
   return ()=>{ cancelled = true; };
 },[id, localOrder]);

 const order = liveOrder || localOrder;
 if(!order)return <div className="mc-container py-20"><h1 className="text-2xl font-bold">Order not found.</h1><Link to="/orders" className="mt-5 inline-block text-violet-400">Back to orders</Link></div>;

 const status = order.status || order.orderStatus || "PLACED";
 const current=stages.findIndex(s=>s[0]===status);
 const shippingName = order.shipping?.name || order.shippingName || "Customer";
 const shippingAddress = order.shipping?.address || order.shippingAddressLine || "—";
 const shippingCity = order.shipping?.city || order.city || "—";
 const shippingPostal = order.shipping?.postalCode || order.postalCode || "—";
 const shippingPhone = order.shipping?.phone || order.shippingPhone || "—";
 const items = order.items || [];

 return <div className="mc-container py-10 sm:py-14"><Link to="/orders" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ChevronLeft size={16}/> Orders</Link><div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs text-zinc-500">Order</p><h1 className="mt-1 text-3xl font-black">{order.orderNumber}</h1></div><div className="text-sm text-zinc-500">{order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "Recent"}</div></div><div className="mt-8 rounded-2xl border border-white/10 bg-[#18181B] p-5 sm:p-8"><h2 className="font-semibold">Fulfillment status</h2><div className="mt-8 grid gap-5 sm:grid-cols-4">{stages.map(([key,label,Icon],i)=><div key={key} className="relative"><div className={`flex items-center gap-3 ${i<=current?"text-white":"text-zinc-600"}`}><div className={`grid h-10 w-10 place-items-center rounded-xl ${i<=current?"bg-violet-600":"bg-white/5"}`}>{i<current?<Check size={17}/>:<Icon size={17}/>}</div><div><div className="text-sm font-semibold">{label}</div><div className="text-[10px] text-zinc-600">{i<=current?"Complete":"Pending"}</div></div></div>{i<3&&<div className={`my-3 h-px sm:absolute sm:left-10 sm:right-[-20px] sm:top-5 sm:my-0 ${i<current?"bg-violet-500":"bg-white/10"}`}/>}</div>)}</div></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-[#18181B] p-5"><h2 className="font-semibold">Items</h2><div className="mt-5 space-y-4">{items.map((i,idx)=><div key={i.id || idx} className="flex gap-3"><img src={i.image || i.previewRenderUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"} className="h-20 w-16 rounded-xl object-cover" alt=""/><div className="flex-1"><div className="text-sm font-semibold">{i.name || "Custom Apparel"}</div><div className="mt-1 text-xs text-zinc-500">Qty {i.quantity || 1} {i.size ? `· ${i.size}` : ""} {i.color ? `· ${i.color}` : ""}</div>{i.custom&&<div className="mt-1 text-xs text-violet-400">Avatar: {i.avatarTitle || "Custom Print"}</div>}</div><span className="text-sm font-semibold">{money((i.price || i.unitPrice || 0)*(i.quantity || 1))}</span></div>)}</div></div><div className="rounded-2xl border border-white/10 bg-[#18181B] p-5"><h2 className="font-semibold">Delivery</h2><p className="mt-4 text-sm leading-6 text-zinc-400">{shippingName}<br/>{shippingAddress}<br/>{shippingCity} — {shippingPostal}<br/>{shippingPhone}</p><div className="my-5 border-t border-white/10"/><div className="flex justify-between font-bold"><span>Total</span><span>{money(order.totalAmount)}</span></div></div></div></div>;
}