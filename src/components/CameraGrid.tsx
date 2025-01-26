import { useQuery } from "@tanstack/react-query";
import { getCameras } from "../data/cameras";
import { useToast } from "../hooks/use-toast";
import { useState } from "react";
import { GridHeader } from "./GridHeader";
import { SearchControls } from "./SearchControls";
import { CameraGridView } from "./CameraGridView";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "./ui/pagination";

const CAMERAS_PER_PAGE = 32;
const MAX_VISIBLE_PAGES = 5;

export const CameraGrid = () => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras,
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load cameras.",
          variant: "destructive"
        });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] glass-morphism rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Loading cameras...</p>
        </div>
      </div>
    );
  }

  // Filter and sort cameras
  const filteredCameras = cameras
    .filter(camera => 
      camera.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredCameras.length / CAMERAS_PER_PAGE);
  const startIndex = (currentPage - 1) * CAMERAS_PER_PAGE;
  const endIndex = startIndex + CAMERAS_PER_PAGE;
  const currentCameras = filteredCameras.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

    if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
      startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="container mx-auto px-4 py-8">
      <GridHeader totalCameras={cameras.length} />
      
      <SearchControls
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        sortOrder={sortOrder}
        onSortChange={() => setSortOrder(order => order === "asc" ? "desc" : "asc")}
      />

      <div className="text-sm text-muted-foreground mb-4">
        Showing {currentCameras.length} of {filteredCameras.length} cameras
      </div>

      <CameraGridView cameras={currentCameras} />

      {totalPages > 1 && (
        <Pagination className="mb-8">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            )}

            {pageNumbers[0] > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(1)}
                    className="cursor-pointer"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {pageNumbers[0] > 2 && <PaginationEllipsis />}
              </>
            )}

            {pageNumbers.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => handlePageChange(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <PaginationEllipsis />}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(totalPages)}
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};