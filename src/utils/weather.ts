// src/utils/weather.ts

/** รูปทรงข้อมูลที่ open-meteo (current_weather=true) ส่งกลับมา (เฉพาะฟิลด์ที่ใช้งาน) */
export interface OpenMeteoResponse {
  current_weather?: {
    temperature: number;
  };
}
