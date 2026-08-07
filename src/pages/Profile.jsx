import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveUser } from "../lib/storage";

export default function Profile({user,setUser,notify}){
 const [name,setName]=useState(user?.full_name||"");
 const [phone,setPhone]=useState(user?.phone_number||"");
 const nav=useNavigate();
 const save=()=>{const u={...(user||{}),full_name:name,phone_number:phone};saveUser(u);setUser(u);notify("Profile saved");};
 return <div className="mc-container max-w-3xl py-10 sm:py-14"><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-400">Account</p><h1 className="text-4xl font-black">Profile</h1><div className="mt-8 rounded-2xl border border-white/10 bg-[#18181B] p-5 sm:p-7"><div className="grid gap-5"><label><span className="mb-2 block text-xs text-zinc-400">Full name</span><input className="mc-input" value={name} onChange={e=>setName(e.target.value)}/></label><label><span className="mb-2 block text-xs text-zinc-400">Phone number</span><input className="mc-input" value={phone} onChange={e=>setPhone(e.target.value)}/></label><label><span className="mb-2 block text-xs text-zinc-400">Email</span><input className="mc-input opacity-60" value={user?.email||"demo@metacloth.local"} readOnly/></label></div><button onClick={save} className="mc-btn-primary mt-6">Save profile</button></div><div className="mt-4 flex gap-3"><button onClick={()=>nav("/orders")} className="mc-btn-secondary">View orders</button><button onClick={()=>{localStorage.clear();setUser(null);nav("/")}} className="mc-btn-ghost">Clear local demo data</button></div></div>;
}