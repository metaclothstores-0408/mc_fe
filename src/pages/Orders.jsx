import { Link } from "react-router-dom";
import { ChevronRight, PackageOpen } from "lucide-react";
import { getOrders, money } from "../lib/storage";
import { api } from "../lib/api";
import { useEffect, useState } from "react";

export default function Orders(){
  const [orders,setOrders]=useState([]);
  useEffect(()=>{
    let cancelled = false;
    const token = localStorage.getItem("accessToken");
    if(token){
      api.myOrders().then(res=>{
        if(cancelled) return;
        if(Array.isArray(res) && res.length>0){
          setOrders(res);
        } else {
          setOrders(getOrders());
        }
      }).catch(()=>{
        if(!cancelled) setOrders(getOrders());
      });
    } else {
      setOrders(getOrders());
    }
    return ()=>{ cancelled = true; };
  },[]);
  return <div className="mc-container py-10 sm:py-14"><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-400">Account</p><h1 className="text-4xl font-black">Your Orders</h1>{!orders.length?<div className="py-20 text-center"><PackageOpen className="mx-auto text-zinc-700" size={48}/><p className="mt-5 text-zinc-500">No orders yet.</p><Link to="/shop" className="mc-btn-primary mt-6">Start shopping</Link></div>:<div className="mt-8 space-y-3">{orders.map(o=><Link key={o.id} to={`/orders/${o.id}`} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#18181B] p-5 transition hover:border-white/20 sm:flex-row sm:items-center"><div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-400"><PackageOpen size={20}/></div><div className="min-w-0 flex-1"><div className="font-semibold">{o.orderNumber}</div><div className="mt-1 text-xs text-zinc-500">{new Date(o.createdAt).toLocaleString("en-IN")}</div></div><div className="sm:text-right"><div className="font-semibold">{money(o.totalAmount)}</div><span className="mt-1 inline-block rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300">{o.status}</span></div><ChevronRight className="hidden text-zinc-600 sm:block" size={18}/></Link>)}</div>}</div>;
}