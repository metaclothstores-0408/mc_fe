import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Printer, 
  ExternalLink, 
  ArrowLeft,
  ShieldCheck,
  PhoneCall,
  Loader2
} from "lucide-react";
import { api } from "../lib/api";
import { getOrders, money } from "../lib/storage";

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("order") || searchParams.get("phone") || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (lookupQuery) => {
    const target = lookupQuery !== undefined ? lookupQuery : query;
    if (!target || !target.trim()) {
      setErrorMsg("Please enter an Order ID (e.g., MC-...) or 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setOrderData(null);

    const clean = target.trim();

    try {
      // 1. Query backend tracking endpoint
      const res = await api.trackOrder(clean);
      if (res && (res.orderNumber || res.id)) {
        setOrderData(res);
        setSearchParams({ order: res.orderNumber || clean });
        return;
      }
      throw new Error("No tracking info returned");
    } catch (err) {
      // 2. Check local browser orders fallback
      const local = getOrders().find(o => 
        (o.orderNumber && o.orderNumber.toLowerCase() === clean.toLowerCase()) ||
        String(o.id) === clean ||
        (o.shipping?.phone && o.shipping.phone.replace(/\D/g, "") === clean.replace(/\D/g, ""))
      );

      if (local) {
        const steps = [
          {
            status: "PLACED",
            title: "Order Confirmed & Paid",
            description: "Payment verified via Razorpay · Queued for Tirupur production",
            timestamp: local.createdAt ? new Date(local.createdAt).toLocaleString("en-IN") : "Just now",
            completed: true,
            current: local.status === "PLACED"
          },
          {
            status: "IN_PRINTING",
            title: "DTF Film Printing & Curing",
            description: "High-definition 300 DPI hot-melt transfer print onto 260+ GSM combed cotton blank",
            timestamp: local.status === "IN_PRINTING" ? "In progress at Tirupur Hub" : "Queued",
            completed: local.status === "IN_PRINTING" || local.status === "SHIPPED" || local.status === "DELIVERED",
            current: local.status === "IN_PRINTING"
          },
          {
            status: "SHIPPED",
            title: "Quality Inspected & Dispatched",
            description: "Packaged with branded tags and handed to express courier",
            timestamp: local.status === "SHIPPED" ? "Dispatched" : "Pending print completion",
            completed: local.status === "SHIPPED" || local.status === "DELIVERED",
            current: local.status === "SHIPPED"
          },
          {
            status: "DELIVERED",
            title: "Delivered to Destination",
            description: `Delivery to ${local.shipping?.city || "Customer destination"}`,
            timestamp: local.status === "DELIVERED" ? "Delivered" : "Estimated in 2-4 business days",
            completed: local.status === "DELIVERED",
            current: local.status === "DELIVERED"
          }
        ];

        setOrderData({
          orderNumber: local.orderNumber || `MC-${local.id}`,
          status: local.status || "PLACED",
          shippingName: local.shipping?.name || "Customer",
          city: local.shipping?.city || "Tirupur",
          postalCode: local.shipping?.postalCode || "638701",
          totalAmount: local.totalAmount || 0,
          courierPartner: "Delhivery Air Express",
          trackingNumber: "AWB" + local.id + "TRP",
          trackingUrl: "https://www.delhivery.com/track/package/AWB" + local.id + "TRP",
          timeline: steps,
          items: local.items || []
        });
        setSearchParams({ order: local.orderNumber || clean });
      } else {
        setErrorMsg(`We couldn't find any orders matching "${clean}". Please verify your order ID or mobile number.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  return (
    <div className="mc-container py-10 sm:py-14 max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/orders" 
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition font-mono"
        >
          <ArrowLeft size={15} /> Back to My Orders
        </Link>

        <span className="text-[11px] font-mono text-zinc-400">
          Tirupur Hub Live Dispatch
        </span>
      </div>

      {/* Main Header */}
      <div className="text-center sm:text-left mb-8 border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-mono mb-3">
          <Truck size={14} className="text-emerald-400" />
          <span>Real-time Order & DTF Production Tracking</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Track Your Atelier Order
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-400">
          Enter your Order Number (e.g. <span className="text-white font-mono">MC-8E92B4A1</span>) or 10-digit mobile number to view live manufacturing & shipment progress.
        </p>

        {/* Search Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Enter Order ID (MC-...) or Mobile (8903618021)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mc-input pl-11 py-3 text-xs sm:text-sm w-full font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mc-btn-primary px-7 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <span>Track Order</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Live Order Card */}
      {orderData && (
        <div className="space-y-6">
          {/* Order Details Header Card */}
          <div className="rounded-2xl border border-white/15 bg-[#121215] p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                  ORDER NUMBER
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
                  {orderData.orderNumber}
                </span>
                <span className="text-xs text-zinc-400 mt-1 block">
                  Recipient: <strong className="text-white">{orderData.shippingName}</strong> · {orderData.city}, {orderData.postalCode}
                </span>
              </div>

              <div className="sm:text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                  orderData.status === "DELIVERED"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : orderData.status === "SHIPPED"
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : orderData.status === "IN_PRINTING"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-white/10 text-zinc-200 border border-white/20"
                }`}>
                  <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  {orderData.status || "CONFIRMED"}
                </span>

                <div className="text-sm font-bold text-white font-mono mt-2">
                  Total: {money(orderData.totalAmount)}
                </div>
              </div>
            </div>

            {/* Courier / Shipping Dispatch Card */}
            {orderData.courierPartner && (
              <div className="mt-5 p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white shrink-0">
                    <Truck size={20} />
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px] font-mono">DELIVERY PARTNER</span>
                    <span className="font-semibold text-white text-sm">{orderData.courierPartner}</span>
                    <span className="text-[11px] font-mono text-zinc-400 block">AWB: {orderData.trackingNumber}</span>
                  </div>
                </div>

                {orderData.trackingUrl && (
                  <a
                    href={orderData.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition"
                  >
                    <span>Courier Live Portal</span>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Stepper Progress Timeline */}
          <div className="rounded-2xl border border-white/15 bg-[#121215] p-5 sm:p-7">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              <span>Production & Delivery Timeline</span>
            </h2>

            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[15px] sm:before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
              {orderData.timeline && orderData.timeline.map((step, idx) => {
                const isCompleted = step.completed;
                const isCurrent = step.current;

                return (
                  <div key={idx} className="relative group">
                    {/* Step Icon Indicator */}
                    <div className={`absolute -left-[31px] sm:-left-[35px] top-0 grid h-8 w-8 place-items-center rounded-full border-2 transition ${
                      isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : isCurrent
                        ? "border-white bg-[#121215] text-white ring-4 ring-white/10"
                        : "border-white/20 bg-[#121215] text-zinc-600"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 size={16} strokeWidth={2.5} />
                      ) : step.status === "IN_PRINTING" ? (
                        <Printer size={14} />
                      ) : step.status === "SHIPPED" ? (
                        <Truck size={14} />
                      ) : (
                        <Package size={14} />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className={`text-sm font-bold ${isCompleted || isCurrent ? "text-white" : "text-zinc-500"}`}>
                          {step.title}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {step.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed max-w-xl">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Garments & Artworks in this Order */}
          {orderData.items && orderData.items.length > 0 && (
            <div className="rounded-2xl border border-white/15 bg-[#121215] p-5 sm:p-7">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <Package size={16} />
                <span>Custom Garments in this Order</span>
              </h2>

              <div className="divide-y divide-white/10">
                {orderData.items.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                    {item.previewRenderUrl || item.image ? (
                      <img
                        src={item.previewRenderUrl || item.image}
                        alt=""
                        className="h-16 w-14 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-zinc-400 shrink-0">
                        01
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-xs sm:text-sm truncate">
                        {item.name || "SHADE 01 Custom Boxy Tee"}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Qty: {item.quantity} · {money(item.unitPrice || 0)} each
                      </div>
                      {item.printConfigJson && (
                        <span className="inline-block mt-1 text-[10px] text-emerald-400 font-mono">
                          Tirupur DTF 300 DPI Heat Press Certified
                        </span>
                      )}
                    </div>

                    <div className="text-right font-mono text-sm font-bold text-white">
                      {money((item.unitPrice || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Support Footer */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <PhoneCall size={14} className="text-emerald-400" />
              <span>Need priority assistance with your shipment?</span>
            </div>
            <a 
              href="mailto:support@metacloth.local"
              className="text-white font-semibold hover:underline"
            >
              Contact Tirupur Dispatch Desk
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
