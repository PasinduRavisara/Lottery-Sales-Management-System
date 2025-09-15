export const LOTTERY_BRANDS = [
  "Supiri Dhana Sampatha",
  "Ada Kotipathi",
  "Lagna Wasanawe",
  "Super Ball",
  "Shanida",
  "Kapruka",
  "Jayoda",
  "Sasiri",
];

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const SALES_METHODS = [
  "Counter",
  "Bicycle",
  "Other",
];

export const USER_ROLES = {
  ADMIN: "ADMIN",
  DEALER: "DEALER",
} as const;

export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_DISTRICT_LENGTH: 100,
  MAX_CITY_LENGTH: 100,
  MAX_DEALER_NAME_LENGTH: 100,
  MAX_DEALER_NUMBER_LENGTH: 50,
  MAX_ASSISTANT_NAME_LENGTH: 100,
  MAX_SALES_LOCATION_LENGTH: 200,
  MAX_TICKET_QUANTITY: 999999,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    SETUP_DEMO: "/auth/setup-demo",
  },
  SUBMISSIONS: {
    BASE: "/submissions",
    BY_ID: (id: string) => `/submissions/${id}`,
  },
  REPORTS: {
    SUMMARY: "/reports/summary",
    DASHBOARD: "/reports/dashboard",
    EXPORT: "/reports/export",
  },
};

export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  DRAFT_SUBMISSION: "draft_submission",
};

export const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};
