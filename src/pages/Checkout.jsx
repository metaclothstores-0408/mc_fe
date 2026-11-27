import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import { getOrders, makeId, money, saveOrders } from "../lib/storage";
import { api } from "../lib/api";
import { loadRazorpayScript } from "../lib/razorpay";
import ShippingAddressManager from "../components/ShippingAddressManager";

export default function Checkout({ cart, clearCart, notify }) {
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [placing, setPlacing] = useState(false);
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  function buildPayload() {
    if (!selectedAddress) return null;

    const formattedAddress = [
      selectedAddress.address,
      selectedAddress.landmark ? `Landmark: ${selectedAddress.landmark}` : null,
      selectedAddress.state ? selectedAddress.state : null
    ].filter(Boolean).join(", ");

    return {
      shippingName: selectedAddress.name.trim(),
      shippingPhone: selectedAddress.phone.trim(),
      shippingAddressLine: formattedAddress,
      city: selectedAddress.city.trim(),
      postalCode: selectedAddress.postalCode.trim(),
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
    if (!selectedAddress || !selectedAddress.name || !selectedAddress.phone || !selectedAddress.address || !selectedAddress.city || !selectedAddress.postalCode) {
      notify("Please select or add a complete delivery address");
      return;
    }

    setPlacing(true);
    const payload = buildPayload();

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay gateway could not be loaded. Please check your connection.");
      }

      // 1. Initialize Razorpay order on backend (supports both authenticated and guest phone checkouts)
      const initRes = await api.createPaymentOrder(payload);

      // 2. Open Razorpay Standard Checkout popup
      const options = {
        key: initRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_U4S578cquj6qKR",
        amount: initRes.amount,
        currency: initRes.currency || "INR",
        name: "SHADE 01",
        description: "Custom Apparel Order · Tirupur Hub",
        order_id: initRes.razorpayOrderId,
        prefill: {
          name: selectedAddress.name,
          contact: selectedAddress.phone,
        },
        theme: {
          color: "#09090b",
        },
        handler: async function (response) {
          try {
            // 3. Verify HMAC signature & finalize order on backend
            const verifyRes = await api.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            const res = verifyRes.order;
            const order = {
              id: String(res.id),
              orderNumber: res.orderNumber,
              userId: "api-user",
              totalAmount: Number(res.totalAmount),
              status: res.status,
              shipping: {
                name: selectedAddress.name,
                phone: selectedAddress.phone,
                address: selectedAddress.address,
                landmark: selectedAddress.landmark,
                city: selectedAddress.city,
                state: selectedAddress.state,
                postalCode: selectedAddress.postalCode,
              },
              items: cart,
              createdAt: new Date().toISOString(),
              apiResponse: res,
            };
            saveOrders([order, ...getOrders()]);
            clearCart();
            navigate(`/orders/${order.id}`);
            notify("Payment successful! SHADE 01 Tirupur production queued");
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            notify("Payment verification failed: " + verifyErr.message);
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPlacing(false);
            notify("Payment window closed");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        console.error("Razorpay payment failed:", resp.error);
        notify("Payment failed: " + (resp.error?.description || "Declined"));
        setPlacing(false);
      });
      rzp.open();
    } catch (e) {
      console.warn("Payment error:", e.message);
      notify(e.message || "Failed to initiate payment");
      setPlacing(false);
    }
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
            <ShippingAddressManager
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              notify={notify}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#121215] p-5 text-xs text-zinc-400">
            <div className="flex items-center gap-2 mb-1.5 text-white font-semibold">
              <LockKeyhole size={15} className="text-emerald-400" />
              <span>Secure Fulfillment from Tirupur Hub</span>
            </div>
            <span>All orders are manufactured with 260+ GSM combed cotton and dispatched with live tracking. Test checkout mode enabled.</span>
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
                    01
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

          {selectedAddress && (
            <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/5 text-[11px] text-zinc-300">
              <span className="text-zinc-500 font-mono block text-[10px] uppercase font-bold mb-1">Delivering to:</span>
              <span className="font-semibold text-white">{selectedAddress.name}</span> · {selectedAddress.city}, {selectedAddress.postalCode}
            </div>
          )}

          <button 
            disabled={placing} 
            onClick={place} 
            className="mc-btn-primary mt-6 w-full text-xs flex items-center justify-center gap-2"
          >
            {placing ? "Processing Payment..." : `Pay ${money(total)} via UPI / Cards`} 
            <CheckCircle2 size={16} />
          </button>
        </aside>
      </div>
    </div>
  );
}
