/**
 * Deterministic tutor responses (no external LLM).
 * Mirrors the educational guardrails from the product spec.
 */

const REFUSAL_HINT =
  "I can't give full answers or do the work for you — let's focus on one small step you can try yourself.";

function wantsFullAnswer(message) {
  const m = message.toLowerCase();
  return (
    /\b(give me the answer|full answer|just tell me|do it for me|write (it|this|my)|solve it for)\b/.test(
      m,
    ) || /\bwhat is the answer\b/.test(m)
  );
}

function buildHint(assignmentText, userMessage) {
  const text = assignmentText.toLowerCase();
  const msg = userMessage.toLowerCase();

  if (/essay|paragraph|thesis|write about|argument/i.test(text) || /essay/i.test(msg)) {
    return "Start with a one-sentence thesis that answers the prompt. Jot two pieces of evidence you could use before you draft.";
  }

  if (/lab|report|hypothesis|experiment/i.test(text)) {
    return "State your hypothesis in one sentence. List the variables you will measure and what you need to gather first.";
  }

  if (
    /equation|solve|math|algebra|geometry|calculus|fraction|graph|word problem/i.test(text) ||
    /\d+\s*[+\-*/^]/.test(text)
  ) {
    return "Write what the problem is asking for in your own words. List the known values, then pick one operation or formula to try first — don't skip to the answer.";
  }

  if (/read|chapter|annotate|article|textbook/i.test(text)) {
    return "Skim headings or bold terms first. Read one section and summarize it in two sentences before moving on.";
  }

  if (/quiz|test|study guide|review/i.test(text)) {
    return "List the topics your teacher said will be on the assessment. Pick the one you are least sure about and write three questions you could practice.";
  }

  if (/presentation|slide|speak/i.test(text)) {
    return "Write your main point in one sentence. Outline three bullets you need to cover — intro, evidence, conclusion.";
  }

  if (msg.includes("stuck") || msg.includes("don't know") || msg.includes("where start")) {
    return "Set a 10-minute timer. Your only job in that time is to re-read the instructions and underline action verbs (explain, compare, solve, etc.).";
  }

  if (msg.includes("next")) {
    return "Look at the last step you finished. Name the very next small action — one problem, one paragraph, or one source to open.";
  }

  const snippet = assignmentText.trim().slice(0, 120);
  return `Break the assignment into the smallest first action (about 10 minutes). For "${snippet}${assignmentText.length > 120 ? "…" : ""}", that might mean gathering materials or rewriting the prompt in your own words.`;
}

/**
 * @param {string} assignmentText
 * @param {string} chatMessage
 * @returns {string}
 */
export function simulateTutorResponse(assignmentText, chatMessage) {
  const assignment = (assignmentText ?? "").trim();
  const message = (chatMessage ?? "").trim();

  if (!assignment) {
    return "Here is your step-by-step hint: Select an assignment above so I know what you're working on. What do you think the next step should be?";
  }

  if (!message) {
    return "Here is your step-by-step hint: Type what you're stuck on or what you've tried so far. What do you think the next step should be?";
  }

  const hint = wantsFullAnswer(message) ? REFUSAL_HINT : buildHint(assignment, message);

  return `Here is your step-by-step hint: ${hint} What do you think the next step should be?`;
}
