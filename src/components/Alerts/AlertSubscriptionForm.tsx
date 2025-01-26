import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Camera } from "../../types/camera";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const formSchema = z.object({
  cameraId: z.string().min(1, "Please select a camera"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
});

interface AlertSubscriptionFormProps {
  cameras: Camera[];
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}

export const AlertSubscriptionForm = ({
  cameras,
  onSubmit,
  isLoading
}: AlertSubscriptionFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cameraId: "",
      phoneNumber: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Alert</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cameraId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Camera</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a camera" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cameras.map((camera) => (
                        <SelectItem key={camera.id} value={camera.id}>
                          {camera.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Alert"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};