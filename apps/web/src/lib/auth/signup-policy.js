/**
 * Purpose: Restrict who can sign up (school beta).
 * Configure via ALLOWED_SIGNUP_EMAIL_DOMAINS and optional SIGNUP_INVITE_CODE.
 */

export function getAllowedEmailDomains() {
  const raw = process.env.ALLOWED_SIGNUP_EMAIL_DOMAINS ?? "";
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowedForSignup(email) {
  const domains = getAllowedEmailDomains();
  if (domains.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return domains.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`));
}

export function getSignupInviteCode() {
  return process.env.SIGNUP_INVITE_CODE?.trim() ?? "";
}

export function isInviteCodeValid(code) {
  const required = getSignupInviteCode();
  if (!required) return true;
  return code?.trim() === required;
}

export function getSignupPolicyForClient() {
  const domains = getAllowedEmailDomains();
  const inviteRequired = Boolean(getSignupInviteCode());
  return {
    emailRestrictionEnabled: domains.length > 0,
    allowedDomains: domains,
    allowedDomainHint: domains.length > 0 ? domains.join(", ") : null,
    inviteCodeRequired: inviteRequired,
    isBeta: domains.length > 0 || inviteRequired,
  };
}
