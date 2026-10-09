import React from "react";
import { X, Image as ImageIcon } from "lucide-react";

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
  previewIndex
}) {
  if (!showSpaceModal) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={() => setShowSpaceModal(false)}
      >
        <div
          className="relative w-full max-w-5xl h-[720px] max-h-[90vh] bg-[#fffaf0] rounded-3xl shadow-2xl p-5 md:p-7 flex flex-col text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowSpaceModal(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-green-900 text-white flex items-center justify-center hover:bg-green-950"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl md:text-3xl font-black text-green-900 uppercase text-center shrink-0">
            Không gian nhà hàng
          </h2>

          <div className="flex items-center justify-center gap-3 mt-3 mb-6 shrink-0">
            <div className="w-16 h-px bg-[#d6a84f]" />
            <img src={goatIcon} alt="" className="w-7 h-7 object-contain" />
            <div className="w-16 h-px bg-[#d6a84f]" />
          </div>

          <div className="flex flex-wrap gap-2.5 mb-5 shrink-0 justify-center">
            {spaceTabsData.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSpaceTab(tab.key)}
                className={`px-5 py-2.5 rounded-xl border font-black text-xs md:text-sm transition shadow-sm ${
                  activeSpaceTab === tab.key
                    ? "bg-green-900 text-white border-green-900"
                    : "bg-white text-green-900 border-[#eadfcd] hover:bg-green-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeSpace && (activeSpace.description || activeSpace.detailDescription) && (
            <div className="mb-4 px-4 py-2.5 rounded-2xl bg-white/70 border border-[#eadfcd] text-xs text-gray-700 shrink-0">
              <p className="font-semibold">{activeSpace.detailDescription || activeSpace.description}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1 min-h-0 flex flex-col">
            {(activeSpace?.images || []).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activeSpace.images.map((image, index) => {
                  const imgUrl = getImgUrl(image);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setPreviewImage(imgUrl);
                        setPreviewIndex(index);
                      }}
                      className="h-32 md:h-44 rounded-2xl overflow-hidden border border-[#eadfcd] group relative bg-gray-100 shrink-0 animate-[fadeIn_0.2s_ease-out]"
                    >
                      <img
                        src={imgUrl}
                        alt={activeSpace.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {typeof image !== "string" && image.title && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                          <p className="text-white text-xs font-bold truncate">
                            {image.title}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-green-50/50 flex items-center justify-center text-green-800 mb-3 shadow-inner">
                  <ImageIcon size={32} />
                </div>
                <p className="font-black text-sm text-green-900">
                  Chưa có hình ảnh nào cho không gian này
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Hình ảnh không gian thực tế sẽ sớm được cập nhật
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4 shrink-0">
            Nhấn vào ảnh để xem lớn hơn
          </p>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center px-4 animate-[fadeIn_0.25s_ease-out]">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white text-green-900 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              const newIndex =
                previewIndex === 0
                  ? activeSpace.images.length - 1
                  : previewIndex - 1;

              setPreviewIndex(newIndex);
              setPreviewImage(getImgUrl(activeSpace.images[newIndex]));
            }}
            className="absolute left-5 w-12 h-12 rounded-full bg-white/90 text-green-900 text-3xl flex items-center justify-center"
          >
            ‹
          </button>

          <img
            src={getImgUrl(previewImage)}
            alt=""
            className="max-w-[90vw] max-h-[82vh] object-contain rounded-2xl shadow-2xl"
          />

          <button
            onClick={() => {
              const newIndex =
                previewIndex === activeSpace.images.length - 1
                  ? 0
                  : previewIndex + 1;

              setPreviewIndex(newIndex);
              setPreviewImage(getImgUrl(activeSpace.images[newIndex]));
            }}
            className="absolute right-5 w-12 h-12 rounded-full bg-white/90 text-green-900 text-3xl flex items-center justify-center"
          >
            ›
          </button>

          <div className="absolute top-6 left-6 text-white font-bold">
            {activeSpace.label} - {previewIndex + 1} /{" "}
            {activeSpace.images.length}
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            ← → Chuyển ảnh • ESC Đóng
          </div>
        </div>
      )}
    </>
  );
}
