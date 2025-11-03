import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { Card } from "@/components/ui/card";
import { Loader2, Menu, FileText, Calendar, MessageCircle, Phone, Users, CheckCircle } from "lucide-react";
import logo from "@/assets/bird-co-logo.png";
const navigationCards = [{
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
  icon: Phone
}, {
  title: "Refer a Friend",
  icon: Users
}, {
  title: "Completed Events",
  icon: CheckCircle
}];
const Dashboard = () => {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  // Authentication check disabled - remove comments to re-enable
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     navigate("/auth");
  //   }
  // }, [user, authLoading, navigate]);
  
  // if (authLoading) {
  //   return <div className="min-h-screen flex items-center justify-center bg-background">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>;
  // }
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
          {navigationCards.map(card => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.title} 
                className="aspect-square flex flex-col items-start justify-between p-6 bg-muted hover:bg-muted/80 transition-colors cursor-pointer border-0"
                onClick={() => {
                  if (card.title === "Availability & Shifts") {
                    navigate("/availability-shifts");
                  } else if (card.title === "Chat") {
                    navigate("/chat");
                  } else if (card.title === "Refer a Friend") {
                    navigate("/refer");
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

      {/* Footer */}
      <footer className="bg-black text-white py-4">
        <div className="max-w-2xl mx-auto grid grid-cols-3">
          <button className="flex flex-col items-center gap-1 py-2">
            <Phone className="h-6 w-6" />
            <span className="text-sm font-medium">Call Us</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2">
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm font-medium">Messages</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m-9-9h6m6 0h6" />
            </svg>
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </footer>
    </div>;
};
export default Dashboard;