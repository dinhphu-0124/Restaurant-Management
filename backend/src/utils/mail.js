const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerifyEmail({ to, name, verifyUrl }) {
  await transporter.sendMail({
    from: `"Dê Hương Sơn" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Xác thực email tài khoản Dê Hương Sơn",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Xin chào ${name},</h2>
        <p>Bạn vừa đăng ký tài khoản tại Dê Hương Sơn.</p>
        <p>Vui lòng bấm nút bên dưới để xác thực email:</p>
        <p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:12px 18px;background:#047857;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">
            Xác thực email
          </a>
        </p>
        <p>Liên kết này có hiệu lực trong 24 giờ.</p>
      </div>
    `,
  });
}

async function sendBookingEmail({ to, name, bookingCode, status, date, time, guests, note, total }) {
  let statusText = "Đang chờ xác nhận";
  let statusColor = "#eab308"; // Vàng
  let statusDesc = "Nhà hàng đã nhận được yêu cầu đặt bàn của bạn và đang kiểm tra bàn trống. Chúng tôi sẽ phản hồi lại bạn sớm nhất có thể.";

  if (status === "confirmed") {
    statusText = "Đã xác nhận thành công";
    statusColor = "#16a34a"; // Xanh lá
    statusDesc = "Yêu cầu đặt bàn của bạn đã được xác nhận. Chúng tôi rất hân hạnh được phục vụ quý khách!";
  } else if (status === "cancelled") {
    statusText = "Đã hủy";
    statusColor = "#dc2626"; // Đỏ
    statusDesc = "Yêu cầu đặt bàn của bạn đã bị hủy. Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline của nhà hàng để được hỗ trợ.";
  }

  const formattedTotal = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(total || 0);

  await transporter.sendMail({
    from: `"Dê Hương Sơn" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[Dê Hương Sơn] Thông báo đặt bàn ${bookingCode} - Trạng thái: ${statusText}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background-color: #047857; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Dê Hương Sơn</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9;">Ẩm Thực Đồng Quê Đích Thực</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px; background-color: #ffffff; color: #1f2937;">
          <h2 style="margin-top: 0; color: #111827;">Kính chào Quý khách ${name},</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">
            Cảm ơn bạn đã tin tưởng lựa chọn nhà hàng Dê Hương Sơn. Dưới đây là thông tin chi tiết về yêu cầu đặt bàn của bạn:
          </p>
          
          <!-- Status Banner -->
          <div style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: ${statusColor}; font-size: 16px;">
              Trạng thái: ${statusText}
            </p>
            <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px; line-height: 1.4;">
              ${statusDesc}
            </p>
          </div>
          
          <!-- Booking Details Table -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Mã đặt bàn:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #111827;">${bookingCode}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Ngày đặt:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827;">${date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Giờ đặt:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827;">${time}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Số lượng khách:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827;">${guests} người</td>
            </tr>
            ${note ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Ghi chú:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827; font-style: italic;">"${note}"</td>
            </tr>
            ` : ""}
            ${total > 0 ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Tiền đặt trước món:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #047857;">${formattedTotal}</td>
            </tr>
            ` : ""}
          </table>
          
          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Nếu cần hỗ trợ gấp hoặc thay đổi thông tin đặt bàn, xin vui lòng gọi hotline:</p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #047857; font-size: 16px;">0909.123.456</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">Đây là email tự động từ hệ thống quản lý nhà hàng Dê Hương Sơn.</p>
          <p style="margin: 4px 0 0 0;">Vui lòng không phản hồi lại email này.</p>
        </div>
      </div>
    `
  });
}

