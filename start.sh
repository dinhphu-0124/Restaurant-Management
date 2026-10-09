#!/bin/bash

# ==============================================================================
# Script khởi chạy toàn bộ hệ thống (Docker DB, Backend & Frontend)
# ==============================================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\n${CYAN}${BOLD}======================================================${NC}"
echo -e "${CYAN}${BOLD} 🚀 ĐANG KHỞI ĐỘNG HỆ THỐNG QUẢN LÝ NHÀ HÀNG DÊ HƯƠNG SƠN... ${NC}"
echo -e "${CYAN}${BOLD}======================================================${NC}\n"

# 1. Kiểm tra và tự động khởi động Docker Database nếu có
if command -v docker &> /dev/null && [ -f "$ROOT_DIR/docker-compose.yml" ]; then
    echo -e "${YELLOW}🐳 Đang kiểm tra & khởi động Database (MySQL & phpMyAdmin)...${NC}"
    (cd "$ROOT_DIR" && docker compose up -d >/dev/null 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database Docker đã sẵn sàng!${NC}"
    else
        echo -e "${YELLOW}⚠️ Không thể tự chạy Docker (vui lòng đảm bảo Docker Desktop đang mở nếu dùng MySQL Docker).${NC}"
    fi
fi

# Hàm dọn dẹp tiến trình khi bấm Ctrl+C
cleanup() {
    echo -e "\n\n${YELLOW}🛑 Đang dừng các dịch vụ (Backend & Frontend)...${NC}"
    kill $(jobs -p) 2>/dev/null
    echo -e "${GREEN}✅ Đã tắt toàn bộ dịch vụ an toàn! Hẹn gặp lại.${NC}\n"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 2. Khởi chạy Backend
echo -e "${BLUE}▶ Đang khởi động Backend (Node.js/Express)...${NC}"
(cd "$ROOT_DIR/backend" && npm run dev) &
BACKEND_PID=$!

# 3. Khởi chạy Frontend
echo -e "${MAGENTA}▶ Đang khởi động Frontend (Vite/React)...${NC}"
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

# Đợi 2 giây để các tiến trình khởi tạo
sleep 2

# Hiển thị bảng điều hướng liên kết
echo -e "\n${GREEN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD} 🎉 HỆ THỐNG ĐÃ HOẠT ĐỘNG!${NC}"
echo -e "${GREEN}${BOLD}======================================================${NC}"
echo -e "${BOLD}🔗 DANH SÁCH ĐƯỜNG LINK TRUY CẬP HỆ THỐNG:${NC}"
echo -e "   🌐 ${BOLD}Khách hàng (Client Website):${NC}  ${CYAN}http://localhost:5173${NC}"
echo -e "   💼 ${BOLD}Trang Quản trị (Admin):${NC}        ${CYAN}http://localhost:5173/admin${NC}"
echo -e "   ⚙️ ${BOLD}Máy chủ Backend API:${NC}           ${CYAN}http://localhost:5001${NC}"
echo -e "   🗄️ ${BOLD}Quản lý Database (phpMyAdmin):${NC} ${CYAN}http://localhost:8080${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "${YELLOW}💡 Gợi ý: Nhấn ${BOLD}Ctrl + C${NC}${YELLOW} để dừng toàn bộ hệ thống bất cứ lúc nào.${NC}\n"

# Chờ các tiến trình con
wait
