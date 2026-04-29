interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 0) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className="inline-flex h-[38px] w-max max-w-full items-center whitespace-nowrap rounded-[14px] border border-[var(--app-border)] bg-white text-[14px] text-slate-500">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isPreviousDisabled}
        className="h-full shrink-0 border-r border-[var(--app-border)] px-5 sm:px-8 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className="flex h-full min-w-[38px] shrink-0 items-center justify-center border-r border-[var(--app-border)] px-3 last:border-r-0"
        >
          <span
            className={
              page === currentPage ? "font-semibold text-[var(--app-blue)]" : ""
            }
          >
            {page}
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isNextDisabled}
        className="h-full shrink-0 px-5 sm:px-8 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        Next
      </button>
    </div>
  );
}
