import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl font-black">BIRD & CO</h1>
            <p className="text-sm text-muted-foreground">Events</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/auth?role=vendor")} variant="outline" size="sm">
              Vendor Login
            </Button>
            <Button onClick={() => navigate("/auth?role=chef")} variant="outline" size="sm">
              Chef Login
            </Button>
            <Button onClick={() => navigate("/auth?role=admin")} variant="outline" size="sm">
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="font-heading md:text-8xl font-black leading-tight text-4xl">
              CREATIVE
              <br />
              EVENT
              <br />
              PRODUCTION
            </h2>
            <p className="md:text-2xl text-muted-foreground max-w-2xl mx-auto text-base">
              Join our network of trusted vendors and access exclusive event opportunities
            </p>
          </div>

          <div className="flex flex-col gap-6 justify-center items-center">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate("/auth?role=vendor")} size="lg" className="font-heading font-bold text-lg px-8">
                Vendor Sign Up
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button onClick={() => navigate("/auth?role=chef")} size="lg" variant="outline" className="font-heading font-bold text-lg px-8">
                Chef Sign Up
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Already have an account? Use the login buttons above
            </p>
          </div>

          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="space-y-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="font-heading text-2xl font-black">01</span>
              </div>
              <h3 className="font-heading text-xl font-bold">Browse Opportunities</h3>
              <p className="text-muted-foreground">
                View new event opportunities as they become available
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="font-heading text-2xl font-black">02</span>
              </div>
              <h3 className="font-heading text-xl font-bold">Express Interest</h3>
              <p className="text-muted-foreground">
                Apply to events that match your expertise and availability
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="font-heading text-2xl font-black">03</span>
              </div>
              <h3 className="font-heading text-xl font-bold">Get Notified</h3>
              <p className="text-muted-foreground">
                Receive updates when new opportunities match your profile
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Bird & Co Events. All rights reserved.</p>
        </div>
      </footer>
    </div>;
};
export default Index;