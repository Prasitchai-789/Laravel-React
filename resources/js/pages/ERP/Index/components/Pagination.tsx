export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems = 0,
    itemsPerPage = 10
}) {
    const getVisiblePages = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (!totalPages || totalPages <= 1) return null;

    const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-sm">
            {/* Page Info - Hidden on mobile */}
            <div className="text-sm text-gray-600 hidden sm:block">
                แสดง <span className="font-medium text-gray-900">{startItem}</span>-
                <span className="font-medium text-gray-900">{endItem}</span> จาก
                <span className="font-medium text-gray-900"> {totalItems}</span> รายการ
            </div>

            {/* Mobile Page Info */}
            <div className="text-sm text-gray-600 sm:hidden">
                หน้า <span className="font-medium text-gray-900">{currentPage}</span>/
                <span className="font-medium text-gray-900">{totalPages}</span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all ${
                        currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300'
                    }`}
                    aria-label="หน้าก่อนหน้า"
                >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1">
                    {getVisiblePages().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            className={`min-w-[38px] lg:min-w-[42px] h-9 lg:h-10 rounded-lg text-sm font-medium transition-all ${
                                page === currentPage
                                    ? 'bg-blue-500 text-white shadow-sm border border-blue-600'
                                    : page === '...'
                                    ? 'text-gray-400 cursor-default bg-transparent'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300'
                            }`}
                            disabled={page === '...'}
                            aria-label={page === '...' ? 'หน้าอื่นๆ' : `หน้า ${page}`}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all ${
                        currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300'
                    }`}
                    aria-label="หน้าถัดไป"
                >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Page Navigation - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <span>ไปที่หน้า</span>
                <div className="relative">
                    <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                            const page = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                            onPageChange(page);
                        }}
                        className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        aria-label="หมายเลขหน้าที่ต้องการไป"
                    />
                </div>
                <span>จาก <span className="font-medium text-gray-900">{totalPages}</span></span>
            </div>
        </div>
    );
}
