import Header from "../components/Header";
import Footer from "../components/Footer";
import { registerUser, socialLogin } from "../services/authService";
import { saveAuthSession } from "../utils/auth";

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../services/firebase";
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Phone,
  Mail,
  User,
  Lock,
} from "lucide-react";
import SEO from "../components/common/SEO";

import backgroundImage from "../assets/images/Register_Login.png";
import goatIcon from "../assets/images/Icon_De.png";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [socialLoading, setSocialLoading] = useState("");
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const getPasswordStrength = (password) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^(0)(3|5|7|8|9)[0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else {
      const passwordErrors = [];

      if (formData.password.length < 8) {
        passwordErrors.push("ít nhất 8 ký tự");
      }

      if (!/[a-z]/.test(formData.password)) {
        passwordErrors.push("chữ thường");
      }

      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push("chữ hoa");
      }

      if (!/\d/.test(formData.password)) {
        passwordErrors.push("chữ số");
      }

      if (!/[^A-Za-z0-9]/.test(formData.password)) {
        passwordErrors.push("ký tự đặc biệt");
      }

      if (passwordErrors.length > 0) {
        newErrors.password = `Mật khẩu yếu (thiếu: ${passwordErrors.join(", ")})`;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "Vui lòng đồng ý với điều khoản";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let val = type === "checkbox" ? checked : value;
    if (name === "phone") {
      val = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccessMessage("");
      return;
    }

    try {
      const data = await registerUser({
        name: formData.fullName.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (!data.success) {
        setErrors({
          email: data.message || "Không thể đăng ký tài khoản.",
        });
        setSuccessMessage("");
        return;
      }

      setSuccessMessage(
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.",
      );

      setFormData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
      });

      setErrors({});

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      console.error(error);

      setErrors({
        email: "Không kết nối được backend.",
      });

      setSuccessMessage("");
    }
  };

  //hàm đăng ký bằng Google
  const handleGoogleRegister = async () => {
    if (!formData.agreeTerms) {
      setErrors({
        agreeTerms: "Vui lòng đồng ý với điều khoản trước khi đăng ký.",
      });
      return;
    }

    setErrors({});
    setSuccessMessage("");
    setSocialLoading("google");

    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      const data = await socialLogin({
        idToken,
        provider: "google",
      });

      if (!data.success) {
        setErrors({
          email: data.message || "Không thể đăng ký bằng Google.",
        });
        return;
      }

      if (!data.isNewUser) {
        setErrors({
          email:
            "Tài khoản Google này đã được đăng ký. Vui lòng chuyển sang trang đăng nhập.",
        });
        return;
      }

      saveAuthSession({
        token: data.token,
        user: data.user,
        remember: true,
      });

      setSuccessMessage("Đăng ký tài khoản bằng Google thành công!");

      setTimeout(() => {
        navigate(data.user.role === "admin" ? "/admin/dashboard" : "/home");
      }, 700);
    } catch (error) {
      console.error(error);

      setErrors({
        email:
          error?.code === "auth/popup-closed-by-user"
            ? "Bạn đã đóng cửa sổ đăng nhập Google."
            : "Không thể đăng ký bằng Google.",
      });
    } finally {
      setSocialLoading("");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="min-h-screen flex flex-col">
        <SEO title="Đăng Ký Tài Khoản" noindex={true} />
        {/* HEADER */}
        <Header currentPage="" />
        <div className="h-16"></div>

        {/* MAIN */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 md:py-8">
          <div className="flex justify-center lg:justify-end items-center min-h-[calc(100vh-96px)] lg:pr-0">
            {/* RIGHT */}
            <section className="w-full max-w-[430px] md:max-w-[520px]">
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 font-medium">{successMessage}</p>
                </div>
              )}

              <div className="bg-white/92 backdrop-blur-xl rounded-3xl shadow-2xl p-4 md:p-6 border border-white/40">
                <div className="text-center mb-2">
                  <h2 className="text-xl md:text-2xl font-extrabold text-green-800 uppercase tracking-wide">
                    Đăng ký tài khoản
                  </h2>

                  <div className="flex items-center justify-center gap-3 mt-2 mb-3">
                    <div className="w-20 h-[1px] bg-green-300"></div>
                    {/* // Icon Dê */}
                    <img
                      src={goatIcon}
                      alt="Goat Icon"
                      className="w-9 h-9 object-contain"
                    />
                    <div className="w-20 h-[1px] bg-green-300"></div>
                  </div>

                  <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                    Tạo tài khoản để đặt món nhanh hơn
                    <br />
                    và nhận nhiều ưu đãi hấp dẫn!
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <InputField
                    icon={<User className="w-4 h-4" />}
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Họ và tên"
                    error={errors.fullName}
                  />

                  <InputField
                    icon={<Phone className="w-4 h-4" />}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Số điện thoại"
                    error={errors.phone}
                  />

                  <InputField
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    error={errors.email}
                  />

                  <PasswordField
                    icon={<Lock className="w-4 h-4" />}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu"
                    error={errors.password}
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />

                  {formData.password && (
                    <PasswordStrength password={formData.password} />
                  )}

                  <PasswordField
                    icon={<Lock className="w-4 h-4" />}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Xác nhận mật khẩu"
                    error={errors.confirmPassword}
                    show={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        id="agreeTerms"
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        className="w-5 h-5 accent-green-600 rounded"
                      />

                      <label
                        htmlFor="agreeTerms"
                        className="text-gray-700 text-sm sm:text-base cursor-pointer"
                      >
                        Tôi đồng ý với
                      </label>

                      <button
                        type="button"
                        onClick={() => setIsTermsOpen(true)}
                        className="text-green-700 text-sm sm:text-base font-semibold hover:underline"
                      >
                        điều khoản sử dụng
                      </button>
                    </div>

                    {errors.agreeTerms && (
                      <ErrorText message={errors.agreeTerms} />
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-md hover:-translate-y-1 hover:shadow-lg active:scale-95"
                  >
                    Đăng ký
                  </button>
                </form>

                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-gray-400 font-semibold">HOẶC</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={Boolean(socialLoading)}
                    className="w-full h-11 border border-gray-300 hover:border-green-600 hover:bg-green-50 text-gray-700 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Google_Chrome_icon_%28February_2022%29.svg/3840px-Google_Chrome_icon_%28February_2022%29.svg.png"
                      alt="Google"
                      className="w-5 h-5"
                    />

                    <span className="hidden sm:inline">
                      {socialLoading === "google" ? "Đang xử lý..." : "Google"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrors({
                        email: "Chức năng đăng ký Facebook sẽ cấu hình sau.",
                      });
                    }}
                    className="w-full h-11 border border-gray-300 hover:border-green-600 hover:bg-green-50 text-gray-700 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/960px-2021_Facebook_icon.svg.png"
                      alt="Facebook"
                      className="w-5 h-5"
                    />
                    <span className="hidden sm:inline">Facebook</span>
                  </button>
                </div>

                <p className="text-center text-gray-600 mt-2.5">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="text-green-700 font-bold hover:underline"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </main>

        {/* FOOTER */}
        <Footer />
      </div>
      {isTermsOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 relative">
            <h3 className="text-2xl font-black text-green-800 mb-4">
              Điều khoản sử dụng
            </h3>

            <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-4 text-sm text-gray-600 leading-relaxed">
              <p className="text-xs text-gray-400 font-semibold">
                Cập nhật lần cuối: 27/06/2026
              </p>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  1. Phạm vi áp dụng
                </h4>
                <p>
                  Điều khoản này áp dụng cho toàn bộ người dùng khi sử dụng
                  website của Dê Hương Sơn, bao gồm các chức năng xem thực đơn,
                  đặt món, đặt bàn, sử dụng mã khuyến mãi, quản lý thông tin tài
                  khoản và theo dõi lịch sử đơn hàng.
                </p>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  2. Tài khoản người dùng
                </h4>
                <p>
                  Người dùng cần cung cấp thông tin chính xác khi đăng ký tài
                  khoản, bao gồm họ tên, email, số điện thoại và các thông tin
                  cần thiết khác. Người dùng chịu trách nhiệm bảo mật thông tin
                  đăng nhập của mình.
                </p>
                <p>
                  Dê Hương Sơn có quyền tạm khóa hoặc hạn chế tài khoản nếu phát
                  hiện hành vi gian lận, đặt đơn giả, sử dụng thông tin sai lệch
                  hoặc gây ảnh hưởng đến hoạt động của nhà hàng.
                </p>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  3. Đặt món và đặt bàn
                </h4>
                <p>
                  Khi thực hiện đặt món hoặc đặt bàn, người dùng cần kiểm tra kỹ
                  thông tin trước khi xác nhận, bao gồm món ăn, số lượng, thời
                  gian nhận món, thời gian đặt bàn, số lượng khách, địa chỉ giao
                  hàng và phương thức thanh toán.
                </p>
                <p>
                  Trong một số trường hợp như hết món, quá tải phục vụ, sai
                  thông tin liên hệ hoặc sự cố ngoài ý muốn, Dê Hương Sơn có
                  quyền liên hệ để điều chỉnh, xác nhận lại hoặc từ chối phục vụ
                  đơn hàng/đặt bàn.
                </p>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  4. Giá bán, thanh toán và khuyến mãi
                </h4>
                <p>
                  Giá món ăn, phí giao hàng, ưu đãi và tổng thanh toán được hiển
                  thị trên hệ thống tại thời điểm người dùng đặt hàng. Các
                  chương trình khuyến mãi hoặc mã giảm giá có thể đi kèm điều
                  kiện sử dụng riêng.
                </p>
                <p>
                  Dê Hương Sơn có quyền từ chối áp dụng ưu đãi nếu phát hiện mã
                  khuyến mãi bị sử dụng sai điều kiện, gian lận hoặc không còn
                  hiệu lực.
                </p>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  5. Hủy đơn, thay đổi đơn và hoàn tiền
                </h4>
                <p>
                  Người dùng có thể yêu cầu hủy hoặc thay đổi đơn hàng/đặt bàn
                  trước khi nhà hàng bắt đầu xử lý. Sau khi đơn hàng đã được xác
                  nhận, đang chế biến hoặc đang giao, yêu cầu hủy hoặc thay đổi
                  có thể không được chấp nhận.
                </p>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  6. Thông tin cá nhân
                </h4>
                <p>
                  Người dùng đồng ý cho Dê Hương Sơn thu thập và sử dụng các
                  thông tin cần thiết như họ tên, số điện thoại, email, địa chỉ
                  giao hàng, lịch sử đơn hàng và thông tin đặt bàn nhằm phục vụ
                  việc xác nhận, giao hàng, chăm sóc khách hàng và quản lý tài
                  khoản.
                </p>
                <p>
                  Dê Hương Sơn cam kết không bán thông tin cá nhân của người
                  dùng cho bên thứ ba. Thông tin chỉ được chia sẻ khi cần thiết
                  để thực hiện dịch vụ, xử lý thanh toán, giao hàng hoặc theo
                  yêu cầu hợp lệ của cơ quan có thẩm quyền.
                </p>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  7. Hành vi không được phép
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Cung cấp thông tin giả mạo hoặc sử dụng tài khoản của người
                    khác.
                  </li>
                  <li>
                    Đặt đơn giả, đặt bàn ảo hoặc gây gián đoạn hoạt động của nhà
                    hàng.
                  </li>
                  <li>
                    Lạm dụng mã khuyến mãi, gian lận thanh toán hoặc khai thác
                    lỗi hệ thống.
                  </li>
                  <li>
                    Sao chép, chỉnh sửa hoặc phát tán nội dung website khi chưa
                    được cho phép.
                  </li>
                  <li>
                    Can thiệp trái phép vào hệ thống, máy chủ, cơ sở dữ liệu
                    hoặc mã nguồn website.
                  </li>
                </ul>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  8. Quyền và trách nhiệm của Dê Hương Sơn
                </h4>
                <p>
                  Dê Hương Sơn có trách nhiệm vận hành hệ thống ổn định trong
                  phạm vi có thể, tiếp nhận thông tin đặt món/đặt bàn và hỗ trợ
                  khách hàng khi phát sinh vấn đề.
                </p>
                <p>
                  Dê Hương Sơn có quyền cập nhật thực đơn, giá bán, thời gian
                  phục vụ, chính sách khuyến mãi và các nội dung khác trên
                  website khi cần thiết.
                </p>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">
                  9. Thay đổi điều khoản
                </h4>
                <p>
                  Dê Hương Sơn có thể cập nhật điều khoản sử dụng để phù hợp với
                  hoạt động kinh doanh và chức năng của hệ thống. Người dùng
                  tiếp tục sử dụng hệ thống sau khi điều khoản được cập nhật
                  được xem là đã đồng ý với nội dung thay đổi.
                </p>
              </section>

              <section>
                <h4 className="font-black text-green-800 mb-1">10. Liên hệ</h4>
                <p>
                  Mọi thắc mắc, khiếu nại hoặc yêu cầu hỗ trợ liên quan đến tài
                  khoản, đơn hàng, đặt bàn hoặc điều khoản sử dụng có thể liên
                  hệ với Dê Hương Sơn qua các kênh liên hệ được công bố trên
                  website.
                </p>
              </section>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    agreeTerms: true,
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    agreeTerms: "",
                  }));
                  setIsTermsOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-green-700 text-white font-bold hover:bg-green-800 transition"
              >
                Tôi đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ icon, type, name, value, onChange, placeholder, error }) {
  return (
    <div>
      <div
        className={`flex items-center gap-3 border rounded-xl px-3 h-10 md:h-11 bg-white transition ${
          error
            ? "border-red-500"
            : "border-gray-300 focus-within:border-green-700"
        }`}
      >
        <span className="text-green-700 flex-shrink-0">{icon}</span>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-full outline-none text-sm text-gray-700 placeholder:text-gray-500 bg-transparent"
        />
      </div>

      {error && <ErrorText message={error} />}
    </div>
  );
}

