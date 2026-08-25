const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RENDER === "true" ||
  Boolean(process.env.RENDER_SERVICE_ID);

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000,
};

export const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const csrfCookieOptions = {
  ...baseCookieOptions,
  maxAge: 12 * 60 * 60 * 1000,
  httpOnly: false,
  sameSite: isProduction ? "none" : "lax",
};
