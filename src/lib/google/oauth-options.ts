/**
 * Single source of truth for the Google OAuth request. Used by the login
 * page AND every "Reconnect Google" button so a reconnect always re-requests
 * offline access + the full scope set (otherwise Google may omit the refresh
 * token or narrow the scopes).
 */
export const GOOGLE_OAUTH_SCOPES =
  "email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/tasks";

export function googleOAuthOptions(origin: string) {
  return {
    redirectTo: `${origin}/auth/callback`,
    queryParams: { access_type: "offline", prompt: "consent" },
    scopes: GOOGLE_OAUTH_SCOPES,
  };
}
