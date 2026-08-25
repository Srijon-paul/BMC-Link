import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";

import {
  accessCookieOptions,
  refreshCookieOptions,
} from "../../utils/cookies.js";

import authService from "./auth.service.js";

class AuthController {
  googleSuccess = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } =
      await authService.loginWithGoogle(req.user, req);

    const redirectUrl =
      process.env.FRONTEND_SUCCESS_URL ||
      (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/+$/, "")}/dashboard` : "http://localhost:5173/dashboard");

    res
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .redirect(redirectUrl);
  });

  refresh = asyncHandler(async (req, res) => {
    const refreshToken =
      req.body?.refreshToken?.trim() || req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }

    const {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    } = await authService.refreshTokens(refreshToken);

    res
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", newRefreshToken, refreshCookieOptions)
      .status(200)
      .json(new ApiResponse(200, user, "Token refreshed"));
  });

  logout = asyncHandler(async (req, res) => {
    if (req.sessionId) {
      await authService.logout(req.sessionId);
    }

    res
      .clearCookie("accessToken", accessCookieOptions)
      .clearCookie("refreshToken", refreshCookieOptions)
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully"));
  });

  logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user.id);

    res
      .clearCookie("accessToken", accessCookieOptions)
      .clearCookie("refreshToken", refreshCookieOptions)
      .status(200)
      .json(new ApiResponse(200, null, "Logged out from all devices"));
  });

  me = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);

    res
      .status(200)
      .json(new ApiResponse(200, user, "Current user fetched successfully"));
  });
}

export default new AuthController();
