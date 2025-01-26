import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCameras } from "@/data/cameras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export const AlertsPage = () => {
  const [session, setSession] = useState<any>(null);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate("/auth");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: cameras = [] } = useQuery({
    queryKey: ["cameras"],
    queryFn: getCameras,
  });

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ["alert-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_subscriptions")
        .select("*")
        .eq("user_id", session?.user?.id);

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const sendWelcomeMessage = async (phoneNumber: string) => {
    const { error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: phoneNumber,
        message: "Welcome to FireWatch! You'll now receive alerts when potential fires are detected by your selected cameras.",
      },
    });
    
    if (error) {
      console.error('Error sending welcome message:', error);
      throw error;
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // For US numbers, add +1 if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    // If number already includes country code (11 digits starting with 1)
    else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    // Return original input if it's already in E.164 format (starts with +)
    else if (phone.startsWith('+')) {
      return phone;
    }
    // Return null if invalid format
    return '';
  };

  const createSubscription = useMutation({
    mutationFn: async () => {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      if (!formattedPhone) {
        throw new Error('Please enter a valid 10-digit US phone number');
      }

      const { error } = await supabase.from("alert_subscriptions").insert({
        user_id: session?.user?.id,
        camera_id: selectedCamera,
        phone_number: formattedPhone,
      });

      if (error) throw error;

      // Send welcome message with formatted phone number
      await sendWelcomeMessage(formattedPhone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-subscriptions"] });
      setSelectedCamera("");
      setPhoneNumber("");
      toast({
        title: "Success",
        description: "Alert subscription created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alert_subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-subscriptions"] });
      toast({
        title: "Success",
        description: "Alert subscription deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamera || !phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createSubscription.mutate();
  };

  if (!session) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Fire Alert Subscriptions</h1>
        
        <div className="bg-white/5 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Alert</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Camera
                </label>
                <Select
                  value={selectedCamera}
                  onValueChange={setSelectedCamera}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map((camera) => (
                      <SelectItem key={camera.id} value={camera.id}>
                        {camera.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit US phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Format: 1234567890 (no spaces or special characters)
                </p>
              </div>
            </div>
            <Button
              type="submit"
              disabled={createSubscription.isPending}
              className="w-full md:w-auto"
            >
              {createSubscription.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Alert Subscription"
              )}
            </Button>
          </form>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Your Alert Subscriptions
          </h2>
          {isLoadingSubscriptions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              You don't have any alert subscriptions yet.
            </p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const camera = cameras.find((c) => c.id === sub.camera_id);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between bg-white/5 p-4 rounded-md"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {camera?.name || "Unknown Camera"}
                      </p>
                      <p className="text-gray-400 text-sm">{sub.phone_number}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteSubscription.mutate(sub.id)}
                      disabled={deleteSubscription.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
