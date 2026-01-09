import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Building2, FileText, Filter, Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CompletedEvent {
  id: string;
  event_name: string;
  client_name: string;
  event_date: string;
  notes: string | null;
  event_type: string | null;
  created_at: string;
  vendor_id: string;
  vendor_name?: string;
}

export default function CompletedEvents() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [events, setEvents] = useState<CompletedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CompletedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCompletedEvents();

    // Set up realtime subscription for new completed events
    const channel = supabase
      .channel('completed-events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'completed_events',
          filter: `vendor_id=eq.${user.id}`
        },
        () => {
          fetchCompletedEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  useEffect(() => {
    filterAndSortEvents();
  }, [events, searchTerm, sortOrder]);

  const fetchCompletedEvents = async () => {
    try {
      setLoading(true);
      
      // Admins see all events, vendors see only their own
      let query = supabase
        .from("completed_events")
        .select("*")
        .order("event_date", { ascending: false });
      
      if (!isAdmin) {
        query = query.eq("vendor_id", user?.id);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      // For admins, fetch vendor names
      if (isAdmin && data && data.length > 0) {
        const vendorIds = [...new Set(data.map(e => e.vendor_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, company_name")
          .in("id", vendorIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || p.company_name || 'Unknown Vendor']));
        const eventsWithVendors = data.map(e => ({
          ...e,
          vendor_name: profileMap.get(e.vendor_id) || 'Unknown Vendor'
        }));
        setEvents(eventsWithVendors);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error("Error fetching completed events:", error);
      toast.error("Failed to load completed events");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.event_date).getTime();
      const dateB = new Date(b.event_date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setFilteredEvents(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold mb-2">Completed Events</h1>
        <p className="text-muted-foreground">
          Track your work history and showcase your experience
        </p>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search events, clients, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sort by Date</label>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{events.length}</div>
              <p className="text-sm text-muted-foreground">Total Completed Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No completed events found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search"
                : isAdmin 
                  ? "No events have been marked as complete yet"
                  : "Your completed events will appear here once admin marks them as complete"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{event.event_name}</CardTitle>
                    <CardDescription className="flex flex-wrap gap-4 text-base">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {event.client_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.event_date), "MMMM d, yyyy")}
                      </span>
                      {isAdmin && event.vendor_name && (
                        <Badge variant="outline">{event.vendor_name}</Badge>
                      )}
                    </CardDescription>
                  </div>
                  {event.event_type && (
                    <Badge variant="secondary">{event.event_type}</Badge>
                  )}
                </div>
              </CardHeader>
              {event.notes && (
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">Notes & Highlights</p>
                    <p className="text-sm text-muted-foreground">{event.notes}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
