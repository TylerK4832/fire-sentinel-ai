import { Camera } from "../../types/camera";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface Subscription {
  id: string;
  camera_id: string;
  phone_number: string;
}

interface CurrentSubscriptionsProps {
  subscriptions: Subscription[];
  cameras: Camera[];
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export const CurrentSubscriptions = ({
  subscriptions,
  cameras,
  onDelete,
  isLoading
}: CurrentSubscriptionsProps) => {
  const getCameraName = (cameraId: string) => {
    return cameras.find(c => c.id === cameraId)?.name || 'Unknown Camera';
  };

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No alert subscriptions yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Camera</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>{getCameraName(subscription.camera_id)}</TableCell>
                <TableCell>{subscription.phone_number}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(subscription.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};