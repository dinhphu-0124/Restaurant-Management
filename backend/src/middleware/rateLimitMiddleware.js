/**
 * In-Memory Sliding Window Rate Limiter
 * Không cần cài thêm thư viện bên ngoài.
 * Tự động dọn dẹp các IP quá hạn để tránh rò rỉ bộ nhớ (memory leak).
 */

function createRateLimiter({
  windowMs = 60 * 1000, // 1 phút
  max = 60, // Tối đa 60 requests/phút
  message = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
  statusCode = 429,
} = {}) {
  const hits = new Map();

  // Dọn dẹp các IP đã hết hạn định kỳ mỗi 5 phút
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.startTime > windowMs) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref(); // Không block tiến trình Node.js khi shutdown
  }

  return (req, res, next) => {
    // Lấy IP của client
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown-ip";

    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now - record.startTime > windowMs) {
      record = {
        count: 1,
        startTime: now,
      };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetTime = Math.ceil((record.startTime + windowMs - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetTime);

    if (record.count > max) {
      res.setHeader("Retry-After", resetTime);
      return res.status(statusCode).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        message,
        retryAfter: resetTime,
      });
    }

    next();
  };
}

// Giới hạn cho Authentication (Login / Register / Forgot Password): tối đa 10 lần/phút
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Quá nhiều lượt thử đăng nhập/xác thực. Vui lòng chờ 1 phút trước khi thử lại.",
});

// Giới hạn chung cho API: 120 lần/phút
const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Hệ thống đang bận. Vui lòng giảm tần suất thao tác và thử lại sau ít phút.",
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
};

