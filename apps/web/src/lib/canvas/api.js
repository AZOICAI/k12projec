/** Canvas REST helpers — paginate link-header collections. */
export async function canvasGetAll(domain, accessToken, path) {
  const items = [];
  let nextPath = path;

  while (nextPath) {
    const url = nextPath.startsWith("http")
      ? nextPath
      : `https://${domain}/api/v1${nextPath}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Canvas API ${res.status}`);
    }

    const page = await res.json();
    if (Array.isArray(page)) {
      items.push(...page);
    }

    const link = res.headers.get("link");
    nextPath = null;
    if (link) {
      const match = link.match(/<([^>]+)>;\s*rel="next"/);
      if (match) {
        const nextUrl = new URL(match[1]);
        nextPath = nextUrl.pathname.replace(/^\/api\/v1/, "") + nextUrl.search;
      }
    }
  }

  return items;
}

export async function listActiveCourses(domain, accessToken) {
  const courses = await canvasGetAll(
    domain,
    accessToken,
    "/courses?enrollment_state=active&per_page=50",
  );
  return courses.filter((c) => c.id && !c.access_restricted_by_date);
}

export async function listCourseAssignments(domain, accessToken, courseId) {
  return canvasGetAll(
    domain,
    accessToken,
    `/courses/${courseId}/assignments?per_page=50&order_by=due_at&include[]=submission`,
  );
}

/** Current user's enrollment + grades for one course. */
export async function getCourseEnrollmentGrade(domain, accessToken, courseId) {
  const enrollments = await canvasGetAll(
    domain,
    accessToken,
    `/courses/${courseId}/enrollments?user_id=self&per_page=10&include[]=total_scores`,
  );
  const row =
    enrollments.find((e) => e.type === "StudentEnrollment") ??
    enrollments.find((e) => String(e.user_id) === "self") ??
    enrollments[0];
  return row?.grades ?? null;
}
