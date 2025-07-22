import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { LoadingScreen } from "@/components/loadingScreen";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { useMaintenance } from "./hooks/use-maintenance";
import { LoadingProvider } from "./hooks/use-loading-state";
import { AnimatePresence } from "framer-motion";
import { IdleModeProvider } from '@/components/IdleModeProvider';
import { OfflineIndicator } from '@/components/offline-indicator';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

import { useResourcePreloader } from '@/hooks/use-resource-preloader';

// Import các trang một cách thông thường
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import MovieDetailsPage from "@/pages/movie-details-page";
import WatchPage from "@/pages/watch-page";
import SearchPage from "@/pages/search-page";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import MaintenancePage from "@/pages/maintenance-page";
import SeriesPage from "@/pages/series-page";
import MoviesPage from "@/pages/movies-page";
import FilterPage from "@/pages/filter-page";
import IosGuidePage from "./pages/ios-guide-page"; // Import the new page
import FAQPage from "./pages/faq-page";
import PrivacyPage from "./pages/privacy-page";
import TermsPage from "./pages/terms-page";
import AboutPage from "./pages/about-page";
// Tính năng chuỗi xem phim đã bị gỡ bỏ

function MainRouter() {
  const { user } = useAuth();
  const { isMaintenanceMode } = useMaintenance();

  // Hiển thị trang bảo trì nếu đang bảo trì (trừ admin)
  if (isMaintenanceMode && user?.role !== "admin") {
    return <MaintenancePage />;
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/movie/:slug" component={MovieDetailsPage} />
      <ProtectedRoute path="/watch/:slug/:episode?" component={WatchPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/series" component={SeriesPage} />
      <Route path="/movies" component={MoviesPage} />
      {/* Thêm routes cho trang lọc phim theo cách mới */}
      <Route path="/filter" component={FilterPage} />
      <Route path="/the-loai/:slug?" component={FilterPage} />
      <Route path="/quoc-gia/:slug?" component={FilterPage} />
      <Route path="/nam/:slug?" component={FilterPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <AdminRoute path="/admin" component={AdminPage} />
      <Route path="/huong-dan-them-app" component={IosGuidePage} /> {/* Add the new route */}
      <Route path="/faq" component={FAQPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/about" component={AboutPage} />
      {/* Trang test streak đã bị gỡ bỏ */}
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

function App() {
  // Preload critical resources
  useResourcePreloader({
    images: [
      '/logo-icon.svg',
      '/logo.svg',
      '/images/default-poster.svg',
      '/placeholder-portrait.svg'
    ],
    priority: 'high'
  });

  return (
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <IdleModeProvider 
          idleTimeout={300000}
          enableScreensaver={true}
        >
          <div className="flex flex-col min-h-screen bg-background relative">
            <OfflineIndicator />
            <Navbar />
            <main className="flex-grow pt-20 lg:pt-24 relative z-10">
              <MainRouter />
            </main>
            <Footer />
            <PWAInstallPrompt />
          </div>
        </IdleModeProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;