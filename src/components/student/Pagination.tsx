interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  totalPages,
  currentPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    // Show up to 5 page numbers, with ellipsis if needed
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex justify-center w-full mt-6">
      <div className="flex items-center gap-1 rounded-lg bg-base-200 p-1 shadow-md">
        <button
          className="btn btn-sm btn-circle bg-base-100 hover:bg-primary hover:text-white transition-colors"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {getPages().map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={p}
              className={`btn btn-sm min-w-[2.5rem] transition-all ${
                currentPage === p 
                  ? "bg-primary text-primary-content font-bold" 
                  : "bg-base-100 hover:bg-base-300"
              }`}
              onClick={() => onPageChange(p)}
              aria-current={currentPage === p ? "page" : undefined}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-base-content/70">
              {p}
            </span>
          )
        )}
        <button
          className="btn btn-sm btn-circle bg-base-100 hover:bg-primary hover:text-white transition-colors"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
