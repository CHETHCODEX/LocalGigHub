import Chat from "./pages/Chat";
import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Marketplace from "./pages/Marketplace";
import GigDetails from "./pages/GigDetails";
import StudentDashboard from "./pages/StudentDashboard";
import ShopDashboard from "./pages/ShopDashboard";
import ModerationQueue from "./pages/ModerationQueue";
import Notifications from "./pages/Notifications";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="gig/:id" element={<GigDetails />} />
          <Route path="student/dashboard" element={<StudentDashboard />} />
          <Route path="shop/dashboard" element={<ShopDashboard />} />
          <Route path="shop/moderation" element={<ModerationQueue />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="chat" element={<Chat />} />
        </Route>
        {/* Auth routes don't use the standard Layout with Navbar/Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
