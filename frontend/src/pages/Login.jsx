import Header from "../components/Header";
import Footer from "../components/Footer";
import { loginUser, socialLogin } from "../services/authService";
import {
  saveAuthSession,
  checkLogin,
  getCurrentUser,
  clearAuthSession,
} from "../utils/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../services/firebase";
import { Eye, EyeOff, AlertCircle, User, Lock } from "lucide-react";
import SEO from "../components/common/SEO";

import backgroundImage from "../assets/images/Register_Login.png";
import goatIcon from "../assets/images/Icon_De.png";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    account: "",
    password: "",
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [socialLoading, setSocialLoading] = useState("");

  const validateForm = () => {
    const newErrors = {};

    if (!formData.account.trim()) {
      newErrors.account = "Vui lòng nhập số điện thoại hoặc email";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      return;
    }

    try {
      const data = await loginUser({
        account: formData.account.trim(),
        password: formData.password,
      });

      if (!data.success) {
        setErrors({
          account: data.message || "Tài khoản hoặc mật khẩu không đúng",
        });
        return;
      }

      saveAuthSession({
        token: data.token,
        user: data.user,
        remember: formData.remember,
      });

      const redirectTarget =
        location.state?.from ||
        (data.user.role === "admin" ? "/admin/dashboard" : "/home");

      navigate(redirectTarget, {
        state: {
          loginSuccess: true,
        },
      });
    } catch (error) {
      console.error(error);

      setErrors({
        account: "Không kết nối được backend.",
      });
    }
  };

  //hàm đăng nhập Google
  const handleGoogleLogin = async () => {
    setErrors({});
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
          account: data.message || "Không thể đăng nhập bằng Google.",
        });
        return;
      }

      saveAuthSession({
        token: data.token,
        user: data.user,
        remember: true,
      });

      const redirectTarget =
        location.state?.from ||
        (data.user.role === "admin" ? "/admin/dashboard" : "/home");

      navigate(redirectTarget, {
        state: {
          loginSuccess: true,
        },
      });
    } catch (error) {
      console.error(error);

      setErrors({
        account:
          error?.code === "auth/popup-closed-by-user"
            ? "Bạn đã đóng cửa sổ đăng nhập Google."
            : "Không thể đăng nhập bằng Google.",
      });
    } finally {
      setSocialLoading("");
    }
  };

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!checkLogin()) {
      clearAuthSession();
      return;
    }

    const currentUser = getCurrentUser();

    if (currentUser) {
      const redirectTarget =
        location.state?.from ||
        (currentUser.role === "admin" ? "/admin/dashboard" : "/home");
      navigate(redirectTarget);
    }
  }, [navigate, location]);

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="min-h-screen flex flex-col">
        <SEO title="Đăng Nhập Khách Hàng" noindex={true} />
        {/* HEADER */}
        <Header currentPage="" />
        <div className="h-16"></div>

        {/* MAIN */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 md:py-8">
          <div className="flex justify-center lg:justify-end items-center min-h-[calc(100vh-96px)] lg:pr-0">
            {/* RIGHT */}
            <section className="w-full max-w-[430px] md:max-w-[520px]">
              <div className="bg-white/92 backdrop-blur-xl rounded-3xl shadow-2xl p-4 md:p-6 border border-white/40">
                <div className="text-center mb-2">
                  <h2 className="text-xl md:text-2xl font-extrabold text-green-800 uppercase tracking-wide">
                    Đăng nhập
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
                    Chào mừng bạn trở lại với Dê Hương Sơn
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <InputField
                    icon={<User className="w-4 h-4" />}
                    type="text"
                    name="account"
                    value={formData.account}
                    onChange={handleChange}
                    placeholder="Số điện thoại hoặc Email"
                    error={errors.account}
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

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="remember"
                        checked={formData.remember}
                        onChange={handleChange}
                        className="w-4 h-4 accent-green-700 rounded"
                      />

                      <span className="text-xs sm:text-sm text-gray-600">
                        Ghi nhớ đăng nhập
                      </span>
                    </label>

                    <a
                      href="#"
                      className="text-xs sm:text-sm font-semibold text-green-700 hover:underline whitespace-nowrap"
                    >
                      Quên mật khẩu?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-md hover:-translate-y-1 hover:shadow-lg active:scale-95"
                  >
                    Đăng nhập
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
                    onClick={handleGoogleLogin}
                    disabled={Boolean(socialLoading)}
                    className="w-full h-11 border border-gray-300 hover:border-green-600 hover:bg-green-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Google_Chrome_icon_%28February_2022%29.svg/3840px-Google_Chrome_icon_%28February_2022%29.svg.png"
                      alt="Google"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span>
                      {socialLoading === "google" ? "Đang xử lý..." : "Google"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrors({
                        account:
                          "Chức năng đăng nhập Facebook sẽ cấu hình sau.",
                      });
                    }}
                    className="w-full h-11 border border-gray-300 hover:border-green-600 hover:bg-green-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/960px-2021_Facebook_icon.svg.png"
                      alt="Facebook"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span>Facebook</span>
                  </button>
                </div>

                <p className="text-center text-gray-600 mt-2.5">
                  Chưa có tài khoản?{" "}
                  <Link
                    to="/register"
                    className="text-green-700 font-bold hover:underline"
                  >
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </main>

        {/* FOOTER */}
        <Footer />
      </div>
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

export default Login;
