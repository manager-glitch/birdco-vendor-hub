import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/bird-co-logo-cream.png";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-8">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-4">
        {/* Logo */}
        <div className="text-center">
          <img 
            src={logo} 
            alt="Bird & Co Events" 
            className="w-64 h-auto mx-auto"
          />
        </div>

        {/* Login Buttons */}
        <div className="w-full space-y-4">
          <Button 
            onClick={() => navigate("/auth?role=vendor")} 
            size="lg"
            className="w-full font-heading font-bold text-lg h-14"
          >
            Vendor Login
          </Button>
          
          <Button 
            onClick={() => navigate("/auth?role=chef")} 
            size="lg"
            variant="outline"
            className="w-full font-heading font-bold text-lg h-14"
          >
            Chef Login
          </Button>
        </div>
      </div>

      {/* Admin Login at Bottom */}
      <button 
        onClick={() => navigate("/auth?role=admin")}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors pb-4"
      >
        Admin Login
      </button>
    </div>
  );
};

export default Index;