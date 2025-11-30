import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminChat from "./pages/AdminChat";
import AvailabilityShifts from "./pages/AvailabilityShifts";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import ReferAFriend from "./pages/ReferAFriend";
import ContactUs from "./pages/ContactUs";
import CompleteRegistration from "./pages/CompleteRegistration";
import RegistrationAndDocuments from "./pages/RegistrationAndDocuments";
import CompletedEvents from "./pages/CompletedEvents";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize push notifications
  usePushNotifications();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/chat" element={<AdminChat />} />
      <Route path="/availability-shifts" element={<AvailabilityShifts />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/refer" element={<ReferAFriend />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/complete-registration" element={<CompleteRegistration />} />
      <Route path="/registration-documents" element={<RegistrationAndDocuments />} />
      <Route path="/completed-events" element={<CompletedEvents />} />
      <Route path="/settings" element={<Settings />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
