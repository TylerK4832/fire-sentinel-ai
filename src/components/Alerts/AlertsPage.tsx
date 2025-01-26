import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCameras } from "../../data/cameras";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertSubscriptionForm } from "./AlertSubscriptionForm";
import { CurrentSubscriptions } from "./CurrentSubscriptions";
import { DashboardHeader } from "../Dashboard/DashboardHeader";
import { Loader2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type AlertSubscription = Database['public']['Tables']['alert_subscriptions']['Row'];

interface SubscriptionFormValues {
  cameraId: string;
  phoneNumber: string;
}

export const AlertsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['alert-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_subscriptions')
        .select('*');
      
      if (error) {
        console.error("Error fetching subscriptions:", error);
        throw error;
      }
      return data as AlertSubscription[];
    },
    meta: {
      onError: (error: Error) => {
        console.error("Subscription query error:", error);
        toast({
          title: "Error",
          description: "Failed to load alert subscriptions.",
          variant: "destructive"
        });
      }
    }
  });

  const createSubscription = useMutation({
    mutationFn: async ({ cameraId, phoneNumber }: SubscriptionFormValues) => {
      console.log("Attempting to create subscription with:", {
        camera_id: cameraId,
        phone_number: phoneNumber
      });

      const { data, error } = await supabase
        .from('alert_subscriptions')
        .insert([{
          camera_id: cameraId,
          phone_number: phoneNumber
        }]);

      if (error) {
        console.error("Error creating subscription:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-subscriptions'] });
      toast({
        title: "Success",
        description: "Alert subscription created successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to create alert subscription: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alert_subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-subscriptions'] });
      toast({
        title: "Success",
        description: "Alert subscription deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete alert subscription.",
        variant: "destructive"
      });
    }
  });

  if (camerasLoading || subscriptionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader
        title="Fire Alert Subscriptions"
        description="Get SMS notifications when cameras detect potential fires"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <AlertSubscriptionForm
          cameras={cameras}
          onSubmit={(values: SubscriptionFormValues) => createSubscription.mutate(values)}
          isLoading={createSubscription.isPending}
        />
        <CurrentSubscriptions
          subscriptions={subscriptions}
          cameras={cameras}
          onDelete={(id) => deleteSubscription.mutate(id)}
          isLoading={deleteSubscription.isPending}
        />
      </div>
    </div>
  );
};