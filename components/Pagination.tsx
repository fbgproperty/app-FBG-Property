
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}) => {
  const getPages = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Number of pages to show before and after current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - delta - 1) || 
        (i === currentPage + delta + 1)
      ) {
        pages.push('...');
      }
    }
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Result Info Section */}
      <div className="order-2 md:order-1 px-6 py-3 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
          Hiển thị <span className="text-slate-900 tabular-nums">{(currentPage - 1) * itemsPerPage + 1}</span> 
          <span className="mx-1.5 text-slate-300">/</span> 
          <span className="text-slate-900 tabular-nums">{Math.min(currentPage * itemsPerPage, totalItems)}</span> 
          <span className="ml-3 text-indigo-600">Tổng số: {totalItems.toLocaleString()}</span>
        </p>
      </div>

      {/* Main Pagination Controls */}
      <nav className="order-1 md:order-2 flex items-center gap-1.5 p-1.5 bg-white border border-slate-100 rounded-[1.5rem] shadow-xl shadow-slate-200/40 ring-1 ring-slate-50">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all disabled:opacity-20 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <div className="w-10 h-10 flex items-center justify-center text-slate-300">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`
                    w-11 h-11 flex items-center justify-center rounded-2xl text-xs font-black transition-all duration-300
                    ${currentPage === page 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 ring-4 ring-indigo-50 z-10' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all disabled:opacity-20 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>

      {/* Quick Jump Info for Power Users (Hidden on mobile) */}
      <div className="hidden xl:flex order-3 px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">
        Trang {currentPage} trên {totalPages}
      </div>
    </div>
  );
};

export default Pagination;

// import React from 'react';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// interface PaginationProps {
//   currentPage: number;
//   totalPages: number;
//   onPageChange: (page: number) => void;
//   totalItems: number;
//   itemsPerPage: number;
// }

// const Pagination: React.FC<PaginationProps> = ({ 
//   currentPage, 
//   totalPages, 
//   onPageChange, 
//   totalItems, 
//   itemsPerPage 
// }) => {
//   if (totalPages <= 1) return null;

//   const startItem = (currentPage - 1) * itemsPerPage + 1;
//   const endItem = Math.min(currentPage * itemsPerPage, totalItems);

//   return (
//     <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100 sm:px-6 mt-4 rounded-b-xl">
//       <div className="flex flex-1 justify-between sm:hidden">
//         <button
//           onClick={() => onPageChange(Math.max(1, currentPage - 1))}
//           disabled={currentPage === 1}
//           className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
//         >
//           Trước
//         </button>
//         <button
//           onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
//           disabled={currentPage === totalPages}
//           className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
//         >
//           Sau
//         </button>
//       </div>
//       <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
//         <div>
//           <p className="text-sm text-gray-700">
//             Hiển thị <span className="font-medium">{startItem}</span> đến <span className="font-medium">{endItem}</span> trong <span className="font-medium">{totalItems}</span> kết quả
//           </p>
//         </div>
//         <div>
//           <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
//             <button
//               onClick={() => onPageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//               className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
//             >
//               <span className="sr-only">Trước</span>
//               <ChevronLeft className="h-5 w-5" aria-hidden="true" />
//             </button>
            
//             {[...Array(totalPages)].map((_, i) => (
//               <button
//                 key={i + 1}
//                 onClick={() => onPageChange(i + 1)}
//                 className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
//                   currentPage === i + 1
//                     ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
//                     : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
//                 }`}
//               >
//                 {i + 1}
//               </button>
//             ))}

//             <button
//               onClick={() => onPageChange(currentPage + 1)}
//               disabled={currentPage === totalPages}
//               className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
//             >
//               <span className="sr-only">Sau</span>
//               <ChevronRight className="h-5 w-5" aria-hidden="true" />
//             </button>
//           </nav>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Pagination;
