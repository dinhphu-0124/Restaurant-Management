import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { spaceService } from "../services/spaceService";
import { socket } from "../utils/socket";
import SpacePreviewModal from "../components/home/SpacePreviewModal";
import { BACKEND_URL } from "../config/api";

import {
  Leaf,
  Phone,
  Mountain,
  Store,
  Users,
  Trophy,
  ArrowRight,
  ExternalLink,
  CalendarDays,
  ShieldCheck,
  ChefHat,
  Heart,
  Star,
  Quote,
  Utensils,
  ImageIcon,
} from "lucide-react";

import hero1 from "../assets/images/Home/hero-1.png";
import hero3 from "../assets/images/Home/hero-3.png";

import cauChuyenHS from "../assets/images/About/cau-chuyen-HS.png";
import goatIcon from "../assets/images/Icon_De.png";

import deNui from "../assets/images/About/de-nui.png";
import camBu from "../assets/images/About/cam-bu.png";
import nhungHuou from "../assets/images/About/nhung-huou.png";

import baoHaTinhLogo from "../assets/images/About/logo-BHT.png";
import baoCongLuanLogo from "../assets/images/About/logo-BCL.png";
import qdndLogo from "../assets/images/About/logo-QDND.png";

import rungNui from "../assets/images/About/nui-rung.png";
import deAnCo from "../assets/images/About/de-an-co.png";
import tuyenChon from "../assets/images/About/tuyen-chon.png";
import dauBep from "../assets/images/About/dau-bep.png";
import monAn from "../assets/images/About/mon-an.png";

import tangTret from "../assets/images/About/tang-tret.png";
import tangHai from "../assets/images/About/tang-hai.png";
import phongVip from "../assets/images/About/phong-vip.png";
import tiecSN from "../assets/images/About/tiec-sinh-nhat.png";

