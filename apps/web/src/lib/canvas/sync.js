import { createAdminClient } from "@/lib/supabase/admin";
import { listActiveCourses, listCourseAssignments } from "./api";
import { getCanvasConnection, getValidAccessToken, touchLastSynced } from "./connection";

function parseCanvasDueAt(assignment) {
  if (assignment.due_at) return assignment.due_at;
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export async function syncCanvasForUser(userId) {
  const connection = await getCanvasConnection(userId);
  if (!connection) {
    return { error: "Not connected to Canvas", courses: 0, assignments: 0 };
  }

  const accessToken = await getValidAccessToken(connection);
  if (!accessToken) {
    return { error: "Canvas session expired. Connect again.", courses: 0, assignments: 0 };
  }

  const admin = createAdminClient();
  const domain = connection.canvas_domain;
  const canvasCourses = await listActiveCourses(domain, accessToken);

  let courseCount = 0;
  let assignmentCount = 0;

  for (const cc of canvasCourses) {
    const canvasCourseId = String(cc.id);
    const courseName = cc.name || cc.course_code || `Course ${canvasCourseId}`;

    const { data: existingCourse } = await admin
      .from("courses")
      .select("id")
      .eq("user_id", userId)
      .eq("canvas_course_id", canvasCourseId)
      .maybeSingle();

    let localCourseId = existingCourse?.id;

    if (!localCourseId) {
      const { data: created, error } = await admin
        .from("courses")
        .insert({
          user_id: userId,
          name: courseName,
          color: "#3B82F6",
          canvas_course_id: canvasCourseId,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      localCourseId = created.id;
      courseCount += 1;
    } else {
      await admin.from("courses").update({ name: courseName }).eq("id", localCourseId);
    }

    const canvasAssignments = await listCourseAssignments(domain, accessToken, cc.id);

    for (const ca of canvasAssignments) {
      if (!ca.id) continue;
      const canvasAssignmentId = String(ca.id);
      const dueAt = parseCanvasDueAt(ca);
      const title = ca.name || "Assignment";
      const htmlUrl = ca.html_url ?? null;

      const { data: existing } = await admin
        .from("assignments")
        .select("id")
        .eq("user_id", userId)
        .eq("canvas_assignment_id", canvasAssignmentId)
        .maybeSingle();

      if (existing?.id) {
        await admin
          .from("assignments")
          .update({
            title,
            due_at: dueAt,
            course_id: localCourseId,
            canvas_course_id: canvasCourseId,
            source_url: htmlUrl,
          })
          .eq("id", existing.id);
      } else {
        const { error } = await admin.from("assignments").insert({
          user_id: userId,
          course_id: localCourseId,
          title,
          due_at: dueAt,
          status: "todo",
          canvas_assignment_id: canvasAssignmentId,
          canvas_course_id: canvasCourseId,
          source_url: htmlUrl,
        });
        if (error) throw new Error(error.message);
        assignmentCount += 1;
      }
    }
  }

  await touchLastSynced(userId);

  return {
    courses: courseCount,
    assignments: assignmentCount,
    updated_courses: canvasCourses.length,
  };
}