async function sendBookingReminderEmail({ to, name, bookingCode, date, time, guests, note }) {
  await transporter.sendMail({
    from: `"Dê Hương Sơn" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[Dê Hương Sơn] Nhắc lịch hẹn đặt bàn sắp diễn ra - Mã: ${bookingCode}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background-color: #047857; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Dê Hương Sơn</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9;">Nhắc Lịch Hẹn Đặt Bàn</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px; background-color: #ffffff; color: #1f2937;">
          <h2 style="margin-top: 0; color: #111827;">Kính chào Quý khách ${name},</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">
            Đây là thư nhắc nhở lịch hẹn đặt bàn của bạn tại nhà hàng **Dê Hương Sơn** sắp diễn ra trong vòng 2 tiếng tới.
          </p>
          
          <!-- Booking Details Table -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Mã đặt bàn:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #111827;">${bookingCode}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Ngày hẹn:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827;">${date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Giờ hẹn:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #047857; font-size: 16px;">${time}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Số khách:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827;">${guests} người</td>
            </tr>
            ${note ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Ghi chú:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827; font-style: italic;">"${note}"</td>
            </tr>
            ` : ""}
          </table>
          
          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Nếu quý khách có thay đổi hoặc không thể đến đúng hẹn, xin vui lòng thông báo sớm qua hotline:</p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #047857; font-size: 16px;">0909.123.456</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">Cảm ơn quý khách và hẹn gặp lại tại nhà hàng Dê Hương Sơn!</p>
        </div>
      </div>
    `
  });
}

async function sendTablePinEmail({ to, name, bookingCode, tableCode, pinCode, date, time }) {
  await transporter.sendMail({
    from: `"Dê Hương Sơn" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[Dê Hương Sơn] 🔑 Mã PIN Gọi Thêm Món - Bàn ${tableCode}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background-color: #047857; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Dê Hương Sơn</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9;">Mã PIN Gọi Thêm Món Tại Bàn</p>
        </div>

        <!-- Content -->
        <div style="padding: 24px; background-color: #ffffff; color: #1f2937;">
          <h2 style="margin-top: 0; color: #111827;">Kính chào Quý khách ${name},</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
            Nhà hàng <strong>Dê Hương Sơn</strong> xin trân trọng thông báo: bàn của bạn đã được chuẩn bị sẵn sàng và đang ở trạng thái <strong style="color:#047857;">Đang phục vụ</strong>.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
            Để gọi thêm món ăn bằng cách quét mã QR trên bàn, vui lòng sử dụng <strong>Mã PIN</strong> dưới đây:
          </p>

          <!-- PIN Box -->
          <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; border-radius: 16px; padding: 28px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Mã PIN của bạn</p>
            <p style="margin: 0; font-size: 52px; font-weight: 900; color: #047857; letter-spacing: 12px; line-height: 1.2;">${pinCode}</p>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #a16207;">Mã PIN chỉ có hiệu lực trong lượt phục vụ này</p>
          </div>

          <!-- Booking Info -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Mã đặt bàn:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #111827;">${bookingCode}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Số bàn:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #047857; font-size: 16px;">${tableCode}</td>
            </tr>
            ${date ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Ngày:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827;">${date}</td>
            </tr>` : ""}
            ${time ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Giờ:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #047857;">${time}</td>
            </tr>` : ""}
          </table>

          <!-- How to use -->
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #15803d; font-size: 14px;">📱 Cách sử dụng Mã PIN:</p>
            <ol style="margin: 0; padding-left: 18px; color: #166534; font-size: 13px; line-height: 1.8;">
              <li>Quét mã QR trên bàn bằng camera điện thoại.</li>
              <li>Chọn các món ăn muốn thêm và vào trang Thanh toán.</li>
              <li>Nhập mã PIN <strong>${pinCode}</strong> vào ô "Mã PIN 4 số".</li>
              <li>Bấm Đặt bàn — Nhân viên sẽ xác nhận và gửi xuống bếp ngay!</li>
            </ol>
          </div>

          <div style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Cần hỗ trợ? Gọi ngay cho nhân viên hoặc hotline:</p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #047857; font-size: 16px;">0909.123.456</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">Email này được gửi tự động khi bàn của bạn bắt đầu được phục vụ.</p>
          <p style="margin: 4px 0 0 0;">Vui lòng không phản hồi lại email này.</p>
        </div>
      </div>
    `
  });
}

module.exports = {
  sendVerifyEmail,
  sendBookingEmail,
  sendBookingReminderEmail,
  sendTablePinEmail,
};
