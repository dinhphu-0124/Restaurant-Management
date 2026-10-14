import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { API_BASE_URL } from "../config/api";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Đang xác thực email...");
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasVerifiedRef.current) return;

      hasVerifiedRef.current = true;

      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Thiếu mã xác thực email.");
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${token}`,
        );

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Xác thực email thất bại.");
        }

        setStatus("success");

        if (data.message === "Email này đã được xác thực trước đó.") {
          setMessage("Email đã được xác thực. Bạn có thể đăng nhập.");
        } else {
          setMessage(data.message || "Xác thực email thành công.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Xác thực email thất bại.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#fbfcf0] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
            status === "success"
              ? "bg-green-50 text-green-700"
              : status === "error"
                ? "bg-red-50 text-red-600"
                : "bg-gray-50 text-gray-500"
          }`}
        >
          {status === "success" ? (
            <CheckCircle size={34} />
          ) : (
            <XCircle size={34} />
          )}
        </div>

        <h1 className="text-2xl font-black text-green-950 mt-5">
          Xác thực email
        </h1>

        <p className="text-gray-600 font-semibold mt-3">{message}</p>

        <Link
          to="/login"
          className="h-12 px-6 rounded-2xl bg-green-800 text-white font-black inline-flex items-center justify-center mt-6 hover:bg-green-900"
        >
          Về trang đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
