import React, { useEffect, useRef } from "react";
import { X, Image as ImageIcon, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

export default function SpacePreviewModal({
  showSpaceModal,
  setShowSpaceModal,
  goatIcon,
  spaceTabsData,
  activeSpaceTab,
  setActiveSpaceTab,
  activeSpace,
  getImgUrl,
  setPreviewImage,
  setPreviewIndex,
  previewImage,
  previewIndex,
}) {
  const scrollContainerRef = useRef(null);

  const images = activeSpace?.images || [];
  const totalImages = images.length;

  const handlePrev = () => {
    if (totalImages === 0) return;
    const newIndex = previewIndex === 0 ? totalImages - 1 : previewIndex - 1;
    setPreviewIndex(newIndex);
    setPreviewImage(getImgUrl(images[newIndex]));
  };

  const handleNext = () => {
    if (totalImages === 0) return;
    const newIndex = previewIndex === totalImages - 1 ? 0 : previewIndex + 1;
    setPreviewIndex(newIndex);
    setPreviewImage(getImgUrl(images[newIndex]));
  };

  // Khóa cuộn trang nền khi mở modal hoặc xem ảnh phóng to, chỉ mở khóa khi tắt
  useEffect(() => {
    if (showSpaceModal || previewImage) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [showSpaceModal, previewImage]);

  // Tự động cuộn đến ảnh đã bấm khi mở danh sách ảnh chi tiết trên mobile
  useEffect(() => {
    if (previewImage && typeof window !== "undefined" && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(
          `space-detail-img-${previewIndex}`
        );
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [previewImage, previewIndex]);

  // Phím Escape (đóng) và ArrowLeft / ArrowRight (chuyển ảnh trên desktop)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (previewImage) {
          setPreviewImage(null);
        } else if (showSpaceModal) {
          setShowSpaceModal(false);
        }
        return;
      }

      // Chỉ áp dụng điều hướng phím mũi tên trên màn hình desktop
      if (previewImage && window.innerWidth >= 768) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, previewIndex, showSpaceModal, activeSpace]);

  if (!showSpaceModal) return null;

  const currentImage = images[previewIndex];
  const currentImgUrl = previewImage ? getImgUrl(previewImage) : "";
  const currentTitle =
    typeof currentImage === "object" && currentImage?.title
      ? currentImage.title
      : `${activeSpace?.label || "Không gian"} • Góc nhìn ${previewIndex + 1}`;
  const currentDesc =
    typeof currentImage === "object" && currentImage?.description
      ? currentImage.description
      : activeSpace?.detailDescription || activeSpace?.description || "";

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-3 sm:px-4 py-3 sm:py-6 touch-none overscroll-none"
        onClick={() => setShowSpaceModal(false)}
      >
        <div
          className="relative w-full max-w-4xl h-[82vh] max-h-[640px] sm:h-[680px] bg-[#fffaf0] rounded-2xl sm:rounded-3xl shadow-2xl p-3.5 sm:p-6 md:p-7 flex flex-col text-left border border-[#eadfcd] touch-auto overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nút đóng modal - luôn nằm riêng, không đè lên chữ */}
          <button
            onClick={() => setShowSpaceModal(false)}
            aria-label="Đóng"
            className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-950/10 hover:bg-emerald-950 text-emerald-950 hover:text-white flex items-center justify-center transition active:scale-90 border border-emerald-900/15"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Tiêu đề gọn gàng trên 1 dòng, chừa lề cho nút đóng */}
          <h2 className="text-base sm:text-2xl md:text-3xl font-black text-green-900 uppercase text-center tracking-tight px-9 shrink-0">
            Không gian nhà hàng
          </h2>

          {/* Dải phân cách biểu tượng dê núi */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-1.5 sm:mt-2.5 mb-2.5 sm:mb-4 shrink-0">
            <div className="w-8 sm:w-16 h-px bg-[#d6a84f]/60" />
            <img src={goatIcon} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            <div className="w-8 sm:w-16 h-px bg-[#d6a84f]/60" />
          </div>

          {/* Thanh chuyển tab phân bổ đều 1 hàng gọn đẹp */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 mb-2.5 sm:mb-3.5 shrink-0 bg-[#f4ebdc]/70 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-[#eadfcd]">
            {spaceTabsData.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSpaceTab(tab.key)}
                className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[11.5px] sm:text-sm transition-all duration-200 text-center truncate active:scale-95 ${
                  activeSpaceTab === tab.key
                    ? "bg-green-900 text-white shadow-xs"
                    : "text-green-900 hover:bg-white/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mô tả không gian hiện tại - cố định chiều cao tối thiểu chống giật cục */}
          <div className="mb-2.5 sm:mb-3.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white border border-[#eadfcd]/70 text-[11px] sm:text-xs text-gray-700 shrink-0 shadow-2xs min-h-[44px] sm:min-h-[48px] flex items-center">
            <p className="font-medium leading-relaxed">
              {activeSpace?.detailDescription || activeSpace?.description || "Không gian thoáng mát, ấm cúng và lịch sự."}
            </p>
          </div>

          {/* Danh sách ảnh không gian */}
          <div className="flex-1 overflow-y-auto pr-0.5 sm:pr-1 min-h-0 flex flex-col">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {images.map((image, index) => {
                  const imgUrl = getImgUrl(image);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setPreviewImage(imgUrl);
                        setPreviewIndex(index);
                      }}
                      className="h-28 sm:h-36 md:h-44 rounded-xl sm:rounded-2xl overflow-hidden border border-[#eadfcd] group relative bg-gray-100 shrink-0 active:scale-95 transition duration-300 text-left"
                    >
                      <img
                        src={imgUrl}
                        alt={image?.title || activeSpace.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {/* Huy hiệu zoom */}
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition shadow-xs">
                        <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      {typeof image !== "string" && image.title && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 sm:p-2 text-left">
                          <p className="text-white text-[10px] sm:text-xs font-bold truncate">
                            {image.title}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-400">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-50/50 flex items-center justify-center text-green-800 mb-2 shadow-inner">
                  <ImageIcon size={24} className="sm:w-8 sm:h-8" />
                </div>
                <p className="font-bold text-xs sm:text-sm text-green-900">
                  Chưa có hình ảnh nào cho không gian này
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  Hình ảnh không gian thực tế sẽ sớm được cập nhật
                </p>
              </div>
            )}
          </div>

          {/* Gợi ý tương tác bên dưới */}
          <p className="text-center text-[11px] sm:text-xs text-gray-500 mt-2 sm:mt-3 shrink-0 flex items-center justify-center gap-1.5">
            <ZoomIn className="w-3.5 h-3.5 text-emerald-800" />
            <span className="md:hidden">Chạm vào ảnh để xem danh sách chi tiết và ghi chú</span>
            <span className="hidden md:inline">Nhấp vào ảnh để xem ảnh phóng to</span>
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. GIAO DIỆN XEM ẢNH TRÊN MOBILE (Cuộn dọc, không có nút che ảnh) */}
      {/* ============================================================== */}
      {previewImage && (
        <div
          ref={scrollContainerRef}
          className="flex md:hidden fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md overflow-y-auto overscroll-contain flex-col animate-[fadeIn_0.2s_ease-out]"
        >
          {/* Thanh tiêu đề dính cố định trên cùng */}
          <header className="sticky top-0 z-30 w-full bg-neutral-950/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="min-w-0 pr-2">
              <h3 className="text-white font-black text-base truncate">
                {activeSpace?.label || "Không gian nhà hàng"}
              </h3>
            </div>

            <button
              onClick={() => setPreviewImage(null)}
              aria-label="Đóng xem ảnh"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition border border-white/15 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Danh sách ảnh cuộn dọc trên mobile */}
          <main className="w-full px-3.5 py-4 space-y-6 flex-1">
            {images.map((image, index) => {
              const imgUrl = getImgUrl(image);
              const isCover = typeof image === "object" && image?.isCover;
              const title =
                typeof image === "object" && image?.title
                  ? image.title
                  : `${activeSpace?.label || "Không gian"} • Góc nhìn ${index + 1}`;
              const description =
                typeof image === "object" && image?.description
                  ? image.description
                  : activeSpace?.detailDescription || activeSpace?.description || "";

              return (
                <article
                  key={index}
                  id={`space-detail-img-${index}`}
                  className="bg-neutral-900/90 rounded-2xl overflow-hidden border border-white/10 shadow-2xl scroll-mt-16 flex flex-col"
                >
                  {/* Thanh thông tin số thứ tự ảnh */}
                  <div className="px-3.5 py-2.5 bg-neutral-950/80 flex items-center justify-between border-b border-white/5">
                    <span className="text-[11px] font-bold text-gray-300 tracking-wider">
                      ẢNH {index + 1} / {totalImages}
                    </span>
                    {isCover && (
                      <span className="text-[10px] font-bold text-[#d6a84f] bg-[#d6a84f]/15 border border-[#d6a84f]/30 px-2 py-0.5 rounded-full">
                        Ảnh tiêu biểu
                      </span>
                    )}
                  </div>

                  {/* Hình ảnh hiển thị đầy đủ, không bị nút che */}
                  <div className="w-full bg-black/60 flex items-center justify-center min-h-[200px]">
                    <img
                      src={imgUrl}
                      alt={title}
                      className="w-full h-auto max-h-[75vh] object-contain"
                      loading={index < 2 ? "eager" : "lazy"}
                    />
                  </div>

                  {/* Ghi chú và mô tả chi tiết của ảnh */}
                  <div className="p-3.5 bg-neutral-900/95 flex flex-col">
                    <h4 className="text-white font-bold text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d6a84f] shrink-0" />
                      <span>{title}</span>
                    </h4>
                    {description && (
                      <p className="text-xs text-neutral-300 leading-relaxed mt-1.5 pl-3 border-l-2 border-[#d6a84f]/60">
                        {description}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}

            {/* Chân trang danh sách ảnh */}
            <div className="pt-2 pb-8 text-center text-xs text-gray-500">
              Đã hiển thị tất cả ảnh của {activeSpace?.label}
            </div>
          </main>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 2. GIAO DIỆN XEM ẢNH TRÊN MÁY TÍNH / DESKTOP (Lướt qua trái / phải ‹ ›) */}
      {/* ====================================================================== */}
      {previewImage && (
        <div className="hidden md:flex fixed inset-0 z-[10000] bg-black/92 backdrop-blur-md flex-col items-center justify-between p-6 select-none animate-[fadeIn_0.2s_ease-out]">
          {/* Thanh tiêu đề trên cùng desktop */}
          <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <h3 className="text-white font-black text-lg">
                {activeSpace?.label || "Không gian nhà hàng"}
              </h3>
              <span className="text-xs font-bold text-gray-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                {previewIndex + 1} / {totalImages}
              </span>
            </div>

            <button
              onClick={() => setPreviewImage(null)}
              aria-label="Đóng xem ảnh"
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition border border-white/15"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Khung ảnh trung tâm kèm 2 nút qua lại trái / phải */}
          <main className="relative w-full max-w-6xl flex-1 flex items-center justify-center my-3">
            {/* Nút lướt qua trái */}
            {totalImages > 1 && (
              <button
                onClick={handlePrev}
                aria-label="Ảnh trước"
                className="absolute left-2 lg:left-4 z-20 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition backdrop-blur-md border border-white/20 active:scale-90 shadow-2xl group"
              >
                <ChevronLeft className="w-7 h-7 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Ảnh và phần ghi chú */}
            <div className="flex flex-col items-center max-w-4xl max-h-full">
              <img
                src={currentImgUrl}
                alt={currentTitle}
                className="max-h-[66vh] max-w-[76vw] object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              {/* Ghi chú ảnh trên desktop */}
              {(currentTitle || currentDesc) && (
                <div className="mt-3.5 px-6 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-center max-w-2xl">
                  {currentTitle && (
                    <p className="text-white font-bold text-sm sm:text-base">
                      {currentTitle}
                    </p>
                  )}
                  {currentDesc && (
                    <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                      {currentDesc}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Nút lướt qua phải */}
            {totalImages > 1 && (
              <button
                onClick={handleNext}
                aria-label="Ảnh sau"
                className="absolute right-2 lg:right-4 z-20 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition backdrop-blur-md border border-white/20 active:scale-90 shadow-2xl group"
              >
                <ChevronRight className="w-7 h-7 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </main>

          {/* Phím tắt hỗ trợ trên desktop */}
          <footer className="w-full max-w-6xl mx-auto flex items-center justify-center gap-2 pt-2 text-xs text-white/50">
            <span>← / → : Chuyển ảnh</span>
            <span>•</span>
            <span>ESC : Đóng</span>
          </footer>
        </div>
      )}
    </>
  );
}
