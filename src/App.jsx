import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Toast from "./components/Toast";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Studio from "./pages/Studio";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import { getCart, getUser, saveCart } from "./lib/storage";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAvatars from "./pages/admin/AdminAvatars";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App(){
 const [cart,setCart]=useState(getCart()); const [user,setUser]=useState(getUser()); const [toast,setToast]=useState("");
 useEffect(()=>saveCart(cart),[cart]);
 const notify=msg=>{setToast(msg);setTimeout(()=>setToast(""),2600)};
 const addToCart=item=>setCart(c=>{const existing=c.find(i=>i.id===item.id);return existing?c.map(i=>i.id===item.id?{...i,quantity:i.quantity+item.quantity}:i):[...c,item]});
 const updateQty=(id,q)=>setCart(c=>c.map(i=>i.id===id?{...i,quantity:q}:i));
 const remove=id=>setCart(c=>c.filter(i=>i.id!==id));
 const clearCart=()=>setCart([]);
 const count=useMemo(()=>cart.reduce((s,i)=>s+i.quantity,0),[cart]);

 return <BrowserRouter><Layout cartCount={count} user={user}><Routes>
   <Route path="/" element={<Home/>}/>
   <Route path="/shop" element={<Shop/>}/>
   <Route path="/product/:id" element={<Product addToCart={addToCart} notify={notify}/>}/>
   <Route path="/studio" element={<Studio addToCart={addToCart} notify={notify}/>}/>
   <Route path="/cart" element={<Cart cart={cart} updateQty={updateQty} remove={remove}/>}/>
   <Route path="/checkout" element={<Checkout cart={cart} clearCart={clearCart} notify={notify}/>}/>
   <Route path="/orders" element={<Orders/>}/>
   <Route path="/orders/:id" element={<OrderDetail/>}/>
   <Route path="/profile" element={<Profile user={user} setUser={setUser} notify={notify}/>}/>
   <Route path="/signin" element={<Auth setUser={setUser}/>}/>
   <Route path="/signup" element={<Auth setUser={setUser}/>}/>
   <Route path="/login" element={<Auth setUser={setUser}/>}/>
   <Route path="/admin/login" element={<AdminLogin setUser={setUser}/>}/>
   <Route
  path="/admin"
  element={
    <ProtectedRoute adminOnly>
      <Admin />
    </ProtectedRoute>
  }
/>
   <Route path="*" element={<Home/>}/>
   <Route
  path="/admin/products"
  element={
    <ProtectedRoute adminOnly>
      <AdminProducts />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/avatars"
  element={
    <ProtectedRoute adminOnly>
      <AdminAvatars />
    </ProtectedRoute>
  }
/>
 </Routes></Layout><Toast message={toast} onClose={()=>setToast("")}/></BrowserRouter>;
}