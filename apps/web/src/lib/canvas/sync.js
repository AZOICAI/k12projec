import { getStaleDueCutoff } from "@/lib/assignments/stale";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  averageAssignmentGradePercent,
  parseEnrollmentGradePercent,
} from "@/lib/canvas/courseGrades";
import { getCourseEnrollmentGrade, listActiveCourses, listCourseAssignments } from "./api";
import { extractCanvasGrades } from "@/lib/assignments/grades";
import { ARCHIVE_PAST_DAYS, resolveCanvasStatus, shouldImportCanvasAssignment } from "./assignmentImport";
import { getCanvasConnection, getValidAccessToken, touchLastSynced } from "./connection";

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

      const { data: existing } = await admin
        .from("assignments")
        .select("id, status")
        .eq("user_id", userId)
        .eq("canvas_assignment_id", canvasAssignmentId)
        .maybeSingle();

      const status = resolveCanvasStatus(ca, existing?.status);

      const inImportWindow = shouldImportCanvasAssignment(ca);

      if (!inImportWindow && !existing?.id) continue;

      if (!inImportWindow && existing?.id) {
        const grades = extractCanvasGrades(ca);
        await admin.from("assignments").update({ status, ...grades }).eq("id", existing.id);
        continue;
      }

      const dueAt = ca.due_at;
      if (!dueAt) continue;

      const title = ca.name || "Assignment";
      const htmlUrl = ca.html_url ?? null;
      const grades = extractCanvasGrades(ca);

      if (existing?.id) {
        await admin
          .from("assignments")
          .update({
            title,
            due_at: dueAt,
            course_id: localCourseId,
            canvas_course_id: canvasCourseId,
            source_url: htmlUrl,
            status,
            ...grades,
          })
          .eq("id", existing.id);
      } else {
        const { error } = await admin.from("assignments").insert({
          user_id: userId,
          course_id: localCourseId,
          title,
          due_at: dueAt,
          status,
          canvas_assignment_id: canvasAssignmentId,
          canvas_course_id: canvasCourseId,
          source_url: htmlUrl,
          ...grades,
        });
        if (error) throw new Error(error.message);
        assignmentCount += 1;
      }
    }

    let courseGradePercent = null;
    try {
      const enrollmentGrades = await getCourseEnrollmentGrade(domain, accessToken, cc.id);
      courseGradePercent = parseEnrollmentGradePercent(enrollmentGrades);
    } catch {
      /* enrollment grades are optional */
    }

    if (courseGradePercent == null) {
      const { data: courseAssignments } = await admin
        .from("assignments")
        .select("grade_percent")
        .eq("course_id", localCourseId)
        .eq("user_id", userId);
      courseGradePercent = averageAssignmentGradePercent(courseAssignments ?? []);
    }

    if (courseGradePercent != null) {
      await admin
        .from("courses")
        .update({ current_grade_percent: courseGradePercent })
        .eq("id", localCourseId);
    }
  }

  const weekStart = getStaleDueCutoff();
  const archiveCutoff = new Date(
    Date.now() - ARCHIVE_PAST_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  for (const cutoff of [weekStart, archiveCutoff]) {
    await admin
      .from("assignments")
      .update({ status: "done" })
      .eq("user_id", userId)
      .not("canvas_assignment_id", "is", null)
      .lt("due_at", cutoff)
      .in("status", ["todo", "in_progress"]);
  }

  await touchLastSynced(userId);

  return {
    courses: courseCount,
    assignments: assignmentCount,
    updated_courses: canvasCourses.length,
  };
}
