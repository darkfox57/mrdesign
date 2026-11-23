// Shared by the auth config (also loaded by scripts outside Next, such as create-admin) and the
// reset email, so it must not import server-only modules.
export const RESET_PASSWORD_PATH = "/admin/restablecer";
export const RESET_TOKEN_SECONDS = 60 * 60;
