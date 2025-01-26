import { Loader } from "lucide-react";

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader className="h-12 w-12 text-primary animate-spin" />
  </div>
);