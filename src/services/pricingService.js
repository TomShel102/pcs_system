/**
 * Tính phí giữ xe dựa trên thời gian vào/ra và loại vé
 * @param {Date} timeIn - Thời gian vào
 * @param {Date} timeOut - Thời gian ra
 * @param {boolean} hasMonthlyTicket - Có vé tháng hay không
 * @param {object} pricingConfig - Cấu hình giá từ bảng pricing_config
 * @returns {number} Phí giữ xe (VND)
 */
function calculateFee(
  timeIn,
  timeOut,
  hasMonthlyTicket,
  pricingConfig = { free_minutes: 10, day_rate: 5000, night_rate: 10000, max_daily_fee: 15000 }
) {
  // Nếu có vé tháng -> miễn phí
  if (hasMonthlyTicket) {
    return 0;
  }

  const startTime = new Date(timeIn);
  const endTime = new Date(timeOut);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error('Dữ liệu thời gian không hợp lệ để tính phí');
  }

  if (endTime <= startTime) {
    return 0;
  }

  // Chuyển đổi thời gian thành phút: (ms) / (ms per minute)
  const durationMinutes = (endTime - startTime) / (1000 * 60);

  const freeMinutes = Number(pricingConfig.free_minutes ?? 10);
  const dayFee = Number(pricingConfig.day_rate ?? 5000);
  const nightFee = Number(pricingConfig.night_rate ?? 10000);
  const maxDailyFee = Number(pricingConfig.max_daily_fee ?? 15000);

  // Nếu thời gian giữ xe <= free_minutes -> miễn phí (quay đầu)
  if (durationMinutes <= freeMinutes) {
    return 0;
  }

  // Định nghĩa khung giờ
  const DAY_SHIFT_START = 6;     // 06:00
  const DAY_SHIFT_END = 18;      // 18:00
  const NIGHT_SHIFT_START = 18;  // 18:00
  const NIGHT_SHIFT_END = 6;     // 06:00 (hôm sau)
  
  // Tính theo từng ngày lịch: mỗi ngày chỉ cộng 1 lần ca ngày/ca đêm nếu có chạm.
  const visitedDays = new Map();
  let currentTime = new Date(startTime);

  while (currentTime < endTime) {
    const dayKey = `${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}`;
    const hour = currentTime.getHours();
    const state = visitedDays.get(dayKey) || { day: false, night: false };

    if (hour >= DAY_SHIFT_START && hour < DAY_SHIFT_END) {
      state.day = true;
    } else if (hour >= NIGHT_SHIFT_START || hour < NIGHT_SHIFT_END) {
      state.night = true;
    }

    visitedDays.set(dayKey, state);
    currentTime.setHours(currentTime.getHours() + 1);
  }

  let totalFee = 0;
  for (const state of visitedDays.values()) {
    let dailyFee = 0;
    if (state.day) {
      dailyFee += dayFee;
    }
    if (state.night) {
      dailyFee += nightFee;
    }
    totalFee += Math.min(dailyFee, maxDailyFee);
  }

  return Number(totalFee);
}

export { calculateFee };
