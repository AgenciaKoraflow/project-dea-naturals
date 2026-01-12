import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createQueryClient } from "./lib/queryConfig";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Returns from "./pages/Returns";
import ReturnDetail from "./pages/ReturnDetail";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = createQueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <Layout>
              <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/pedidos" element={<Orders />} />
                  <Route path="/pedidos/:id" element={<OrderDetail />} />
                  <Route path="/devolucoes" element={<Returns />} />
                  <Route path="/devolucoes/:id" element={<ReturnDetail />} />
                  <Route path="/analises" element={<Analytics />} />
                  <Route path="/configuracoes" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
