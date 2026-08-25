import { Router } from "express";
import passport from "passport";

import authController from "./auth.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { refreshTokenSchema } from "./auth.validation.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const authRoutes = Router();

authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

const getFrontendLoginUrl = () => {
  const url = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  return `${url}/login`;
};

authRoutes.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
      failureRedirect: getFrontendLoginUrl(),
    })(req, res, next);
  },
  authController.googleSuccess,
);

authRoutes.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refresh,
);

authRoutes.post("/logout", authenticate, authController.logout);

authRoutes.post("/logout-all", authenticate, authController.logoutAll);

authRoutes.get("/me", authenticate, authController.me);

export default authRoutes;
