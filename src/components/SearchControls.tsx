import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "./ui/input";

interface SearchControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortChange: () => void;
}

export const SearchControls = ({
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
}: SearchControlsProps) => {
  return (
    <div className="glass-morphism rounded-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search cameras by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
        <button
          onClick={onSortChange}
          className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-white/5 transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
          </span>
        </button>
      </div>
    </div>
  );
};