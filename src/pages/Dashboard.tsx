import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Menu, FileText, Calendar, MessageCircle, Phone, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import logo from "@/assets/bird-co-logo.png";
import { DEV_CONFIG } from "@/config/dev";
const vendorNavigationCards = [{
  title: "Registration & Documents",
  icon: FileText
}, {
  title: "Availability & Shifts",
  icon: Calendar
}, {
  title: "Chat",
  icon: MessageCircle
}, {
  title: "Contact Us",
  icon: Phone,
  path: "/contact"
}, {
  title: "Refer a Vendor",
  icon: Users,
  path: "/refer"
}, {
  title: "Completed Events",
  icon: CheckCircle
}];

const chefNavigationCards = [{
  title: "Registration & Documents",
  icon: FileText
}, {
  title: "Availability & Shifts",
  icon: Calendar
}, {
  title: "Chat",
  icon: MessageCircle
}, {
  title: "Contact Us",
  icon: Phone,
  path: "/contact"
}, {
  title: "Refer a Chef",
  icon: Users,
  path: "/refer"
}, {
  title: "Completed Events",
  icon: CheckCircle
}];
const Dashboard = () => {
  const {
    user,
    userRole,
    loading: authLoading,
    registrationComplete,
    approvalStatus
  } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadMessages();
  const [showStickyBar, setShowStickyBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showCallDialog, setShowCallDialog] = useState(false);

  useEffect(() => {
    // Skip registration checks in development mode
    if (DEV_CONFIG.bypassRegistrationChecks) {
      return;
    }
    
    if (!authLoading && user && !registrationComplete) {
      navigate("/complete-registration");
    }
  }, [user, authLoading, registrationComplete, navigate]);

  // Scroll detection for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        // Scrolling up or at top - show bar
        setShowStickyBar(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide bar
        setShowStickyBar(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleCall = () => {
    window.location.href = "tel:078777316349";
    setShowCallDialog(false);
  };
  
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }

  // Show approval pending message (skip in dev mode)
  if (!DEV_CONFIG.bypassRegistrationChecks && registrationComplete && approvalStatus === "pending") {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Clock className="h-16 w-16 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold">Registration Under Review</h2>
              <p className="text-muted-foreground">
                Thank you for completing your registration! Your application is currently being reviewed by the Bird & Co team.
                We'll notify you once your account has been approved.
              </p>
              <Button onClick={() => navigate("/registration-documents")}>
                View My Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  // Show rejected message (skip in dev mode)
  if (!DEV_CONFIG.bypassRegistrationChecks && approvalStatus === "rejected") {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold">Application Not Approved</h2>
              <p className="text-muted-foreground">
                Unfortunately, your application was not approved. Please contact Bird & Co support for more information.
              </p>
              <Button onClick={() => navigate("/contact")}>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4">
        <button className="p-2">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
          {(userRole === 'chef' ? chefNavigationCards : vendorNavigationCards).map(card => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.title} 
                className="aspect-square flex flex-col items-start justify-between p-6 bg-muted hover:bg-muted/80 transition-colors cursor-pointer border-0"
              onClick={() => {
                if (card.title === "Registration & Documents") {
                  navigate("/registration-documents");
                } else if (card.title === "Availability & Shifts") {
                  navigate("/availability-shifts");
                } else if (card.title === "Chat") {
                  navigate("/chat");
                } else if (card.title === "Refer a Friend") {
                  navigate("/refer");
                } else if (card.title === "Contact Us") {
                  navigate("/contact");
                } else if (card.title === "Completed Events") {
                  navigate("/completed-events");
                }
              }}
              >
                <IconComponent className="h-8 w-8 mb-2" />
                <h2 className="font-heading font-bold leading-tight text-lg">{card.title}</h2>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Sticky Action Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-black text-white shadow-lg transition-transform duration-300 z-50 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 py-2 text-white hover:bg-white/10"
              onClick={() => setShowCallDialog(true)}
            >
              <Phone className="h-5 w-5" />
              <span className="text-xs font-medium">Call Us</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 py-2 text-white hover:bg-white/10 relative"
              onClick={() => navigate("/notifications")}
            >
              <div className="relative">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-black"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">Notifications</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 py-2 text-white hover:bg-white/10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m-9-9h6m6 0h6" />
              </svg>
              <span className="text-xs font-medium">Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Call Confirmation Dialog */}
      <AlertDialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Call Bird & Co?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to call Bird & Co admin line at 078777 316349?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCall}>
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Dashboard;