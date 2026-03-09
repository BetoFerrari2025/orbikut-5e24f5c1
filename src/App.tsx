import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Discover from "./pages/Discover";
import Post from "./pages/Post";
import AdminUsers from "./pages/AdminUsers";
import ResetPassword from "./pages/ResetPassword";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          user ? (
            <AppLayout>
              <Index />
            </AppLayout>
          ) : (
            <Landing />
          )
        }
      />
      <Route path="/profile/:username" element={<AppLayout><Profile /></AppLayout>} />
      <Route path="/search" element={<AppLayout><Search /></AppLayout>} />
      <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
      <Route path="/messages" element={<AppLayout><Messages /></AppLayout>} />
      <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
      <Route path="/discover" element={<AppLayout><Discover /></AppLayout>} />
      <Route path="/post/:postId" element={<AppLayout><Post /></AppLayout>} />
      <Route path="/admin/users" element={<AppLayout><AdminUsers /></AppLayout>} />
      <Route path="/~oauth/*" element={null} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppShell() {
  useTheme(); // applies dark/light class to <html>
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppShell />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
