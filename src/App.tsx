import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PWAManager } from "@/components/PWAManager";
import { LoadingFallback, ErrorFallback, registerServiceWorker } from "@/components/PerformanceOptimizations";
import { ErrorBoundary } from "react-error-boundary";
import { useNotificationService } from "@/hooks/useNotificationService";
import { initializeStorageBuckets } from "@/lib/storage";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ServiceCategories = lazy(() => import("./pages/ServiceCategories"));
const NewRequest = lazy(() => import("./pages/NewRequest"));
const MyRequests = lazy(() => import("./pages/MyRequests"));
const TrackRequests = lazy(() => import("./pages/TrackRequests"));
const TrackRequestDetail = lazy(() => import("./pages/TrackRequestDetail"));
const SimpleRequestDetails = lazy(() => import("./pages/SimpleRequestDetails"));
const AvailableRequests = lazy(() => import("./pages/AvailableRequests"));
const Chat = lazy(() => import("./pages/Chat"));
const Conversations = lazy(() => import("./pages/Conversations"));
const ProfessionalProfile = lazy(() => import("./pages/ProfessionalProfile"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const MyServices = lazy(() => import("./pages/MyServices"));
const MyServicesNew = lazy(() => import("./pages/MyServicesNew"));
const MyRequestsNew = lazy(() => import("./pages/MyRequestsNew"));
const ServiceRequestDetails = lazy(() => import("./pages/ServiceRequestDetails"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ProfessionalDashboard = lazy(() => import("./pages/ProfessionalDashboard"));
const Favorites = lazy(() => import("./pages/Favorites"));
const MapView = lazy(() => import("./pages/MapView"));
const VerificationPage = lazy(() => import("./pages/VerificationPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ProfessionalPublicProfile = lazy(() => import("./pages/ProfessionalPublicProfile"));
const Admin = lazy(() => import("./pages/Admin"));
const FluxoDemo = lazy(() => import("./pages/FluxoDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdvancedSearch = lazy(() => import("./pages/AdvancedSearch"));

// New optimized pages
const TemplateSystem = lazy(() => import("@/components/TemplateSystem").then(module => ({ default: module.TemplateSystem })));
const LoyaltySystem = lazy(() => import("@/components/LoyaltySystem").then(module => ({ default: module.LoyaltyDashboard })));

// Register service worker for better performance
registerServiceWorker();

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppInitializer />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Component to handle initialization after providers are available
function AppInitializer() {
  // Initialize notification service and storage
  useNotificationService();
  
  useEffect(() => {
    initializeStorageBuckets();
  }, []);

  return (
    <>
      <Toaster />
      <Sonner />
      <PWAManager />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/categories" element={<ServiceCategories />} />
            <Route path="/new-request/:categoryId" element={<NewRequest />} />
            <Route path="/my-requests" element={<MyRequestsNew />} />
            <Route path="/track-requests" element={<TrackRequests />} />
            <Route path="/track-request/:requestId" element={<TrackRequestDetail />} />
            <Route path="/request-details/:requestId" element={<SimpleRequestDetails />} />
            <Route path="/available-requests" element={<AvailableRequests />} />
            <Route path="/chat/:requestId" element={<Chat />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/professional-profile" element={<ProfessionalProfile />} />
            <Route path="/client-profile" element={<ClientProfile />} />
            <Route path="/my-requests-new" element={<MyRequestsNew />} />
            <Route path="/my-services-new" element={<MyServicesNew />} />
            <Route path="/service-request/:requestId" element={<ServiceRequestDetails />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/professional-profile/:professionalId" element={<ProfessionalPublicProfile />} />
            <Route path="/search" element={<AdvancedSearch />} />
            
            {/* New optimized features */}
            <Route path="/templates" element={<TemplateSystem />} />
            <Route path="/loyalty" element={<LoyaltySystem />} />
            <Route path="/fluxo-demo" element={<FluxoDemo />} />
            <Route path="/admin" element={<Admin />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
