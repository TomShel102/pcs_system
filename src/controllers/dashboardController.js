import { query } from '../db.js';
import { sendError, sendSuccess } from '../utils/http.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const [vehiclesInLotResult, checkInTodayResult, checkOutTodayResult, revenueTodayResult, hourlyRevenueResult] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total
         FROM parking_sessions
         WHERE time_out IS NULL
           AND is_deleted = FALSE`
      ),
      query(
        `SELECT COUNT(*)::int AS total
         FROM parking_sessions
         WHERE DATE(time_in) = CURRENT_DATE
           AND is_deleted = FALSE`
      ),
      query(
        `SELECT COUNT(*)::int AS total
         FROM parking_sessions
         WHERE time_out IS NOT NULL
           AND DATE(time_out) = CURRENT_DATE
           AND is_deleted = FALSE`
      ),
      query(
        `SELECT COALESCE(SUM(total_fee), 0)::numeric AS total
         FROM parking_sessions
         WHERE time_out IS NOT NULL
           AND DATE(time_out) = CURRENT_DATE
           AND is_deleted = FALSE`
      ),
      query(
        `SELECT
          hours.hour AS hour,
          COALESCE(SUM(ps.total_fee), 0)::numeric AS revenue
        FROM generate_series(0, 23) AS hours(hour)
        LEFT JOIN parking_sessions ps
          ON EXTRACT(HOUR FROM ps.time_out) = hours.hour
          AND ps.time_out IS NOT NULL
          AND DATE(ps.time_out) = CURRENT_DATE
          AND ps.is_deleted = FALSE
        GROUP BY hours.hour
        ORDER BY hours.hour`
      )
    ]);

    return sendSuccess(res, 200, {
      data: {
        vehicles_in_lot: vehiclesInLotResult.rows[0].total,
        check_ins_today: checkInTodayResult.rows[0].total,
        check_outs_today: checkOutTodayResult.rows[0].total,
        revenue_today: Number(revenueTodayResult.rows[0].total),
        hourly_revenue: hourlyRevenueResult.rows.map((row) => ({
          hour: Number(row.hour),
          revenue: Number(row.revenue)
        }))
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getActiveParkingSessions = async (req, res) => {
  try {
    const rows = await query(
      `SELECT
        ps.id,
        v.license_plate,
        v.vehicle_type,
        ps.time_in,
        s.slot_code
      FROM parking_sessions ps
      JOIN vehicles v ON v.id = ps.vehicle_id
      LEFT JOIN parking_slots s ON s.id = ps.slot_id
      WHERE ps.time_out IS NULL
        AND ps.is_deleted = FALSE
        AND v.is_deleted = FALSE
      ORDER BY ps.time_in DESC
      LIMIT 300`
    );

    return sendSuccess(res, 200, {
      data: rows.rows
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getParkingLayout = async (req, res) => {
  try {
    const layoutResult = await query(
      `SELECT
        a.code AS area_code,
        a.name AS area_name,
        s.id AS slot_id,
        s.slot_code,
        s.supported_vehicle_type,
        s.status,
        ps.id AS session_id,
        ps.time_in,
        v.license_plate
      FROM parking_areas a
      JOIN parking_slots s ON s.area_id = a.id
      LEFT JOIN parking_sessions ps
        ON ps.slot_id = s.id
        AND ps.time_out IS NULL
        AND ps.is_deleted = FALSE
      LEFT JOIN vehicles v ON v.id = ps.vehicle_id
      WHERE a.is_deleted = FALSE
        AND a.is_active = TRUE
        AND s.is_deleted = FALSE
        AND s.is_active = TRUE
      ORDER BY a.code, s.slot_code`
    );

    const grouped = new Map();
    for (const row of layoutResult.rows) {
      if (!grouped.has(row.area_code)) {
        grouped.set(row.area_code, {
          area_code: row.area_code,
          area_name: row.area_name,
          slots: []
        });
      }
      grouped.get(row.area_code).slots.push({
        slot_id: row.slot_id,
        slot_code: row.slot_code,
        supported_vehicle_type: row.supported_vehicle_type,
        status: row.status,
        current_vehicle: row.license_plate || null,
        time_in: row.time_in || null
      });
    }

    const areas = [...grouped.values()].map((area) => {
      const total = area.slots.length;
      const occupied = area.slots.filter((slot) => slot.status === 'OCCUPIED').length;
      return {
        ...area,
        summary: {
          total_slots: total,
          occupied_slots: occupied,
          free_slots: total - occupied
        }
      };
    });

    return sendSuccess(res, 200, { data: areas });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getSlotSuggestion = async (req, res) => {
  try {
    const vehicleType = String(req.query.vehicle_type || '').trim();
    if (!vehicleType) {
      return sendSuccess(res, 200, {
        data: {
          suggestion: null,
          alerts: [],
          message: 'Vui lòng chọn loại xe để nhận gợi ý vị trí đỗ.'
        }
      });
    }

    const [suggestionResult, areaLoadResult] = await Promise.all([
      query(
        `SELECT s.id, s.slot_code, a.code AS area_code, a.name AS area_name
         FROM parking_slots s
         JOIN parking_areas a ON a.id = s.area_id
         WHERE s.is_deleted = FALSE
           AND s.is_active = TRUE
           AND s.status = 'FREE'
           AND a.is_deleted = FALSE
           AND a.is_active = TRUE
           AND (s.supported_vehicle_type IS NULL OR s.supported_vehicle_type = $1)
         ORDER BY a.code, s.slot_code
         LIMIT 1`,
        [vehicleType]
      ),
      query(
        `SELECT
          a.code AS area_code,
          a.name AS area_name,
          COUNT(*)::int AS total_slots,
          COUNT(*) FILTER (WHERE s.status = 'OCCUPIED')::int AS occupied_slots
         FROM parking_areas a
         JOIN parking_slots s ON s.area_id = a.id
         WHERE a.is_deleted = FALSE
           AND a.is_active = TRUE
           AND s.is_deleted = FALSE
           AND s.is_active = TRUE
         GROUP BY a.code, a.name
         ORDER BY a.code`
      )
    ]);

    const alerts = areaLoadResult.rows
      .map((row) => {
        const total = Number(row.total_slots || 0);
        const occupied = Number(row.occupied_slots || 0);
        const fillRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        return {
          area_code: row.area_code,
          area_name: row.area_name,
          fill_rate: fillRate
        };
      })
      .filter((item) => item.fill_rate >= 85)
      .map((item) => ({
        ...item,
        level: item.fill_rate >= 95 ? 'HIGH' : 'MEDIUM',
        message: `Khu ${item.area_code} đang lấp đầy ${item.fill_rate}%.`
      }));

    const suggestion = suggestionResult.rows[0]
      ? {
          slot_id: suggestionResult.rows[0].id,
          slot_code: suggestionResult.rows[0].slot_code,
          area_code: suggestionResult.rows[0].area_code,
          area_name: suggestionResult.rows[0].area_name
        }
      : null;

    return sendSuccess(res, 200, {
      data: {
        suggestion,
        alerts,
        message: suggestion
          ? `Đề xuất đỗ tại ${suggestion.slot_code} (${suggestion.area_name}).`
          : 'Hiện không còn chỗ trống phù hợp cho loại xe này.'
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};
