import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}) => {
  const [showPageInput, setShowPageInput] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Focus the input when it appears
  useEffect(() => {
    if (showPageInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPageInput]);

  // Keep the input box in sync with currentPage when page changes externally
  useEffect(() => {
    setPageInput(currentPage.toString());
    // Hide input if page changes, unless it was specifically clicked to show
    if (showPageInput && Number(pageInput) !== currentPage) {
      setShowPageInput(false);
    }
  }, [currentPage]); // Only depend on currentPage

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Number of pages to show on each side of current page

    // Always show first page
    if (totalPages >= 1) {
      pages.push(1);
    }

    // Add ellipsis if there's a gap before current pages
    if (currentPage - delta > 2 && totalPages > 2) {
      pages.push('...');
    }

    // Add pages around current page
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) { // Ensure we don't duplicate first/last page
        pages.push(i);
      }
    }

    // Add ellipsis if there's a gap after current pages
    if (currentPage + delta < totalPages - 1 && totalPages > 2) {
      pages.push('...');
    }

    // Always show last page (if it's not the first page and total pages > 1)
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    // Filter out duplicates if any (e.g., if totalPages is small)
    return Array.from(new Set(pages));
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNumber = Number(pageInput);
      if (pageNumber > 0 && pageNumber <= totalPages) {
        onPageChange(pageNumber);
        setShowPageInput(false); // Hide input after successful navigation
      } else {
        // Optionally, reset to current page or show an error
        setPageInput(currentPage.toString());
        // Could also add a temporary error message here
      }
    } else if (e.key === 'Escape') { // Allow hiding with Escape key
      setShowPageInput(false);
      setPageInput(currentPage.toString()); // Reset value on escape
    }
  };

  const handleEllipsisClick = () => {
    setShowPageInput(true);
  };

  // Handle click outside the input to hide it
  const handleClickOutside = (event: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
      setShowPageInput(false);
      setPageInput(currentPage.toString()); // Reset value when clicking outside
    }
  };

  useEffect(() => {
    if (showPageInput) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPageInput, currentPage]); // Added currentPage to dependencies for reset on click outside

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or no data
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      {/* Mobile view */}
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">{startItem}</span>
            {' '}to{' '}
            <span className="font-medium">{endItem}</span>
            {' '}of{' '}
            <span className="font-medium">{totalItems}</span>
            {' '}results
          </p>
        </div>
        <div className="flex items-center space-x-0"> {/* Adjusted spacing */}
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => {
                onPageChange(currentPage - 1);
                setShowPageInput(false); // Hide input on prev/next clicks
              }}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Page numbers / Input */}
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return showPageInput ? (
                  <input
                    key={`page-input`}
                    ref={inputRef}
                    type="text"
                    value={pageInput}
                    onChange={handlePageInputChange}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={() => { // Hide on blur if not valid or not handled by enter
                        if (inputRef.current && inputRef.current.value !== currentPage.toString()) {
                            const pageNumber = Number(inputRef.current.value);
                            if (pageNumber > 0 && pageNumber <= totalPages) {
                                onPageChange(pageNumber);
                            }
                        }
                        setShowPageInput(false);
                        setPageInput(currentPage.toString()); // Reset to current page on blur
                    }}
                    className="w-16 h-full px-2 py-2 border border-blue-500 rounded-md shadow-sm text-sm text-center focus:outline-none focus:ring-blue-500 focus:border-blue-500 z-20"
                    placeholder="Go to"
                  />
                ) : (
                  <button
                    key={`ellipsis-${index}`}
                    onClick={handleEllipsisClick}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    ...
                  </button>
                );
              }

              const pageNumber = page as number;
              const isCurrentPage = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => {
                    onPageChange(pageNumber);
                    setShowPageInput(false); // Hide input when a page number is clicked
                  }}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next button */}
            <button
              onClick={() => {
                onPageChange(currentPage + 1);
                setShowPageInput(false); // Hide input on prev/next clicks
              }}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;