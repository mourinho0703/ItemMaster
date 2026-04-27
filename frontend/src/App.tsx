import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ItemRegistration } from "./pages/ItemRegistration";
import ItemRegistrationHistory from "./pages/ItemRegistrationHistory";
import NotFound from "./pages/NotFound";
import BomEdit from "./pages/BomEdit";
import BomHistory from "./pages/BomHistory";
import { Login } from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 공개 라우트 (로그인 불필요) */}
          <Route path="/login" element={<Login />} />

          {/* 보호된 라우트 (로그인 필요) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/items/request" replace />} />
            <Route path="/items" element={<Navigate to="/items/request" replace />} />
            <Route path="/items/request" element={<ItemRegistration />} />
            <Route path="/items/history" element={<ItemRegistrationHistory />} />
            <Route path="/bom" element={<Navigate to="/bom/request" replace />} />
            <Route path="/bom/request" element={<BomEdit />} />
            <Route path="/bom/history" element={<BomHistory />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
