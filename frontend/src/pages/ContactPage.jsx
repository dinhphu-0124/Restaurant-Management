import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Phone,
  MapPin,
  Clock,
  Mail,
  Send,
  ChefHat,
  ShieldCheck,
  Heart,
  Navigation,
  CalendarDays,
} from "lucide-react";

import hero3 from "../assets/images/Home/hero-3.png";
import goatIcon from "../assets/images/Icon_De.png";
import gtMonAn from "../assets/images/Contact/gt-mon-an.png";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100088682802201";
const ZALO_URL = "https://zalo.me/0387136878";

function ContactPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(false);
  const [errors, setErrors] = useState({});

  const scrollToMap = () => {
    document.getElementById("contact-map")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // hàm yêu cầu nhập đúng sđt
  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;
    const phone = form.phone.value.trim();

    // SĐT Việt Nam: bắt đầu 03, 05, 07, 08, 09 và đủ 10 số
    const phoneRegex = /^(0[35789])[0-9]{8}$/;

    if (!phoneRegex.test(phone)) {
      setErrors({
        phone: "Số điện thoại không hợp lệ.",
      });
      return;
    }

    setErrors({});
    setToast(true);

    setTimeout(() => {
      setToast(false);
    }, 3000);

    form.reset();
  };

  return (
    <div className="min-h-screen bg-[#fbf7ec] text-green-900">
      {toast && (
        <div className="fixed top-20 right-5 z-[9999] bg-white border border-[#eadfcd] shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3 w-[330px] max-w-[calc(100vw-32px)]">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <Send className="w-5 h-5 text-green-700" />
          </div>

          <div>
            <p className="font-black text-green-900">Gửi liên hệ thành công</p>
            <p className="text-sm text-gray-600">
              Nhà hàng sẽ phản hồi bạn sớm nhất.
            </p>
          </div>
        </div>
      )}

      {/* HERO */}
      <section
        className="relative min-h-[430px] md:min-h-[520px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,35,18,.96), rgba(0,35,18,.72), rgba(0,0,0,.25)),
            url(${hero3})
          `,
        }}
      >
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="max-w-xl text-white">
            <p
              className="text-5xl md:text-7xl text-[#d6a84f] leading-none mb-1"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              Liên hệ
            </p>

            <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight">
              Dê Hương Sơn
            </h1>

            <div className="flex items-center gap-4 my-5">
              <div className="w-24 h-px bg-[#d6a84f]"></div>
              <img
                src={goatIcon}
                alt="Dê Hương Sơn"
                className="w-10 h-10 object-contain brightness-0 invert"
              />
              <div className="w-24 h-px bg-[#d6a84f]"></div>
            </div>

            <p className="text-white/85 leading-relaxed max-w-md">
              Chúng tôi luôn sẵn sàng phục vụ, lắng nghe và hỗ trợ bạn đặt bàn,
              đặt món hoặc tư vấn không gian phù hợp.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="tel:0387136878"
                className="h-12 px-7 rounded-xl bg-[#d6a84f] hover:bg-[#c99a45] text-green-900 font-black flex items-center justify-center gap-2 shadow-lg"
              >
                <Phone className="w-5 h-5" />
                Gọi ngay
              </a>

              <button
                onClick={scrollToMap}
                className="h-12 px-7 rounded-xl border border-[#d6a84f] text-[#d6a84f] font-black flex items-center justify-center gap-2 hover:bg-[#d6a84f] hover:text-green-900 transition"
              >
                <MapPin className="w-5 h-5" />
                Chỉ đường
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* INFO BAR */}
      <section className="max-w-7xl mx-auto px-5 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-[#eadfcd] grid sm:grid-cols-2 xl:grid-cols-4 overflow-hidden">
          <ContactInfo
            icon={<Phone />}
            title="Hotline"
            main="038 713 6878"
            sub="Call / Zalo"
          />
          <ContactInfo
            icon={<MapPin />}
            title="Địa chỉ"
            main="Đ. Vũ Lăng "
            sub="Thanh Trì, Hà Nội"
          />
          <ContactInfo
            icon={<Clock />}
            title="Giờ mở cửa"
            main="08:00 - 22:00"
            sub="Tất cả các ngày trong tuần"
          />
          <ContactInfo
            icon={<Mail />}
            title="Email"
            main="dehuongsonn.ht@gmail.com"
            sub="Phản hồi trong ngày"
          />
        </div>
      </section>

      {/* MAP + FORM */}
      <section className="max-w-7xl mx-auto px-5 py-12 grid lg:grid-cols-2 gap-7">
        <div
          id="contact-map"
          className="bg-white rounded-3xl border border-[#eadfcd] shadow-md overflow-hidden h-[500px]"
        >
          <div className="relative h-full">
            <iframe
              title="Bản đồ Dê Hương Sơn"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3939.8604880385988!2d105.84806467548728!3d20.937626480689012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ad9f6221f4b3%3A0x23e41af49c85fe1a!2zTmjDoCBow6BuZyBC4bqjbyBMb25nIC0gRMOqIE7DumkgSMawxqFuZyBTxqFu!5e1!3m2!1svi!2s!4v1781164163918!5m2!1svi!2s"
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="absolute left-4 bottom-16 z-20 flex flex-col gap-3">
              <a
                href="https://maps.app.goo.gl/wSkET5ThBjNm9f29A"
                target="_blank"
                rel="noreferrer"
                className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-xl hover:bg-primary-light hover:scale-110 transition"
              >
                <Navigation className="w-6 h-6" />
              </a>

              <a
                href="tel:0387136878"
                className="w-12 h-12 rounded-full bg-secondary text-white shadow-2xl flex items-center justify-center hover:scale-110 transition"
              >
                <Phone className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div
          id="contact-form"
          className="bg-white rounded-3xl border border-[#eadfcd] shadow-md p-5 md:p-8"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-2.5xl font-black text-[#145c30] uppercase">
              Gửi liên hệ cho chúng tôi
            </h2>

            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="w-16 h-px bg-[#d6a84f]"></div>
              <img
                src={goatIcon}
                alt="Dê Hương Sơn"
                className="w-7 h-7 object-contain"
              />
              <div className="w-16 h-px bg-[#d6a84f]"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <input
                  required
                  name="fullName"
                  placeholder="Họ và tên *"
                  className="h-12 w-full rounded-xl border border-[#eadfcd] px-4 outline-none focus:border-green-800 bg-[#fffaf0]"
                />
              </div>

              <div>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  name="phone"
                  placeholder="Số điện thoại *"
                  className={`h-12 w-full rounded-xl border px-4 outline-none bg-[#fffaf0] ${errors.phone
                    ? "border-red-500 focus:border-red-500"
                    : "border-[#eadfcd] focus:border-green-800"
                    }`}
                  onChange={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, "");

                    if (errors.phone) {
                      setErrors({});
                    }
                  }}
                />

                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 leading-snug">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <input
              type="email"
              placeholder="Email"
              className="w-full h-12 rounded-xl border border-[#eadfcd] px-4 outline-none focus:border-green-800 bg-[#fffaf0]"
            />

            <textarea
              required
              rows="4"
              placeholder="Nội dung liên hệ *"
              className="w-full rounded-xl border border-[#eadfcd] px-4 py-3 outline-none focus:border-green-800 bg-[#fffaf0] resize-none"
            ></textarea>

            <button className="w-full h-13 rounded-xl bg-[#d6a84f] hover:bg-[#c99a45] text-green-900 font-black flex items-center justify-center gap-2 transition">
              <Send className="w-5 h-5" />
              Gửi liên hệ
            </button>
          </form>
        </div>
      </section>

      {/* WHY */}
      <section className="max-w-7xl mx-auto px-5 pb-12">
        <div className="bg-green-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-black uppercase text-[#d6a84f]">
              Vì sao chọn Dê Hương Sơn?
            </h2>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="w-16 h-px bg-[#d6a84f]"></div>
              <img
                src={goatIcon}
                alt="Dê Hương Sơn"
                className="w-10 h-10 object-contain brightness-0 invert"
              />
              <div className="w-16 h-px bg-[#d6a84f]"></div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <WhyItem
              icon={<ShieldCheck />}
              title="Nguyên liệu tươi ngon"
              text="Dê núi tuyển chọn kỹ, chế biến trong ngày."
            />
            <WhyItem
              icon={<ChefHat />}
              title="Đầu bếp kinh nghiệm"
              text="Chuẩn vị đặc sản Hương Sơn, đậm đà khó quên."
            />
            <WhyItem
              icon={<MapPin />}
              title="Không gian sang trọng"
              text="Phù hợp gia đình, sinh nhật, liên hoan."
            />
            <WhyItem
              icon={<Heart />}
              title="Khách hàng là trung tâm"
              text="Tận tâm, nhanh chóng, chu đáo trong từng bữa ăn."
            />
          </div>
        </div>
      </section>

      {/* SOCIAL */}
      <section className="max-w-7xl mx-auto px-5 pb-10 text-center">
        <h2 className="text-xl md:text-2xl font-black uppercase text-[#145c30]">
          Hệ thống chi nhánh
        </h2>

        <div className="flex items-center justify-center gap-3 mt-3 mb-7">
          <div className="w-16 h-px bg-[#d6a84f]"></div>
          <img
            src={goatIcon}
            alt="Dê Hương Sơn"
            className="w-7 h-7 object-contain"
          />
          <div className="w-16 h-px bg-[#d6a84f]"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noreferrer"
            className="w-12 h-12 rounded-full bg-green-900 flex items-center justify-center hover:bg-[#d6a84f] transition"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
              alt="Facebook"
              className="w-5 h-5"
            />
          </a>

          <a
            href="tel:0387136878"
            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-secondary hover:text-primary transition"
          >
            <Phone className="w-5 h-5" />
          </a>

          <button
            onClick={scrollToMap}
            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-secondary hover:text-primary transition"
          >
            <MapPin className="w-5 h-5" />
          </button>

          <a
            href={ZALO_URL}
            target="_blank"
            rel="noreferrer"
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:bg-secondary transition"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
              alt="Zalo"
              className="w-6 h-6"
            />
          </a>
        </div>
      </section>

      {/* CTA */}

      <section className="max-w-7xl mx-auto px-5 pb-12">
        <div
          className="relative overflow-hidden rounded-[36px] shadow-xl bg-cover bg-center"
          style={{
            backgroundImage: `
        linear-gradient(
          90deg,
          rgba(0,45,24,.92) 0%,
          rgba(0,45,24,.82) 42%,
          rgba(0,45,24,.55) 70%,
          rgba(0,45,24,.35) 100%
        ),
        url(${gtMonAn})
      `,
          }}
        >
          <div className="px-6 md:px-12 py-12 md:py-16 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-16 h-px bg-[#d6a84f]" />
                <img
                  src={goatIcon}
                  alt=""
                  className="w-8 h-8 object-contain brightness-0 invert"
                />
                <div className="w-16 h-px bg-[#d6a84f]" />
              </div>

              <p className="text-[#d6a84f] font-black uppercase tracking-wide">
                Sẵn sàng thưởng thức
              </p>

              <h2 className="text-3xl md:text-5xl font-black text-white uppercase leading-tight mt-3">
                Đặc sản dê núi
                <br />
                <span className="text-[#d6a84f]">Hương Sơn ?</span>
              </h2>

              <p className="text-white/85 mt-5 max-w-2xl leading-7">
                Đặt bàn ngay hôm nay để thưởng thức những món ăn đặc sản được
                chế biến từ dê núi tuyển chọn trong không gian ấm cúng và sang
                trọng.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
              <button
                onClick={() => navigate("/booking")}
                className="h-14 px-8 rounded-2xl bg-[#d6a84f] text-green-950 font-black flex items-center justify-center gap-3 hover:bg-[#c99a45] transition shadow-lg"
              >
                <CalendarDays className="w-5 h-5" />
                Đặt bàn ngay
              </button>

              <a
                href="tel:0387136878"
                className="h-14 px-8 rounded-2xl border border-[#d6a84f] text-[#d6a84f] font-black flex items-center justify-center gap-3 hover:bg-[#d6a84f] hover:text-green-950 transition"
              >
                <Phone className="w-5 h-5" />
                Gọi cho chúng tôi
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactInfo({ icon, title, main, sub }) {
  return (
    <div className="p-4 md:p-5 xl:p-6 flex items-center gap-3 xl:gap-4 border-b sm:border-r border-[#eadfcd] last:border-r-0">
      <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-full bg-primary text-secondary flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] xl:text-xs uppercase font-black text-gray-500">{title}</p>
        <h3 className="font-black text-primary mt-1 text-sm xl:text-base truncate" title={main}>{main}</h3>
        <p className="text-[11px] xl:text-xs text-gray-500 mt-1 truncate">{sub}</p>
      </div>
    </div>
  );
}

function WhyItem({ icon, title, text }) {
  return (
    <div className="px-4 lg:border-r border-white/15 last:border-r-0">
      <div className="w-14 h-14 rounded-full border border-[#d6a84f] text-[#d6a84f] flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>

      <h3 className="font-black text-white uppercase text-sm">{title}</h3>
      <p className="text-white/70 text-sm mt-2 leading-relaxed">{text}</p>
    </div>
  );
}

export default ContactPage;
