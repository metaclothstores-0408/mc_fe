import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children, cartCount, user }) {
  const location = useLocation();
  const adminArea = location.pathname.startsWith("/admin");
  if (adminArea) return <div className="min-h-screen bg-[#070708] text-[#F4F4F5]">{children}</div>;
  return <div className="min-h-screen bg-[#0B0B0C] text-[#F4F4F5]"><Header cartCount={cartCount} user={user}/><main>{children}</main><Footer/></div>;
}
