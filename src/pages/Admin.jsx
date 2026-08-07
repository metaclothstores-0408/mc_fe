import {
  BarChart3,
  Box,
  ClipboardList,
  IndianRupee,
  PackageCheck,
  Image,
  Plus,
  ArrowRight,
  LogOut,
} from "lucide-react";

import { getOrders, money, logoutUser } from "../lib/storage";
import { products } from "../data/mock";
import { Link, useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();

  const orders = getOrders();

  const revenue = orders.reduce(
    (s, o) => s + Number(o.totalAmount || 0),
    0
  );

  const stats = [
    ["Revenue", money(revenue), IndianRupee],
    ["Orders", orders.length, ClipboardList],
    ["Products", products.length, Box],
    [
      "Delivered",
      orders.filter((o) => o.status === "DELIVERED").length,
      PackageCheck,
    ],
  ];

  const logout = () => {
    logoutUser();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#070708]">

      {/* HEADER */}
      <div className="border-b border-white/10 bg-[#0B0B0C]">
        <div className="mc-container flex h-16 items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-xs font-black">
              MC
            </div>

            <div>
              <div className="text-sm font-bold">
                Admin Control Desk
              </div>

              <div className="text-[10px] uppercase tracking-widest text-zinc-600">
                Operations
              </div>
            </div>

          </div>

          <div className="flex items-center gap-5">

            <Link
              to="/"
              className="text-xs text-zinc-500 hover:text-white"
            >
              Visit Store
            </Link>

            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400"
            >
              <LogOut size={14} />
              Logout
            </button>

          </div>

        </div>
      </div>


      {/* MAIN */}
      <div className="mc-container py-10 sm:py-14">

        {/* TITLE */}
        <div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-400">
            Control Desk
          </p>

          <h1 className="text-4xl font-black">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            Manage your MetaCloth store, products, avatars and orders.
          </p>

        </div>


        {/* ADMIN ACTIONS */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* PRODUCTS */}
          <Link
            to="/admin/products"
            className="group rounded-2xl border border-white/10 bg-[#18181B] p-6 transition hover:border-violet-500/40 hover:bg-[#1C1C20]"
          >

            <div className="flex items-start justify-between">

              <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
                <Box size={22} />
              </div>

              <ArrowRight
                size={18}
                className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-violet-400"
              />

            </div>

            <h2 className="mt-5 text-lg font-bold">
              Product Management
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Add products, manage pricing, garment types and activate or deactivate products.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-violet-400">
              <Plus size={15} />
              Manage Products
            </div>

          </Link>


          {/* AVATARS */}
          <Link
            to="/admin/avatars"
            className="group rounded-2xl border border-white/10 bg-[#18181B] p-6 transition hover:border-violet-500/40 hover:bg-[#1C1C20]"
          >

            <div className="flex items-start justify-between">

              <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
                <Image size={22} />
              </div>

              <ArrowRight
                size={18}
                className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-violet-400"
              />

            </div>

            <h2 className="mt-5 text-lg font-bold">
              Avatar Management
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Add preset avatars, manage avatar categories and activate or deactivate avatars.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-violet-400">
              <Plus size={15} />
              Manage Avatars
            </div>

          </Link>

        </div>


        {/* STATISTICS */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

          {stats.map(([label, value, Icon]) => (

            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-[#18181B] p-5"
            >

              <Icon
                className="text-violet-400"
                size={19}
              />

              <div className="mt-5 text-2xl font-black">
                {value}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                {label}
              </div>

            </div>

          ))}

        </div>


        {/* ORDER PROCESSING */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#18181B] p-5">

          <div className="flex items-center gap-3">

            <BarChart3 className="text-violet-400" />

            <h2 className="font-semibold">
              Order processing desk
            </h2>

          </div>


          {orders.length === 0 ? (

            <p className="py-12 text-center text-sm text-zinc-600">
              Orders created from the frontend checkout will appear here.
            </p>

          ) : (

            <div className="mt-5 overflow-x-auto">

              <table className="w-full min-w-[650px] text-left text-sm">

                <thead className="text-xs uppercase text-zinc-600">

                  <tr>
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>

                </thead>

                <tbody>

                  {orders.map((o) => (

                    <tr
                      key={o.id}
                      className="border-t border-white/5"
                    >

                      <td className="py-4 font-semibold">
                        {o.orderNumber}
                      </td>

                      <td className="py-4 text-zinc-400">
                        {o.shipping.name}
                      </td>

                      <td className="py-4">
                        {money(o.totalAmount)}
                      </td>

                      <td className="py-4">

                        <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">
                          {o.status}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}