function PasswordField({
  icon,
  name,
  value,
  onChange,
  placeholder,
  error,
  show,
  onToggle,
}) {
  return (
    <div>
      <div
        className={`flex items-center gap-3 border rounded-xl px-3 h-10 md:h-11 bg-white transition ${
          error
            ? "border-red-500"
            : "border-gray-300 focus-within:border-green-700"
        }`}
      >
        <span className="text-green-700 flex-shrink-0">{icon}</span>

        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-full outline-none text-sm text-gray-700 placeholder:text-gray-500 bg-transparent"
        />

        <button
          type="button"
          onClick={onToggle}
          className="text-gray-500 hover:text-green-700"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && <ErrorText message={error} />}
    </div>
  );
}

function ErrorText({ message }) {
  return (
    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
      <AlertCircle className="w-4 h-4" />
      {message}
    </p>
  );
}

function PasswordStrength({ password }) {
  const missingRules = [];

  if (password.length < 8) {
    missingRules.push("8 ký tự");
  }

  if (!/[a-z]/.test(password)) {
    missingRules.push("chữ thường");
  }

  if (!/[A-Z]/.test(password)) {
    missingRules.push("chữ hoa");
  }

  if (!/\d/.test(password)) {
    missingRules.push("số");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    missingRules.push("ký tự đặc biệt");
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const getColor = (index) => {
    if (score <= index) return "bg-gray-300";

    if (score <= 2) return "bg-red-500";
    if (score === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getText = () => {
    if (score <= 2) return "Yếu";
    if (score === 3) return "Trung bình";
    return "Mạnh";
  };

  const getTextColor = () => {
    if (score <= 2) return "text-red-500";
    if (score === 3) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="mt-2">
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
          style={{
            width: `${(score / 5) * 100}%`,
          }}
        />
      </div>

      <div className="mt-2">
        <p className="text-gray-500 font-semibold text-xs">
          Độ mạnh mật khẩu:
          <span className={`ml-1 font-bold ${getTextColor()}`}>
            {getText()}
          </span>
        </p>

        {missingRules.length > 0 ? (
          <p className="text-red-500 text-xs mt-1">
            Thiếu: {missingRules.join(", ")}
          </p>
        ) : (
          <p className="text-green-600 text-xs mt-1 font-medium">
            ✓ Mật khẩu đạt yêu cầu
          </p>
        )}
      </div>
    </div>
  );
}

export default Register;
