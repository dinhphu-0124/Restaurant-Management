import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, CalendarDays } from "lucide-react";
import goatIcon from "../assets/images/Icon_De.png";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100088682802201";

function Footer() {
  return (
    <footer className="bg-primary text-white">
      {/* FOOTER */}

      <div className="max-w-7xl mx-auto px-3.5 sm:px-4 md:px-5 py-5 sm:py-7 md:py-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-5 sm:gap-6 md:gap-4 lg:gap-8">
        <div>
          <Link to="/home" className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 group">
            <img
              src={goatIcon}
              alt="Dê Hương Sơn"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain brightness-0 invert group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base md:text-sm lg:text-xl font-bold leading-tight whitespace-nowrap text-white">
                Dê Hương Sơn
              </h3>
              <p className="text-[10.5px] sm:text-xs text-white/70">Hà Tĩnh</p>
            </div>
          </Link>

          <p className="text-white/75 text-[11px] sm:text-xs leading-relaxed max-w-xs">
            Dê núi Hương Sơn – đậm đà bản sắc, tươi ngon, bổ dưỡng.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-xs sm:text-sm md:text-sm lg:text-base mb-2 sm:mb-2.5 md:mb-4 text-white whitespace-nowrap">
            Thông tin liên hệ
          </h3>

          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 text-[11px] sm:text-xs md:text-sm text-white/85">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0 mt-0.5" />

              <a
                href="https://maps.app.goo.gl/wSkET5ThBjNm9f29A"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition leading-snug"
              >
                Đ. Vũ Lăng, Thanh Trì, Hà Nội
              </a>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
              <a href="tel:0387136878" className="hover:text-white transition">
                038 713 6878
              </a>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
              <a
                href="mailto:dehuongsonn.ht@gmail.com"
                className="hover:text-white break-all transition text-[10.5px] sm:text-xs"
              >
                dehuongsonn.ht@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-xs sm:text-sm md:text-sm lg:text-base mb-2 sm:mb-2.5 md:mb-4 text-white whitespace-nowrap">
            Giờ mở cửa
          </h3>

          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 text-[11px] sm:text-xs md:text-sm text-white/85">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
              <span className="whitespace-nowrap">08:00 - 22:00</span>
            </div>

            <div className="flex items-start gap-1.5 sm:gap-2">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0 mt-0.5" />
              <span className="leading-snug">Tất cả các ngày trong tuần</span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-left md:text-left lg:text-center">
          <h3 className="font-bold text-xs sm:text-sm md:text-sm lg:text-base mb-2 sm:mb-2.5 md:mb-4 text-white whitespace-nowrap">
            Kết nối với chúng tôi
          </h3>

          <div className="flex gap-2 sm:gap-2.5 md:gap-3 items-center justify-start lg:justify-center">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center hover:scale-105"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                alt="Facebook"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              />
            </a>

            <a
              href="tel:0387136878"
              aria-label="Gọi hotline"
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center hover:scale-105 text-white"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </a>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1">
          <a
            href="https://maps.app.goo.gl/wSkET5ThBjNm9f29A"
            target="_blank"
            rel="noreferrer"
            aria-label="Xem bản đồ Dê Hương Sơn"
            className="block overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 h-28 sm:h-36 md:h-32 lg:h-36 group relative shadow-md"
          >
            <iframe
              title="Bản đồ Dê Hương Sơn"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3939.8604880385988!2d105.84806467548728!3d20.937626480689012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ad9f6221f4b3%3A0x23e41af49c85fe1a!2zTmjDoCBow6BuZyBC4bqjbyBMb25nIC0gRMOqIE7DumkgSMawxqFuZyBTxqFu!5e1!3m2!1svi!2s!4v1781164163918!5m2!1svi!2s"
              className="w-full h-full border-0 pointer-events-none group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </a>
        </div>
      </div>

      <div className="border-t border-white/15 text-center py-3 text-xs md:text-sm text-white/60">
        © 2026 Dê Hương Sơn Hà Tĩnh. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
