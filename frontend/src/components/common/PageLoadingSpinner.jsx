export default function PageLoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"></div>
        <div className="absolute h-6 w-6 rounded-full border-2 border-orange-300 border-b-orange-600 animate-spin"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-stone-500 animate-pulse">
        Đang tải dữ liệu hệ thống...
      </p>
    </div>
  );
}
