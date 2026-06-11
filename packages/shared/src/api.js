/** API version prefix used by web app and extension */
export const API_V1_PREFIX = "/api/v1";

export const apiPaths = {
  terms: `${API_V1_PREFIX}/terms`,
  term: (id) => `${API_V1_PREFIX}/terms/${id}`,
  course: (id) => `${API_V1_PREFIX}/courses/${id}`,
  courses: `${API_V1_PREFIX}/courses`,
  assignment: (id) => `${API_V1_PREFIX}/assignments/${id}`,
  assignments: `${API_V1_PREFIX}/assignments`,
  studyBlock: (id) => `${API_V1_PREFIX}/study-blocks/${id}`,
  studyBlocks: `${API_V1_PREFIX}/study-blocks`,
  studySessions: `${API_V1_PREFIX}/study-sessions`,
  extensionSession: `${API_V1_PREFIX}/extension-session`,
  preferences: `${API_V1_PREFIX}/preferences`,
  assignmentsUpcoming: `${API_V1_PREFIX}/assignments/upcoming`,
  account: `${API_V1_PREFIX}/account`,
  publicConfig: `${API_V1_PREFIX}/config/public`,
  validateSignup: `${API_V1_PREFIX}/auth/validate-signup`,
  canvasStatus: `${API_V1_PREFIX}/canvas/status`,
  canvasConnect: `${API_V1_PREFIX}/canvas/connect`,
  canvasSync: `${API_V1_PREFIX}/canvas/sync`,
  canvasDisconnect: `${API_V1_PREFIX}/canvas/disconnect`,
  canvasPersonalToken: `${API_V1_PREFIX}/canvas/personal-token`,
  tutorChat: `${API_V1_PREFIX}/tutor/chat`,
};

/** Build full URL for extension (pass origin like https://app.example.com) */
export function fullUrl(origin, path) {
  const base = origin.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
