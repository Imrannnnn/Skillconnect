import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user.js";
import sendEmail from "../utils/sendEmail.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      categories,
      providerType,
      providerMode,
      social,
      instagram,
      facebook,
      tiktok,
      whatsapp,
      website,
    } = req.body;

    if (!email || !password) return res.status(400).json({ message: "email & password required" });
    const exists = await User.findOne({ email }); if (exists) return res.status(400).json({ message: "Email in use" });

    const hash = await bcrypt.hash(password, 10);

    // Build social object from either nested social or flat fields
    const socialPayload = {
      instagram: social?.instagram ?? instagram,
      facebook: social?.facebook ?? facebook,
      tiktok: social?.tiktok ?? tiktok,
      whatsapp: social?.whatsapp ?? whatsapp,
      website: social?.website ?? website,
    };

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      categories,
      providerType,
      providerMode,
      social: socialPayload,
      verificationToken,
    });

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
    try {
      const verifyUrl = `${FRONTEND_URL}/verify-email/${verificationToken}`;
      const html = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
          <h2 style="margin-bottom: 8px;">Welcome to SkillConnect</h2>
          <p style="margin: 0 0 12px 0;">Thanks for creating an account. Please verify your email address so we can keep your account secure.</p>
          <p style="margin: 0 0 16px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: #059669; color: #fff; text-decoration: none; font-weight: 500;">Verify email</a>
          </p>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">If you did not create this account, you can ignore this email.</p>
        </div>`;
      await sendEmail(user.email, "Verify your SkillConnect account", html);
    } catch {
      // Ignore email errors during registration; user can request verification later if needed
    }

    res.status(201).json({ user, token });
  } catch (e) { res.status(500).json({ message: "Failed to register", error: e }); }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }); if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password || ""); if (!ok) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
    res.json({ user, token });
  } catch (e) { res.status(500).json({ message: "Failed to login", error: e }); }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether email exists
      return res.json({ message: "If an account exists for this email, a reset link has been sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
        <h2 style="margin-bottom: 8px;">Password reset</h2>
        <p style="margin: 0 0 12px 0;">We received a request to reset the password for your account.</p>
        <p style="margin: 0 0 12px 0;">If you made this request, click the button below to set a new password. This link will expire in 1 hour.</p>
        <p style="margin: 0 0 16px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: #059669; color: #fff; text-decoration: none; font-weight: 500;">Reset password</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">If you did not request a password reset, you can ignore this email.</p>
      </div>`;

    await sendEmail(user.email, "Reset your SkillConnect password", html);
    res.json({ message: "If an account exists for this email, a reset link has been sent" });
  } catch (e) {
    res.status(500).json({ message: "Failed to start password reset", error: e });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset. You can now log in with your new password." });
  } catch (e) {
    res.status(500).json({ message: "Failed to reset password", error: e });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ message: "Verification token is required" });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "Verification link is invalid or has already been used" });

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (e) {
    res.status(500).json({ message: "Failed to verify email", error: e });
  }
};
