import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import goatIcon from "../assets/images/Icon_De.png";
import SEO from "../components/common/SEO";

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#fbfcf0] flex items-center justify-center px-4 py-12">
      <SEO title="404 - Không Tìm Thấy Trang" noindex={true} />
      <div className="w-full max-w-6xl text-center -translate-y-12">
        {/* 404 */}
        <div className="flex items-center justify-center leading-none select-none mb-3 drop-shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
          {/* Số 4 trái */}
          <span className="relative z-10 text-[120px] sm:text-[210px] md:text-[300px] font-black text-[#0b6b35] tracking-[-0.1em]">
            4
          </span>

          {/* Hình bầu dục giả số 0 */}
          <div className="relative z-20 w-[100px] h-[150px] sm:w-[130px] sm:h-[180px] md:w-[175px] md:h-[225px] rounded-full bg-gradient-to-br from-[#1c6b35] via-[#6e8637] to-[#d6a84f] ml-[12px] mr-[4px] sm:ml-[18px] sm:mr-[8px] md:ml-[25px] md:mr-[10px] overflow-hidden">
            <img
              src={goatIcon}
              alt="Dê Hương Sơn"
              className="absolute left-[85%] top-[70%] -translate-x-1/2 -translate-y-1/2 rotate-[13deg] w-[270%] h-[270%] scale-[1.4] object-contain z-50"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(95%) sepia(8%) saturate(200%) hue-rotate(15deg) brightness(102%) contrast(96%)",
              }}
            />
          </div>
          {/* Số 4 phải */}
          <span className="relative z-10 text-[120px] sm:text-[210px] md:text-[300px] font-black text-[#d6a84f] tracking-[-0.1em] ml-[-15px]">
            4
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#07592f] mb-5">
          Không tìm thấy trang
        </h2>

        <p className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-12">
          Có vẻ bạn đã đi lạc khỏi thực đơn của Dê Hương Sơn.<br></br> Hãy quay
          về trang chủ để tiếp tục khám phá món ngon.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-3 px-9 py-4 bg-[#057035] text-white rounded-full font-black text-lg sm:text-xl shadow-xl shadow-green-900/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#045d2d]"
          >
            <Home size={25} strokeWidth={2.6} />
            Về trang chủ
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-3 px-9 py-4 border-[3px] border-[#057035] text-[#057035] bg-transparent rounded-full font-black text-lg sm:text-xl transition-all duration-300 hover:-translate-y-1 hover:bg-green-50"
          >
            <ArrowLeft size={25} strokeWidth={2.6} />
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
