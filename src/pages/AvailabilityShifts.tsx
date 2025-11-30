import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, MapPin, Clock, Phone, Calendar as CalendarIcon, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/bird-co-logo.png";
import { DEV_CONFIG } from "@/config/dev";
import { format, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Event {
  id: string;
  clientName?: string;
  eventName?: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  status: string;
  role?: string;
  payRate?: string;
  notes?: string;
}

const AvailabilityShifts = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, registrationComplete, approvalStatus } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(new Date());
  const [availabilityNotes, setAvailabilityNotes] = useState("");
  const [availableOpportunities, setAvailableOpportunities] = useState<any[]>([]);
  const [appliedOpportunities, setAppliedOpportunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  // Helper function to format dates in British format (DD/MM/YYYY)
  const formatDateBritish = (dateString: string) => {
    try {
      const date = parse(dateString, "yyyy-MM-dd", new Date());
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    if (user) {
      loadOpportunities();
      loadUserApplications();
    }
  }, [user]);

  const loadOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "open")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setAvailableOpportunities(data || []);
    } catch (error) {
      console.error("Error loading opportunities:", error);
    }
  };

  const loadUserApplications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("opportunity_id")
        .eq("vendor_id", user.id);

      if (error) throw error;
      
      const appliedIds = new Set(data?.map(app => app.opportunity_id) || []);
      setAppliedOpportunities(appliedIds);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  };

  useEffect(() => {
    // Skip registration checks in development mode
    if (DEV_CONFIG.bypassRegistrationChecks) {
      return;
    }
    
    if (!authLoading && (!user || !registrationComplete || approvalStatus !== "approved")) {
      navigate("/dashboard");
    }
  }, [user, authLoading, registrationComplete, approvalStatus, navigate]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }

  // Mock data - replace with actual data from Supabase
  const confirmedEvents: Event[] = [
    {
      id: "1",
      clientName: "Smith Wedding",
      date: "2025-12-15",
      time: "2:00 PM - 10:00 PM",
      location: "Grand Hotel",
      address: "1 landells road, east dulwich, Se22 9pg",
      status: "Booked & Confirmed",
      role: "Food Vendor",
      payRate: "£500",
      notes: "Setup at 1:00 PM. Client requests vegetarian options."
    },
    {
      id: "2",
      clientName: "Corporate Gala",
      date: "2025-12-20",
      time: "6:00 PM - 11:00 PM",
      location: "Convention Center",
      address: "1 landells road, east dulwich, Se22 9pg",
      status: "Booked & Confirmed",
      role: "Beverage Vendor",
      payRate: "£600",
      notes: "Black tie event. 200 guests expected."
    }
  ];

  const availableEvents: Event[] = [
    {
      id: "3",
      eventName: "Birthday Party",
      date: "2025-12-18",
      time: "3:00 PM - 7:00 PM",
      location: "Private Residence",
      status: "Open"
    },
    {
      id: "4",
      eventName: "Holiday Market",
      date: "2025-12-22",
      time: "10:00 AM - 6:00 PM",
      location: "Downtown Square",
      status: "Open"
    }
  ];

  const handleReadMore = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleBack = () => {
    setSelectedEvent(null);
  };

  const handleCancelEvent = () => {
    // Implement cancel logic
    alert("Cancel event functionality");
    setSelectedEvent(null);
  };

  const handleCallUs = () => {
    // Implement call functionality
    window.location.href = "tel:+1234567890";
  };

  const handleGetDirections = (address: string) => {
    console.log("Opening directions for address:", address);
    setSelectedAddress(address);
    setMapDialogOpen(true);
  };

  // Map URLs are now handled directly in the JSX with anchor tags

  const handleApplyToEvent = async (opportunityId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          vendor_id: user.id,
          opportunity_id: opportunityId,
          status: "pending"
        });

      if (error) throw error;

      setAppliedOpportunities(prev => new Set([...prev, opportunityId]));
      toast.success("Your interest has been noted by the Bird & Co team! We'll be in touch soon.", {
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Error applying to event:", error);
      toast.error("Failed to apply to event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = () => {
    // Implement add availability logic
    const formattedDate = availabilityDate ? format(availabilityDate, "dd/MM/yyyy") : "";
    alert(`Availability added for ${formattedDate}`);
    setAvailabilityNotes("");
  };

  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-4">
          <button onClick={handleBack} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={logo} alt="Bird & Co" className="h-8" />
        </header>

        {/* Event Details */}
        <main className="flex-1 px-6 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-6 space-y-4">
              <h2 className="font-heading text-2xl font-bold">{selectedEvent.clientName}</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Event Address</p>
                    <p className="text-muted-foreground">{selectedEvent.address}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mt-1"
                      onClick={() => handleGetDirections(selectedEvent.address!)}
                    >
                      Get Directions
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-muted-foreground">{selectedEvent.time}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium">Event Status</p>
                  <p className="text-muted-foreground">{selectedEvent.status}</p>
                </div>

                <div>
                  <p className="font-medium">Your Role</p>
                  <p className="text-muted-foreground">{selectedEvent.role}</p>
                </div>

                <div>
                  <p className="font-medium">Pay Rate</p>
                  <p className="text-muted-foreground">{selectedEvent.payRate}</p>
                </div>

                <div>
                  <p className="font-medium">Notes</p>
                  <p className="text-muted-foreground">{selectedEvent.notes}</p>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleCancelEvent}
              >
                Cancel Event
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={handleCallUs}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Us
              </Button>
            </div>
          </div>
        </main>

        {/* Map Selection Dialog */}
        <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Map App</DialogTitle>
              <DialogDescription>
                Select which app to use for directions to: {selectedAddress}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAddress)}`}
                target="_top"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start w-full h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Google Maps
              </a>
              <a
                href={`https://www.waze.com/ul?q=${encodeURIComponent(selectedAddress)}`}
                target="_top"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start w-full h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Waze
              </a>
              <a
                href={`https://maps.apple.com/?q=${encodeURIComponent(selectedAddress)}`}
                target="_top"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start w-full h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Apple Maps
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <img src={logo} alt="Bird & Co" className="h-8" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-3xl font-bold mb-6">Availability & Shifts</h1>

          <Tabs defaultValue="confirmed" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="shifts">My Shifts</TabsTrigger>
              <TabsTrigger value="add">Add</TabsTrigger>
            </TabsList>

            {/* Upcoming Confirmed Events */}
            <TabsContent value="confirmed" className="space-y-4 mt-6">
              <h2 className="font-heading text-xl font-bold">Upcoming Confirmed Events</h2>
              {confirmedEvents.map((event) => (
                <Card key={event.id} className="p-6">
                  <div className="space-y-3">
                    <h3 className="font-heading text-lg font-bold">{event.clientName}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDateBritish(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Status: </span>
                      <span className="text-muted-foreground">{event.status}</span>
                    </p>
                    <Button 
                      variant="default" 
                      className="w-full mt-4"
                      onClick={() => handleReadMore(event)}
                    >
                      Read More
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>

            {/* Available Events */}
            <TabsContent value="available" className="space-y-4 mt-6">
              <h2 className="font-heading text-xl font-bold">Available Events</h2>
              {availableOpportunities.length === 0 ? (
                <Card className="p-6">
                  <p className="text-center text-muted-foreground">No available events at the moment. Check back soon!</p>
                </Card>
              ) : (
                availableOpportunities.map((opportunity) => {
                  const hasApplied = appliedOpportunities.has(opportunity.id);
                  return (
                    <Card key={opportunity.id} className="p-6">
                      <div className="space-y-3">
                        <h3 className="font-heading text-lg font-bold">{opportunity.title}</h3>
                        {opportunity.description && (
                          <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                        )}
                        {opportunity.event_date && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDateBritish(opportunity.event_date)}</span>
                          </div>
                        )}
                        {opportunity.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{opportunity.location}</span>
                          </div>
                        )}
                        {hasApplied ? (
                          <div className="flex items-center justify-center gap-2 w-full mt-4 p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-md">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Application Submitted</span>
                          </div>
                        ) : (
                          <Button 
                            variant="default" 
                            className="w-full mt-4"
                            onClick={() => handleApplyToEvent(opportunity.id)}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              "Apply to Event"
                            )}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* My Shifts */}
            <TabsContent value="shifts" className="space-y-6 mt-6">
              <h2 className="font-heading text-xl font-bold">My Shifts</h2>
              
              {/* Calendar View */}
              <div>
                <h3 className="font-medium mb-3">Calendar View</h3>
                <Card className="p-4">
                  <Calendar
                    mode="single"
                    selected={availabilityDate}
                    onSelect={setAvailabilityDate}
                    className="rounded-md"
                    modifiers={{
                      booked: confirmedEvents.map(event => parse(event.date, "yyyy-MM-dd", new Date()))
                    }}
                    modifiersClassNames={{
                      booked: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-foreground after:rounded-full"
                    }}
                  />
                </Card>
              </div>

              {/* List View */}
              <div>
                <h3 className="font-medium mb-3">List View</h3>
                {confirmedEvents.map((event) => (
                  <Card key={event.id} className="p-4 mb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.clientName}</p>
                        <p className="text-sm text-muted-foreground">{formatDateBritish(event.date)} • {event.time}</p>
                      </div>
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                        Booked
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Add Availability */}
            <TabsContent value="add" className="space-y-4 mt-6">
              <h2 className="font-heading text-xl font-bold">Add Availability</h2>
              
              <Card className="p-6 space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 Keep your availability up to date so we can book you quickly!
                  </p>
                </div>

                <div>
                  <label className="block font-medium mb-2">Select Date</label>
                  <Card className="p-4">
                    <Calendar
                      mode="single"
                      selected={availabilityDate}
                      onSelect={setAvailabilityDate}
                      className="rounded-md"
                    />
                  </Card>
                </div>

                <div>
                  <label className="block font-medium mb-2">Time Preferences & Notes</label>
                  <Textarea
                    placeholder="E.g., Available 9am-5pm, prefer outdoor events..."
                    value={availabilityNotes}
                    onChange={(e) => setAvailabilityNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={handleAddAvailability}
                >
                  Add Availability
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AvailabilityShifts;