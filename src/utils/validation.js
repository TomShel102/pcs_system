import { createAppError } from './http.js';

export const normalizeLicensePlate = (value) => String(value || '').trim().toUpperCase();
export const VEHICLE_TYPES = ['MOTORBIKE', 'CAR', 'SUV', 'TRUCK'];

const LEGACY_VEHICLE_TYPE_MAP = {
  '1': 'MOTORBIKE',
  '2': 'CAR',
  '3': 'SUV',
  '4': 'TRUCK'
};

export const normalizeVehicleType = (value) => {
  const rawValue = String(value || '').trim().toUpperCase();
  const mappedValue = LEGACY_VEHICLE_TYPE_MAP[rawValue] || rawValue;
  if (!VEHICLE_TYPES.includes(mappedValue)) {
    throw createAppError(400, 'Loại xe không hợp lệ. Chỉ chấp nhận MOTORBIKE, CAR, SUV, TRUCK');
  }
  return mappedValue;
};

export const requireFields = (payload, fields) => {
  const missingFields = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    throw createAppError(400, `Thiếu trường bắt buộc: ${missingFields.join(', ')}`);
  }
};
