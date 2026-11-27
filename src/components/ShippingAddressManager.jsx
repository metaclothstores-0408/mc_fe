import { useState, useEffect } from "react";
import { 
  MapPin, 
  Plus, 
  Check, 
  Edit2, 
  Trash2, 
  Home, 
  Briefcase, 
  Navigation, 
  Loader2, 
  CheckCircle2, 
  X,
  Building
} from "lucide-react";
import { getSavedAddresses, saveAddress, deleteAddress, getDefaultAddress, getUser } from "../lib/storage";

export default function ShippingAddressManager({ selectedAddress, onSelectAddress, notify }) {
  const [addresses, setAddresses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const emptyForm = {
    name: "",
    phone: "",
    address: "",
    landmark: "",
    city: "",
    state: "Tamil Nadu",
    postalCode: "",
    tag: "HOME",
    isDefault: false
  };

  const [formData, setFormData] = useState(emptyForm);

  // Load saved addresses on mount
  useEffect(() => {
    const list = getSavedAddresses();
    setAddresses(list);

    if (list.length > 0) {
      const def = getDefaultAddress();
      if (!selectedAddress && def) {
        onSelectAddress(def);
      }
    } else {
      // If no saved addresses, prefill name & phone from user if logged in
      const u = getUser();
      if (u) {
        setFormData(prev => ({
          ...prev,
          name: u.fullName || "",
          phone: u.phoneNumber ? u.phoneNumber.replace(/^\+91/, "") : ""
        }));
      }
      setIsFormOpen(true);
    }
  }, []);

  const handleSelect = (addr) => {
    onSelectAddress(addr);
    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    const u = getUser();
    setFormData({
      ...emptyForm,
      name: u?.fullName || (selectedAddress?.name || ""),
      phone: u?.phoneNumber ? u.phoneNumber.replace(/^\+91/, "") : (selectedAddress?.phone || "")
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr, e) => {
    e.stopPropagation();
    setEditingId(addr.id);
    setFormData({
      name: addr.name || "",
      phone: addr.phone || "",
      address: addr.address || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "Tamil Nadu",
      postalCode: addr.postalCode || "",
      tag: addr.tag || "HOME",
      isDefault: !!addr.isDefault
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updated = deleteAddress(id);
    setAddresses(updated);
    if (selectedAddress?.id === id) {
      const next = updated.find(a => a.isDefault) || updated[0] || null;
      onSelectAddress(next);
      if (!next) setIsFormOpen(true);
    }
    if (notify) notify("Address removed.");
  };

  // GPS Location Detect using browser Geolocation + OpenStreetMap Reverse Geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      if (notify) notify("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          const addr = data.address || {};

          const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || "Tirupur";
          const detectedState = addr.state || "Tamil Nadu";
          const detectedPin = addr.postcode || "";
          const streetParts = [
            addr.building,
            addr.house_number,
            addr.road,
            addr.suburb,
            addr.neighbourhood
          ].filter(Boolean).join(", ");

          setFormData(prev => ({
            ...prev,
            address: streetParts || prev.address,
            city: detectedCity,
            state: detectedState,
            postalCode: detectedPin || prev.postalCode
          }));

          if (notify) {
            notify(`📍 Location matched: ${detectedCity}, ${detectedState} ${detectedPin ? "(" + detectedPin + ")" : ""}`);
          }
        } catch (err) {
          console.warn("Location geocode notice:", err.message);
          if (notify) notify("Could not pinpoint exact street. Please verify city & PIN.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        console.warn("Geolocation permission error:", err.message);
        if (notify) notify("Location access denied or unavailable. Please type your address.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
      if (notify) notify("Please fill in all required shipping address fields.");
      return;
    }

    const payload = {
      id: editingId || `addr-${Date.now()}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      landmark: formData.landmark.trim(),
      city: formData.city.trim(),
      state: formData.state.trim() || "Tamil Nadu",
      postalCode: formData.postalCode.trim(),
      tag: formData.tag,
      isDefault: formData.isDefault
    };

    const updated = saveAddress(payload);
    setAddresses(updated);
    onSelectAddress(payload);
    setIsFormOpen(false);
    setEditingId(null);
    if (notify) notify(editingId ? "Address updated." : "Address saved & selected.");
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white font-bold text-xs">
            01
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Shipping Information</h2>
            <p className="text-xs text-zinc-400">Choose delivery destination from saved addresses</p>
          </div>
        </div>

        {!isFormOpen && addresses.length > 0 && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-xs font-medium text-white hover:bg-white/10 transition"
          >
            <Plus size={14} /> Add Address
          </button>
        )}
      </div>

      {/* Saved Addresses List */}
      {!isFormOpen && addresses.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 mt-4">
          {addresses.map((addr) => {
            const isSelected = selectedAddress?.id === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => handleSelect(addr)}
                className={`relative cursor-pointer rounded-2xl border p-4 transition text-left flex flex-col justify-between ${
                  isSelected
                    ? "border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                    : "border-white/10 bg-[#16161a] hover:border-white/20 hover:bg-[#1a1a1f]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-zinc-200">
                        {addr.tag === "WORK" ? <Briefcase size={10} /> : addr.tag === "OTHER" ? <Building size={10} /> : <Home size={10} />}
                        {addr.tag || "HOME"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-white text-black flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-bold text-white mb-0.5">{addr.name}</div>
                  <div className="text-xs font-mono text-zinc-400 mb-2">{addr.phone}</div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {addr.address}
                    {addr.landmark && (
                      <span className="block text-[11px] text-zinc-400 font-mono mt-0.5">
                        Landmark: {addr.landmark}
                      </span>
                    )}
                    <span className="block font-medium text-white/90 mt-0.5">
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </span>
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                  <span className="text-[11px] font-mono">
                    {isSelected ? "Deliver here" : "Click to select"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(addr, e)}
                      className="p-1 hover:text-white transition"
                      title="Edit address"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(addr.id, e)}
                      className="p-1 hover:text-rose-400 transition"
                      title="Delete address"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Address Form Modal or Section */}
      {isFormOpen && (
        <form onSubmit={handleSubmitForm} className="mt-4 rounded-2xl border border-white/15 bg-[#141418] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin size={16} className="text-white" />
              {editingId ? "Edit Delivery Address" : "Add New Delivery Address"}
            </h3>

            <div className="flex items-center gap-2">
              {/* GPS Auto-Detect Button */}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {detectingLocation ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-white" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={13} className="text-emerald-400" />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>

              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white transition rounded-lg hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Karthick C"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="mc-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Mobile Number (10 digits) *</label>
              <input
                required
                type="tel"
                placeholder="e.g. 8903618021"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="mc-input text-xs w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Flat, House No., Building, Street Address *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 12/A, Puthuvinayagar Kovil Theru"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="mc-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Landmark (Optional, for speedy courier dispatch)
              </label>
              <input
                type="text"
                placeholder="e.g. Near Vinayagar Kovil, Opp Bus Stand"
                value={formData.landmark}
                onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                className="mc-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">City / District *</label>
              <input
                required
                type="text"
                placeholder="e.g. Tirupur"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="mc-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">State *</label>
              <input
                required
                type="text"
                placeholder="e.g. Tamil Nadu"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="mc-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">PIN / Postal Code (6 digits) *</label>
              <input
                required
                type="text"
                maxLength={6}
                placeholder="e.g. 638701"
                value={formData.postalCode}
                onChange={e => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, "") })}
                className="mc-input text-xs w-full font-mono"
              />
            </div>
          </div>

          {/* Address Tag Selector & Default Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium mr-1">Address Type:</span>
              {["HOME", "WORK", "OTHER"].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, tag: t })}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    formData.tag === t
                      ? "bg-white text-black"
                      : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-white/20 bg-white/10 text-white focus:ring-0"
              />
              <span>Set as default shipping address</span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="mc-btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>{editingId ? "Save Changes" : "Save & Deliver to this Address"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
