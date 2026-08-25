import { ApiError } from "../../utils/ApiError.js";

import authRepository from "./auth.repository.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

import { hashRefreshToken } from "../../utils/token.js";

class AuthService {
  async loginWithGoogle(profile, req) {
    const user = await authRepository.findOrCreateGoogleUser(profile);

    const userAgent = req.get("user-agent") || "";
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "";

    // Temporary session
    const session = await authRepository.createSession({
      userId: user.id,
      refreshTokenHash: "",
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    await authRepository.updateSessionToken(
      session.id,
      hashRefreshToken(refreshToken),
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken) {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "Invalid refresh token");
    }

    const session = await authRepository.findSessionById(payload.sessionId);

    if (!session) {
      throw new ApiError(401, "Session not found");
    }

    if (session.expiresAt < new Date()) {
      await authRepository.deleteSession(session.id);
      throw new ApiError(401, "Session expired");
    }

    const hashed = hashRefreshToken(refreshToken);

    if (hashed !== session.refreshToken) {
      throw new ApiError(
        401,
        "Refresh token is invalid or has already been used. Please login again.",
      );
    }

    const user = await authRepository.findUserById(payload.userId);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Rotate: generate a NEW refresh token so the old one is invalidated
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    await authRepository.updateSessionToken(
      session.id,
      hashRefreshToken(newRefreshToken),
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        status: user.status,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(sessionId) {
    const session = await authRepository.findSessionById(sessionId);

    if (!session) {
      return;
    }

    await authRepository.deleteSession(sessionId);
  }

  async logoutAll(userId) {
    await authRepository.deleteAllSessions(userId);
  }

  async getCurrentUser(userId) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      role: user.role,
      status: user.status,
    };
  }
}

export default new AuthService();
