
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ItemRegistration } from "./pages/ItemRegistration";
import { ProductRegistration } from "./pages/ProductRegistration";
import { SpecificationSelection } from "./pages/SpecificationSelection";
import { BomRegistrationPage } from "./pages/BomRegistrationPage";
import { BomRegistration } from "./pages/BomRegistration";
import { BomValidation } from "./pages/BomValidation";
import { About } from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<ItemRegistration />} />
            <Route path="/items" element={<ItemRegistration />} />
            <Route path="/items/product" element={<ProductRegistration />} />
            <Route path="/items/specification" element={<SpecificationSelection />} />
            <Route path="/items/bom-registration" element={<BomRegistrationPage />} />
            <Route path="/bom" element={<BomRegistration />} />
            <Route path="/validation" element={<BomValidation />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
