import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import { getOrders, makeId, money, saveOrders } from "../lib/storage";
import { api } from "../lib/api";

export default function Checkout({ cart, clearCart, notify }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", postalCode: "" });
  const [placing, setPlacing] = useState(false);
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  function buildPayload() {
    return {
      shippingName: form.name,
      shippingPhone: form.phone,
      shippingAddressLine: form.address,
      city: form.city,
      postalCode: form.postalCode,
      items: cart.map(i => {
        const dtf = i.dtf_print_parameters || null;
        const cfg = {
          zone: i.zone || null,
          customText: i.customText || null,
          customFont: i.customFont || null,
          customFontSize: i.customFontSize || null,
          garmentType: i.garmentType || null,
          color: i.color || null,
          size: i.size || "L"
        };
        if (dtf) cfg.dtf_print_parameters = dtf;
        return {
          productVariantId: i.productVariantId || i.variantId || 401,
          avatarId: typeof i.avatarId === "number" ? i.avatarId : null,
          quantity: i.quantity || 1,
          unitPrice: i.price,
          printConfigJson: JSON.stringify(cfg),
          previewRenderUrl: i.image || i.previewRenderUrl || null
        };
      })
    };
  }

  const place = async () => {
    if (!cart.length) return;
    if (Object.values(form).some(v => !v.trim())) {
      notify("Please complete all shipping fields");
      return;
    }
    setPlacing(true);
    const payload = buildPayload();
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const res = await api.createOrder(payload);
        const order = {
          id: String(res.id),
          orderNumber: res.orderNumber,
          userId: "api-user",
          totalAmount: Number(res.totalAmount),
          status: res.status,
          shipping: form,
          items: cart,
          createdAt: new Date().toISOString(),
          apiResponse: res
        };
        saveOrders([order, ...getOrders()]);
        clearCart();
        navigate(`/orders/${order.id}`);
        notify("Order placed — B&D Tirupur production queued");
        return;
      } catch (e) {
        console.warn("Backend order failed, local fallback:", e.message);
      }
    }
    setTimeout(() => {
      const order = {
        id: makeId("BD"),
        orderNumber: `BD${Date.now().toString().slice(-8)}`,
        userId: "local-user",
        totalAmount: total,
        status: "PLACED",
        shipping: form,
        items: cart,
        createdAt: new Date().toISOString(),
        dtfPayload: payload
      };
      saveOrders([order, ...getOrders()]);
      clearCart();
      navigate(`/orders/${order.id}`);
      setPlacing(false);
      notify("Order placed — B&D Tirupur production queued");
    }, 500);
  };

  if (!cart.length) return (
    <div className="mc-container py-20 text-center">
      <h1 className="text-2xl font-bold text-white">Nothing to checkout.</h1>
    </div>
  );

  return (
    <div className="mc-container py-10 sm:py-14">
      <button 
        onClick={() => navigate("/cart")} 
        className="mb-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition"
      >
        <ArrowLeft size={15} /> Back to bag
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Checkout</h1>
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white font-bold text-xs">
                01
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">Shipping Information</h2>
                <p className="text-xs text-zinc-400">Where should we deliver your B&D order?</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Full name" value={form.name} onChange={change} />
              <Field name="phone" label="Phone number" value={form.phone} onChange={change} />
              <div className="sm:col-span-2">
                <Field name="address" label="Street Address" value={form.address} onChange={change} />
              </div>
              <Field name="city" label="City" value={form.city} onChange={change} />
              <Field name="postalCode" label="Postal code (PIN)" value={form.postalCode} onChange={change} />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#121215] p-5 text-xs text-zinc-400">
            <div className="flex items-center gap-2 mb-1.5 text-white font-semibold">
              <LockKeyhole size={15} className="text-emerald-400" />
              <span>Secure Fulfillment from Tirupur Hub</span>
            </div>
            <span>All orders are manufactured with 240+ GSM combed cotton and dispatched with live tracking. Test checkout mode enabled.</span>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-[#121215] p-6 lg:sticky lg:top-24">
          <h2 className="font-bold text-white text-sm uppercase tracking-wider">Review Order</h2>
          <div className="mt-5 space-y-3">
            {cart.map(i => (
              <div key={i.id} className="flex gap-3 text-xs">
                {i.image ? (
                  <img src={i.image} className="h-12 w-10 rounded-lg object-cover border border-white/5 shrink-0" alt="" />
                ) : (
                  <div className="h-12 w-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                    B&D
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{i.name}</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {i.color} · Size {i.size} · Qty {i.quantity}
                  </div>
                </div>
                <span className="font-mono text-zinc-300 font-semibold">{money(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="my-5 border-t border-white/10" />
          <div className="flex justify-between text-base font-bold text-white font-mono">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          <button 
            disabled={placing} 
            onClick={place} 
            className="mc-btn-primary mt-6 w-full text-xs flex items-center justify-center gap-2"
          >
            {placing ? "Processing..." : "Place Order (Test)"} 
            <CheckCircle2 size={16} />
          </button>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      <input required name={name} value={value} onChange={onChange} className="mc-input text-xs" />
    </label>
  );
}
