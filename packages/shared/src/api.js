/** API version prefix used by web app and extension */
export const API_V1_PREFIX = "/api/v1";

export const apiPaths = {
  terms: `${API_V1_PREFIX}/terms`,
  course: (id) => `${API_V1_PREFIX}/courses/${id}`,
  courses: `${API_V1_PREFIX}/courses`,
  assignment: (id) => `${API_V1_PREFIX}/assignments/${id}`,
  assignments: `${API_V1_PREFIX}/assignments`,
  studyBlock: (id) => `${API_V1_PREFIX}/study-blocks/${id}`,
  studyBlocks: `${API_V1_PREFIX}/study-blocks`,
  extensionSession: `${API_V1_PREFIX}/extension-session`,
};

/** Build full URL for extension (pass origin like https://app.example.com) */
export function fullUrl(origin, path) {
  const base = origin.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
