import { useState } from "react";
import { LockKeyhole, ShieldCheck, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { saveUser } from "../lib/storage";

export default function AdminLogin({ setUser }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = () => {
    const admin = { id: "local-admin", full_name: "MetaCloth Admin", email: email || "admin@metacloth.local", role: "ADMIN", auth_provider: "ADMIN" };
    saveUser(admin);
    setUser(admin);
    nav("/admin");
  };

  return <div className="min-h-screen bg-[#070708] text-zinc-100">
    <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center text-2xl font-black tracking-tight">MC<span className="text-violet-500">.</span></Link>
        <div className="rounded-3xl border border-violet-500/20 bg-[#111113] p-6 shadow-2xl shadow-violet-950/10 sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-500/20 bg-violet-500/10"><LockKeyhole className="text-violet-400" size={23}/></div>
          <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[.25em] text-violet-400">Restricted access</p>
          <h1 className="mt-2 text-center text-2xl font-black">Admin Control Desk</h1>
          <p className="mt-2 text-center text-sm text-zinc-500">Operations, inventory and order fulfillment.</p>
          <input className="mc-input mt-7" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email" type="email" />
          <input className="mc-input mt-3" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
          <button onClick={login} className="mc-btn-primary mt-4 w-full">Enter Control Desk <ArrowRight size={17}/></button>
          <div className="mt-5 flex gap-2 rounded-xl border border-white/5 bg-white/[.02] p-3 text-xs leading-5 text-zinc-600"><ShieldCheck size={15} className="mt-0.5 shrink-0"/> Demo frontend login. Real admin credentials and JWT role authorization will be enforced by Spring Security later.</div>
          <Link to="/signin" className="mt-6 block text-center text-xs text-zinc-600 hover:text-zinc-300">← Back to customer sign in</Link>
        </div>
      </div>
    </div>
  </div>;
}
