import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SurveyProvider } from "@/contexts/SurveyContext";
import { ApiStatusProvider } from "@/contexts/ApiStatusContext";
import SpatialFeaturesManagement from "./components/SpatialFeaturesManagement";
import Index from "./pages/Index";
import { DailyPersonalMaps } from "./pages/DailyPersonalMaps";
import { Analytics } from "./pages/Analytics";
import Admin from "./pages/Admin";
import PipelineOperations from "./pages/PipelineOperations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ApiStatusProvider>
        <SurveyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                        <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/spatial-features" element={<SpatialFeaturesManagement />} />
              <Route path="/daily-personal-maps" element={<DailyPersonalMaps />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/pipeline-operations" element={<PipelineOperations />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SurveyProvider>
    </ApiStatusProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
