import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PWAManager } from "@/components/PWAManager";
import { LoadingFallback, ErrorFallback, registerServiceWorker } from "@/components/PerformanceOptimizations";
import { ErrorBoundary } from "react-error-boundary";
import { useNotificationService } from "@/hooks/useNotificationService";
import { initializeStorageBuckets } from "@/lib/storage";
import { AIAgentWidget } from "@/components/ai/AIAgentWidget";
import { ProactiveNotifications } from "@/components/ai/ProactiveNotifications";
import { AutomaticNotifications } from "@/components/notification-system/AutomaticNotifications";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
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
const NearbyProfessionals = lazy(() => import("./pages/NearbyProfessionals"));
const MapView = lazy(() => import("./pages/MapView"));
const VerificationPage = lazy(() => import("./pages/VerificationPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ProfessionalPublicProfile = lazy(() => import("./pages/ProfessionalPublicProfile"));
const ToninhoHistory = lazy(() => import("./pages/ToninhoHistory"));
const ToninhoAnalytics = lazy(() => import("./pages/ToninhoAnalytics"));
const AdminVerificationPanel = lazy(() => import("./pages/AdminVerificationPanel"));

const FluxoDemo = lazy(() => import("./pages/FluxoDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdvancedSearch = lazy(() => import("./pages/AdvancedSearch"));
const AboutToninho = lazy(() => import("./pages/AboutToninho"));

// New optimized pages
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
  const { user, profile } = useAuth();
  
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
      {user && profile && (
        <AutomaticNotifications 
          userId={user.id} 
          userRole={profile.user_type as 'client' | 'professional'} 
        />
      )}
      <BrowserRouter>
        <AIAgentWidget />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/categories" element={<ServiceCategories />} />
            <Route path="/nearby-professionals" element={<NearbyProfessionals />} />
            <Route path="/about-toninho" element={<AboutToninho />} />
            <Route
              path="/professional/:id"
              element={
                <ProtectedRoute>
                  <ProfessionalPublicProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-request"
              element={
                <ProtectedRoute>
                  <NewRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-request/:categoryId"
              element={
                <ProtectedRoute>
                  <NewRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-requests"
              element={
                <ProtectedRoute>
                  <MyRequestsNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-request/:id"
              element={
                <ProtectedRoute>
                  <SimpleRequestDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simple-request-details/:id"
              element={
                <ProtectedRoute>
                  <SimpleRequestDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-request-details/:id"
              element={
                <ProtectedRoute>
                  <ServiceRequestDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/available-requests"
              element={
                <ProtectedRoute>
                  <AvailableRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-services"
              element={
                <ProtectedRoute>
                  <MyServicesNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-services-new"
              element={
                <ProtectedRoute>
                  <MyServicesNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional-profile"
              element={
                <ProtectedRoute>
                  <ProfessionalProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional-dashboard"
              element={
                <ProtectedRoute>
                  <ProfessionalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client-profile"
              element={
                <ProtectedRoute>
                  <ClientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client-dashboard"
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track-requests"
              element={
                <ProtectedRoute>
                  <TrackRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track-request/:id"
              element={
                <ProtectedRoute>
                  <TrackRequestDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/map-view" element={<MapView />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/advanced-search" element={<AdvancedSearch />} />
            <Route
              path="/conversations"
              element={
                <ProtectedRoute>
                  <Conversations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:requestId"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verification"
              element={
                <ProtectedRoute>
                  <VerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fluxo-demo"
              element={
                <ProtectedRoute>
                  <FluxoDemo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/toninho-history"
              element={
                <ProtectedRoute>
                  <ToninhoHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/toninho-analytics"
              element={
                <ProtectedRoute>
                  <ToninhoAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verificacao"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminVerificationPanel />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
