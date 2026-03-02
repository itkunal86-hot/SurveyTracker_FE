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
import DailyPersonalMapsPage from "./pages/DailyPersonalMapsPage";
import SurveyDetailsPage from "./pages/SurveyDetailsPage";
import { Analytics } from "./pages/Analytics";
import Admin from "./pages/Admin";
import PipelineOperations from "./pages/PipelineOperations";
import AssetMenus from "./pages/AssetMenus";
import FlowlinesMapPage from "./pages/FlowlinesMapPage";
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
              <Route path="/daily-personal-maps" element={<DailyPersonalMapsPage />} />
              <Route path="/survey-details" element={<SurveyDetailsPage />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/pipeline-operations" element={<PipelineOperations />} />
              <Route path="/flowlines-map" element={<FlowlinesMapPage />} />
              <Route path="/assets/:menu" element={<AssetMenus />} />
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
