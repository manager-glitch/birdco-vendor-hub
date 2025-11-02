import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Clock, Phone, Calendar as CalendarIcon } from "lucide-react";
import logo from "@/assets/bird-co-logo.png";

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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(new Date());
  const [availabilityNotes, setAvailabilityNotes] = useState("");

  // Mock data - replace with actual data from Supabase
  const confirmedEvents: Event[] = [
    {
      id: "1",
      clientName: "Smith Wedding",
      date: "2025-12-15",
      time: "2:00 PM - 10:00 PM",
      location: "Grand Hotel",
      address: "123 Main St, City, State 12345",
      status: "Booked & Confirmed",
      role: "Food Vendor",
      payRate: "$500",
      notes: "Setup at 1:00 PM. Client requests vegetarian options."
    },
    {
      id: "2",
      clientName: "Corporate Gala",
      date: "2025-12-20",
      time: "6:00 PM - 11:00 PM",
      location: "Convention Center",
      address: "456 Event Ave, City, State 12345",
      status: "Booked & Confirmed",
      role: "Beverage Vendor",
      payRate: "$600",
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
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const handleApplyToEvent = (eventId: string) => {
    // Implement apply logic
    alert(`Applied to event ${eventId}`);
  };

  const handleAddAvailability = () => {
    // Implement add availability logic
    alert(`Availability added for ${availabilityDate?.toLocaleDateString()}`);
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
                      <span>{event.date}</span>
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
              {availableEvents.map((event) => (
                <Card key={event.id} className="p-6">
                  <div className="space-y-3">
                    <h3 className="font-heading text-lg font-bold">{event.eventName}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <Button 
                      variant="default" 
                      className="w-full mt-4"
                      onClick={() => handleApplyToEvent(event.id)}
                    >
                      Apply to Event
                    </Button>
                  </div>
                </Card>
              ))}
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
                        <p className="text-sm text-muted-foreground">{event.date} • {event.time}</p>
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