import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-8">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-12">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="font-heading text-4xl font-black tracking-tight">
            BIRD & CO
          </h1>
          <p className="text-lg text-muted-foreground">Events</p>
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