function AboutPage() {
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState([]);
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [activeSpaceTab, setActiveSpaceTab] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const getImgUrl = (img) => {
    if (!img) return "";
    const url = typeof img === "string" ? img : img.url || img.image || "";
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    if (url.startsWith("/uploads/")) {
      return `${BACKEND_URL}${url}`;
    }
    return url;
  };

  const fetchActiveSpaces = async () => {
    try {
      const data = await spaceService.getActiveSpaces();
      if (Array.isArray(data)) {
        setSpaces(data);
        if (!activeSpaceTab && data.length > 0) {
          setActiveSpaceTab(data[0].key);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách không gian:", err);
    }
  };

  useEffect(() => {
    fetchActiveSpaces();

    const handleUpdate = () => fetchActiveSpaces();
    window.addEventListener("spacesUpdated", handleUpdate);
    socket.on("spaces_updated", handleUpdate);
    socket.on("areas_updated", handleUpdate);

    return () => {
      window.removeEventListener("spacesUpdated", handleUpdate);
      socket.off("spaces_updated", handleUpdate);
      socket.off("areas_updated", handleUpdate);
    };
  }, []);

  const activeSpace = spaces.find((s) => s.key === activeSpaceTab) || spaces[0] || null;

  const timeline = [
    {
      year: "2008",
      title: "Khởi nguồn",
      icon: <Mountain />,
      text: "Khởi nguồn từ tình yêu với ẩm thực quê hương Hương Sơn.",
    },
    {
      year: "2012",
      title: "Nhà hàng đầu tiên",
      icon: <Store />,
      text: "Nhà hàng Dê Hương Sơn đầu tiên chính thức được ra đời.",
    },
    {
      year: "2018",
      title: "1000+ khách hàng",
      icon: <Users />,
      text: "Phục vụ hơn 1000+ khách hàng, được yêu mến và tin tưởng lựa chọn.",
    },
    {
      year: "2026",
      title: "Không ngừng vươn xa",
      icon: <Trophy />,
      text: "Tiếp tục nâng tầm thương hiệu, mang đặc sản Hương Sơn đến muôn nơi.",
    },
  ];

  const specialties = [
    {
      name: "Dê núi Hương Sơn",
      image: deNui,
      text: "Là giống dê cỏ được chăn thả tự nhiên trên các đồi núi. Thịt dê săn chắc, có độ dai ngọt tự nhiên, rất ít mỡ",
      link: "https://baohatinh.vn/de-nui-huong-son-post66810.html",
    },
    {
      name: "Nhung hươu Hương Sơn",
      image: nhungHuou,
      text: "Dược liệu quý giúp bồi bổ cơ thể, tăng cường sinh lực và nâng cao hệ miễn dịch.",
      link: "https://baohatinh.vn/nhung-huou-huong-son-duoc-lieu-vang-danh-cho-suc-khoe-post271332.html",
    },
    {
      name: "Cam bù Hương Sơn",
      image: camBu,
      text: "Đặc sản trứ danh, quả to tròn, ngọt thanh, mọng nước. Mang vị ngọt thanh lẫn chút chua dịu và hương thơm tinh dầu rất đặc trưng",
      link: "https://baohatinh.vn/huong-vi-cam-bu-ha-tinh-post225864.html",
    },
  ];

  const news = [
    {
      source: "Báo Hà Tĩnh",
      logo: baoHaTinhLogo,
      title: "Hương Sơn non nước hữu tình",
      link: "https://baohatinh.vn/huong-son-non-nuoc-huu-tinh-post258123.html",
    },
    {
      source: "Báo Hà Tĩnh",
      logo: baoHaTinhLogo,
      title: "Hương Sơn – vùng đất giàu tiềm năng phát triển du lịch",
      link: "https://baohatinh.vn/huong-son-trong-tieng-vong-ngan-xua-post272388.html",
    },
    {
      source: "Báo Công Luận",
      logo: baoCongLuanLogo,
      title: "Đất và người - xứ sở “Núi tỏa hương”",
      link: "https://congluan.vn/dat-va-nguoi-xu-so-nui-toa-huong-post58306.html",
    },
    {
      source: "Quân đội Nhân dân",
      logo: qdndLogo,
      title: "Câu chuyện tình nghĩa ở Hương Sơn",
      link: "https://www.qdnd.vn/quoc-phong-an-ninh/xay-dung-quan-doi/cau-chuyen-tinh-nghia-o-huong-son-520531",
    },
  ];

  const processSteps = [
    {
      number: "01",
      icon: <Mountain />,
      title: "Núi rừng Hương Sơn",
      text: "Vùng đất trong lành, khí hậu mát mẻ, thảm thực vật phong phú và nguồn nước trong lành từ núi rừng.",
      image: rungNui,
    },
    {
      number: "02",
      icon: <Leaf />,
      title: "Dê núi Hương Sơn",
      text: "Được chăn thả tự nhiên trên các triền núi đá, ăn lá cây rừng và thảo mộc bản địa, thịt săn chắc, đậm vị.",
      image: deAnCo,
    },
    {
      number: "03",
      icon: <ShieldCheck />,
      title: "Tuyển chọn kỹ lưỡng",
      text: "Lựa chọn kỹ lưỡng từng con dê từ nguồn nguyên liệu tươi ngon, đảm bảo chất lượng.",
      image: tuyenChon,
    },
    {
      number: "04",
      icon: <ChefHat />,
      title: "Chế biến truyền thống",
      text: "Chế biến theo công thức truyền thống, giữ trọn hương vị đặc trưng.",
      image: dauBep,
    },
    {
      number: "05",
      icon: <Utensils />,
      title: "Tinh hoa trong từng món ăn",
      text: "Mang hương vị núi rừng đến bàn ăn của bạn.",
      image: monAn,
    },
  ];

  const values = [
    {
      icon: <ShieldCheck />,
      title: "Tươi ngon",
      text: "Nguyên liệu tuyển chọn mỗi ngày.",
    },
    {
      icon: <ChefHat />,
      title: "Truyền thống",
      text: "Công thức giữ trọn vị quê.",
    },
    { icon: <Heart />, title: "Tận tâm", text: "Phục vụ chu đáo, thân thiện." },
    { icon: <Star />, title: "Chất lượng", text: "Cam kết trong từng món ăn." },
  ];

  const reviews = [
    {
      name: "Anh Tuấn",
      address: "Hà Tĩnh",
      text: "Thịt dê tươi, chế biến đậm vị, không gian sạch sẽ và phục vụ rất nhiệt tình.",
    },
    {
      name: "Chị Hương",
      address: "Vinh, Nghệ An",
      text: "Lẩu dê ngon, nước dùng ngọt thanh, rất hợp cho gia đình cuối tuần.",
    },
    {
      name: "Anh Dũng",
      address: "Đồng Hới, Quảng Bình",
      text: "Phòng riêng đẹp, yên tĩnh, phù hợp tiếp khách và tổ chức sinh nhật.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbf7ec] text-green-950">
      {/* SƯƠNG MỜ */}
      <div className="fog fog-1"></div>
      <div className="fog fog-2"></div>
      <div className="leaf-float">
        <span>🍂</span>
        <span>🍁</span>
        <span>🍂</span>
        <span>🍁</span>
        <span>🍂</span>
        <span>🍁</span>
        <span>🍂</span>
        <span>🍁</span>
      </div>

      {/* HERO */}
      <section
        className="relative min-h-screen bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(251,247,236,.96) 0%, rgba(251,247,236,.78) 35%, rgba(251,247,236,.18) 65%), url(${hero1})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-5 min-h-[calc(100vh-64px)] flex items-center">
          <div className="max-w-3xl pt-8">
            <p
              className="text-5xl md:text-7xl text-[#c99a45] mb-1 leading-none"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              Giới thiệu
            </p>

            <h1
              className=" text-5xl md:text-[76px] text-[#145c30] leading-[1.15] uppercase max-w-3xl"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 800,
              }}
            >
              Dê Hương Sơn <br /> Hà Tĩnh
            </h1>

            <div className="w-28 h-1 bg-[#c99a45] rounded-full mt-6 mb-7"></div>

            <p className="text-gray-700 max-w-xl leading-8 text-lg">
              Hơn 15 năm gìn giữ hương vị đặc sản núi rừng Hà Tĩnh, mang đến
              trải nghiệm ẩm thực đậm đà, gần gũi và tinh tế.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm md:text-base text-green-800 font-black">
              <span>✓ Đặc sản dê núi Hương Sơn</span>
              <span>✓ Không gian rộng rãi</span>
              <span>✓ Phòng VIP riêng tư</span>
            </div>

            <div className="mt-9 flex flex-col sm:flex-row gap-4">
              <div className="booking-wrapper">
                <button
                  onClick={() => navigate("/booking")}
                  className="bg-[#c99a45] hover:bg-[#b88935] text-white px-9 md:px-11 py-4 rounded-full font-black text-base border-[3px] border-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-3"
                >
                  <CalendarDays className="w-5 h-5" />
                  Đặt bàn ngay
                </button>
              </div>

              <button
                onClick={() => navigate("/menu")}
                className="bg-white/90 backdrop-blur text-green-800 px-9 md:px-11 py-4 rounded-full font-black text-base border-2 border-green-800 shadow-md transition-all duration-300 hover:bg-green-800 hover:text-white hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-3"
              >
                <Utensils className="w-5 h-5" />
                Xem thực đơn
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="relative bg-[#fbf7ec] px-5 py-10 md:py-14 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title="Hành trình thương hiệu" />

          <div className="relative mt-10">
            {/* LINE CHÍNH */}
            <div className="hidden lg:block absolute top-[42px] left-[10%] right-[10%]">
              <div className="relative h-px bg-[#d8b46a]">
                <span className="absolute left-[16.66%] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#d8b46a]" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#d8b46a]" />
                <span className="absolute right-[16.66%] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#d8b46a]" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-8 relative z-10">
              {timeline.map((item) => (
                <div key={item.year} className="text-center">
                  {/* ICON */}
                  <div className="relative flex items-center justify-center mb-5">
                    <div className="w-[82px] h-[82px] rounded-full bg-[#fbf7ec] border-2 border-[#d8b46a] shadow-[0_0_0_7px_rgba(216,180,106,0.12)] flex items-center justify-center text-green-900 shrink-0 z-10">
                      <div className="w-11 h-11 flex items-center justify-center [&>svg]:w-9 [&>svg]:h-9">
                        {item.icon}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-[28px] font-black text-green-900 leading-none">
                    {item.year}
                  </h3>

                  <p className="mt-3 font-black text-green-900 text-base">
                    {item.title}
                  </p>

                  <p className="mt-5 text-sm text-gray-600 leading-7 max-w-[230px] mx-auto">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="max-w-7xl mx-auto px-5 pb-10">
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Ảnh bên trái */}
          <div className="h-[405px] rounded-3xl overflow-hidden shadow-md">
            <img
              src={cauChuyenHS}
              alt="Hương Sơn Hà Tĩnh"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Nội dung bên phải */}
          <div className="h-[405px] bg-[#fffaf0] border border-[#eadfcd] rounded-3xl shadow-sm relative overflow-hidden">
            <img
              src={goatIcon}
              alt=""
              className="absolute right-4 bottom-4 w-52 opacity-[0.09] pointer-events-none select-none"
            />
            <div className="h-full flex flex-col p-6">
              {/* Tiêu đề */}
              <div className="shrink-0">
                <h2 className="text-2xl font-black text-[#145c30] uppercase">
                  Câu chuyện Hương Sơn
                </h2>

                <div className="w-16 h-1 bg-[#d6a84f] rounded-full mt-3"></div>
              </div>

              {/* Nội dung cuộn */}
              <div className="flex-1 overflow-y-auto pr-3 mt-4 custom-scroll">
                <p className="text-gray-700 leading-relaxed">
                  Giữa miền sơn cước phía Tây Hà Tĩnh, Hương Sơn hiện lên với
                  những dãy núi trùng điệp, dòng suối mát lành và những cánh
                  đồng trải dài theo thung lũng.
                </p>

                <p className="text-gray-700 leading-relaxed mt-4">
                  Thiên nhiên ưu đãi đã tạo nên một vùng đất giàu sản vật, nơi
                  dê núi được chăn thả tự nhiên trên các triền đồi, cam bù chín
                  vàng trong nắng và hươu sao mang đến nguồn nhung quý nổi tiếng
                  khắp cả nước.
                </p>

                <p className="text-gray-700 leading-relaxed mt-4">
                  Không chỉ là quê hương của những đặc sản trứ danh, Hương Sơn
                  còn lưu giữ những giá trị văn hóa, lịch sử và tinh thần hiếu
                  khách của người dân miền núi Hà Tĩnh.
                </p>

                <p className="text-gray-700 leading-relaxed mt-4">
                  Chính từ nguồn cảm hứng ấy, Dê Hương Sơn ra đời như một cách
                  kể lại câu chuyện quê hương bằng hương vị, để mỗi thực khách
                  đều cảm nhận được nét đẹp của vùng đất này qua từng món ăn.
                </p>
              </div>

              {/* Nút */}
              <div className="pt-4 shrink-0">
                <a
                  href="https://baohatinh.vn/de-huong-son-ha-tinh-duoc-cap-giay-chung-nhan-dang-ky-nhan-hieu-post307752.html"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-950 inline-flex items-center gap-2"
                >
                  Tìm hiểu thêm về Dê Hương Sơn
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALTY */}
      <section className="max-w-7xl mx-auto px-5 pb-8">
        <SectionTitle title="Đặc sản Hương Sơn" />

        <div className="grid md:grid-cols-3 gap-5 mt-7">
          {specialties.map((item) => (
            <div
              key={item.name}
              className="bg-white border border-[#eadfcd] rounded-2xl shadow-sm overflow-hidden grid grid-cols-[45%_55%] h-[220px]"
            >
              <div className="h-full overflow-hidden bg-[#fbf7ec]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 flex flex-col h-full">
                <h3 className="font-black text-green-900 uppercase text-[12px] md:text-[13px] leading-snug whitespace-nowrap">
                  {item.name}
                </h3>

                <p className="text-sm text-gray-600 mt-3 leading-6 line-clamp-3">
                  {item.text}
                </p>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className=" mt-auto inline-flex items-center gap-2 text-sm font-bold text-green-900 border border-green-900 px-4 py-2.5 rounded-lg hover:bg-green-900 hover:text-white w-fit transition"
                >
                  Tìm hiểu thêm <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWS */}
      <section className="max-w-7xl mx-auto px-5 pb-10">
        <SectionTitle title="Báo chí nói về Hương Sơn" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
          {news.map((item) => (
            <a
              key={item.title}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="bg-white border border-[#eadfcd] rounded-2xl p-4 shadow-sm transition-all duration-300 hover:bg-[#fffaf0] hover:border-[#d6a84f] hover:shadow-xl hover:-translate-y-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <img
                  src={item.logo}
                  alt={item.source}
                  className="w-20 h-12 object-contain shrink-0"
                />

                <p className="text-sm text-[#b88935] font-black">
                  {item.source}
                </p>
              </div>
              <h3 className="font-black text-green-900 text-lg leading-snug min-h-[72px]">
                {item.title}
              </h3>
              <p className="mt-auto pt-5 text-sm font-bold text-green-800 flex items-center gap-1">
                Xem bài viết <ExternalLink className="w-3 h-3" />
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="relative max-w-7xl mx-auto px-5 pb-14 overflow-hidden">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-2 text-[#c99a45]">
            <span className="hidden sm:block w-10 h-px bg-[#d6a84f]"></span>

            <p
              className="text-3xl md:text-4xl tracking-[2px]"
              style={{ fontFamily: "'Allura', cursive" }}
            >
              Hành trình đặc sản
            </p>

            <span className="hidden sm:block w-10 h-px bg-[#d6a84f]"></span>
          </div>

          <SectionTitle title="Từ núi rừng đến bàn ăn" />

          <p className="mt-5 text-gray-600 max-w-xl mx-auto leading-7"></p>
        </div>

        <div className="relative mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
            {processSteps.map((item) => (
              <Process
                key={item.number}
                number={item.number}
                title={item.title}
                text={item.text}
                image={item.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SPACE */}
      <section className="max-w-7xl mx-auto px-5 pb-10">
        <SectionTitle title="Không gian nhà hàng" />

        {spaces.length === 0 ? (
          <div className="py-12 text-center text-gray-400 font-medium text-sm mt-7">
            Đang tải không gian nhà hàng...
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 mt-7">
            {/* Card 1 */}
            {spaces[0] && (
              <ImageCard
                image={getImgUrl(spaces[0].coverImage || spaces[0].images?.[0]) || tangTret}
                title={spaces[0].label}
                text={spaces[0].description || "Ấm cúng, phù hợp gia đình."}
                onClick={() => {
                  setActiveSpaceTab(spaces[0].key);
                  setShowSpaceModal(true);
                }}
              />
            )}

            {/* Card 2 */}
            {spaces[1] && (
              <ImageCard
                image={getImgUrl(spaces[1].coverImage || spaces[1].images?.[0]) || tangHai}
                title={spaces[1].label}
                text={spaces[1].description || "Rộng rãi, thoáng mát."}
                onClick={() => {
                  setActiveSpaceTab(spaces[1].key);
                  setShowSpaceModal(true);
                }}
              />
            )}

            {/* Card 3 or extra column */}
            <div className="grid gap-4">
              {spaces[2] && (
                <ImageCard
                  image={getImgUrl(spaces[2].coverImage || spaces[2].images?.[0]) || phongVip}
                  title={spaces[2].label}
                  text={spaces[2].description || "Riêng tư, sang trọng."}
                  small
                  onClick={() => {
                    setActiveSpaceTab(spaces[2].key);
                    setShowSpaceModal(true);
                  }}
                />
              )}

              {spaces[3] ? (
                <ImageCard
                  image={getImgUrl(spaces[3].coverImage || spaces[3].images?.[0]) || tiecSN}
                  title={spaces[3].label}
                  text={spaces[3].description || "Không gian mở, thoáng đãng."}
                  small
                  onClick={() => {
                    setActiveSpaceTab(spaces[3].key);
                    setShowSpaceModal(true);
                  }}
                />
              ) : (
                <ImageCard
                  image={tiecSN}
                  title="Đặt tiệc theo yêu cầu"
                  text="Trang trí và phục vụ theo yêu cầu."
                  small
                  onClick={() => navigate("/booking")}
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* VALUES + STATS */}
      <section className="max-w-7xl mx-auto px-5 pb-10">
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-green-950 rounded-3xl p-6 md:p-8 text-white">
            <h2 className="text-2xl font-black text-[#d6a84f] uppercase mb-6">
              Giá trị cốt lõi
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {values.map((item) => (
                <div key={item.title} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full border border-[#d6a84f] text-[#d6a84f] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="font-black text-[#d6a84f] mt-3 text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/70 mt-2">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-950 rounded-3xl p-6 md:p-8 text-white">
            <h2 className="text-2xl font-black text-[#d6a84f] uppercase mb-6">
              Những con số ấn tượng
            </h2>
            <div className="grid grid-cols-4 gap-4 text-center">
              <Stat number="15+" label="Năm hoạt động" />
              <Stat number="50+" label="Món ăn đặc sản" />
              <Stat number="1000+" label="Khách hàng hài lòng" />
              <Stat number="200+" label="Chỗ ngồi rộng rãi" />
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="max-w-7xl mx-auto px-5 pb-10">
        <SectionTitle title="Khách hàng nói về chúng tôi" />

        <div className="grid md:grid-cols-3 gap-5 mt-7">
          {reviews.map((item) => (
            <div
              key={item.name}
              className="bg-white border border-[#eadfcd] rounded-2xl p-6 shadow-sm"
            >
              <Quote className="w-9 h-9 text-[#d6a84f]/40" />
              <div className="text-[#d6a84f] mt-2">★★★★★</div>
              <p className="text-gray-600 text-sm leading-relaxed mt-3">
                {item.text}
              </p>
              <div className="mt-5">
                <h3 className="font-black text-green-900">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.address}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 pb-12">
        <div
          className="relative overflow-hidden rounded-[32px] bg-cover bg-center border border-[#d6a84f]/40 shadow-xl"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,45,24,.92), rgba(0,65,34,.78), rgba(0,45 24,.45)), url(${hero3})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/75 via-green-950/45 to-transparent" />

          <div className="relative z-10 px-6 md:px-10 py-8 md:py-10 flex flex-col lg:flex-row gap-7 items-center justify-between">
            <div className="text-center lg:text-left">
              <p className="text-[#d6a84f] font-black uppercase tracking-wide">
                Sẵn sàng trải nghiệm
              </p>

              <h2 className="text-2xl md:text-4xl font-black text-[#d6a84f] uppercase mt-2 leading-tight">
                Hương vị dê núi Hương Sơn?
              </h2>

              <p className="text-white/85 mt-3 max-w-2xl leading-7">
                Đặt bàn ngay hôm nay để thưởng thức món đặc sản trong không gian
                ấm cúng và sang trọng.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => navigate("/booking")}
                className="bg-[#d6a84f] text-green-950 px-7 py-3.5 rounded-2xl font-black hover:bg-[#c99a45] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              >
                <CalendarDays className="w-5 h-5" />
                Đặt bàn ngay
              </button>

              <a
                href="tel:0387136878"
                className="bg-green-950/70 text-white px-7 py-3.5 rounded-2xl font-black border border-[#d6a84f] hover:bg-green-900 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              >
                <Phone className="w-5 h-5" />
                038 713 6878
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Popup xem không gian */}
      <SpacePreviewModal
        showSpaceModal={showSpaceModal}
        setShowSpaceModal={setShowSpaceModal}
        goatIcon={goatIcon}
        spaceTabsData={spaces}
        activeSpaceTab={activeSpaceTab}
        setActiveSpaceTab={setActiveSpaceTab}
        activeSpace={activeSpace}
        getImgUrl={getImgUrl}
        setPreviewImage={setPreviewImage}
        setPreviewIndex={setPreviewIndex}
        previewImage={previewImage}
        previewIndex={previewIndex}
      />
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="text-center">
      <h2
        className="text-2xl md:text-[34px] text-[#145c30] uppercase tracking-wide"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 800,
        }}
      >
        {title}
      </h2>

      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="w-24 h-px bg-[#d6a84f]" />

        <img
          src={goatIcon}
          alt="Dê Hương Sơn"
          className="w-8 h-8 object-contain opacity-90"
        />

        <div className="w-24 h-px bg-[#d6a84f]" />
      </div>
    </div>
  );
}

function Process({ number, title, text, image }) {
  return (
    <div className="group text-center">
      <div className="relative">
        {/* KHUNG ẢNH UỐN LƯỢN */}
        <div className=" h-[250px] overflow-hidden bg-white shadow-md border border-[#eadfcd] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl rounded-tl-[34px] rounded-tr-[34px] rounded-bl-[34px] rounded-br-[80px]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        {/* SỐ + ICON */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-green-900 text-[#d8b46a] font-black flex items-center justify-center shadow-lg border-2 border-[#fbf7ec]">
            {number}
          </span>
        </div>
      </div>

      <div className="pt-12">
        <h3 className="font-black text-green-900 uppercase text-sm leading-snug whitespace-nowrap">
          {title}
        </h3>

        <div className="w-10 h-px bg-[#d8b46a] mx-auto my-3"></div>

        <p className="text-sm text-gray-600 leading-6 max-w-[230px] mx-auto">
          {text}
        </p>
      </div>
    </div>
  );
}

function ImageCard({ image, title, text, small = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[32px] shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${small ? "h-[180px]" : "h-[380px]"}`}
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

      <div className="absolute bottom-5 left-5 text-white">
        <h3 className="font-black text-xl">{title}</h3>
        <p className="text-sm text-white/90">{text}</p>
      </div>
    </button>
  );
}

function Stat({ number, label }) {
  return (
    <div>
      <p className="text-3xl md:text-4xl font-black text-[#d6a84f]">{number}</p>
      <p className="text-xs md:text-sm text-white/80 uppercase font-bold mt-2">
        {label}
      </p>
    </div>
  );
}

export default AboutPage;
