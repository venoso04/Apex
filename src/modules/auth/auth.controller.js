import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import randomstring from "randomstring";
import cron from "node-cron";

import { Token } from "../../../db/models/token.model.js";
import { allowedMembers } from "../../../db/models/allowedMembers.model.js";
import { Member } from "../../../db/models/members.model.js";
import { asyncHandler } from "../../utils/common/asyncHandler.js";
import { systemRoles } from "../../utils/common/enum.js";
import { AppError } from "../../utils/common/appError.js";
import { port } from "../../../index.js";
import sendEmail from "../../utils/sendEmail.js";

////////////////// sign up
export const signUp = asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;

  const allowedMember = await allowedMembers.findOne({ email });
  if (!allowedMember) {
    return res
      .status(403)
      .json({ message: "You are not authorized to sign up." });
  }

  let phoneExist = await Member.findOne({ phone });
  if (phoneExist) {
    return res.status(400).json({ message: "Phone already in use" });
  }

  let member = await Member.findOne({ email });
  if (member) {
    return res.status(400).json({ message: "Member already exists" });
  }

  const role = allowedMember.role || systemRoles.MEMBER;

  member = new Member({
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
  });
   
  // Send email
  const token = jsonwebtoken.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  const verificationUrl = `http://localhost:${port}/members/verify-account?token=${token}`;
  const emailMessage = `
    <p>If you have registered with your email, click here to verify your account: 
    <a href="${verificationUrl}">Verify your account</a></p>
    `;

  const emailSent = await sendEmail({
    to: email,
    subject: "Verify your account",
    message: emailMessage,
  });

  if (!emailSent) {
    return next(new AppError("Email could not be sent", 500));
  }

  await member.save();
  res
    .status(201)
    .json({
      message: "Member registered successfully, waiting on email confirmation",
    });
});

///////////////////// VERIFY EMAIL
export const verifyAccount = asyncHandler(async (req, res, next) => {
  // get data from req
  const { token } = req.query;
  const decode = jsonwebtoken.verify(token, process.env.JWT_SECRET);
  if (!decode?.email) {
    return next(new AppError("Invalid Token", 400));
  }
  const member = await Member.findOneAndUpdate(
    { email: decode.email, verifyEmail: false },
    { verifyEmail: true }
  );
  if (!member) {
    return next(new AppError("Member NotFound", 404));
  }
  return res
    .status(200)
    .json({ message: "Member has verified the account", success: true });
});

////////////////////// resend verification email
export const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Check if the member exists and email is not verified
  const member = await Member.findOne({ email, verifyEmail: false });

  if (!member) {
    return res
      .status(404)
      .json({ message: "No unverified account found for this email." });
  }

  // Check if enough time has passed since the last email was sent
  const now = Date.now();
  const minTimeBetweenEmails = 10 * 60 * 1000; // 10 minutes in milliseconds

  if (
    member.lastEmailSentAt &&
    now - member.lastEmailSentAt.getTime() < minTimeBetweenEmails
  ) {
    return res
      .status(429)
      .json({
        message: "Please wait before requesting another verification email.",
      });
  }

  // Generate a new verification token
  const token = jsonwebtoken.sign(
    { email: member.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // Create the verification URL
  const verificationUrl = `http://localhost:${port}/members/verify-account?token=${token}`;

  // Create the email message
  const emailMessage = `
    <p>You requested a new verification email. Click here to verify your account: 
    <a href="${verificationUrl}">Verify your account</a></p>
  `;

  // Send the email
  const emailSent = await sendEmail({
    to: email,
    subject: "Verify your account - New Link",
    message: emailMessage,
  });

  if (!emailSent) {
    return next(new AppError("Email could not be sent", 500));
  }

  // Update the lastEmailSentAt field
  member.lastEmailSentAt = now;
  await member.save();

  res
    .status(200)
    .json({
      message:
        "Verification email resent successfully. Please check your inbox.",
    });
});

//////////////////////login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if the member exists
  const member = await Member.findOne({ email });
  if (!member) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  // Check if the email is confirmed
  if (!member.verifyEmail) {
    return res
      .status(400)
      .json({
        message:
          "Email not confirmed. Please verify your email before logging in.",
      })
      .redirect(`http://localhost:${port}/members/resend-verify-email`);
  }

  // Check if the password matches
  const isMatch = await bcrypt.compare(password, member.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Invalidate all existing tokens for this user
  await Token.updateMany({ user: member._id }, { $set: { isValid: false } });

  // Generate JWT
  const token = jsonwebtoken.sign(
    { id: member._id, email: member.email },
    process.env.TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  // Store the token in the database
  await Token.create({
    token,
    user: member._id,
    agent: req.headers["user-agent"],
    expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
  });

  // Return the token to the client
  res.json({ message: "Logged in successfully", token });
});

////////////////////// Logout
export const logout = asyncHandler(async (req, res, next) => {
  const token = req.token;

  const isToken = await Token.findOneAndUpdate({ token }, { isValid: false });
  if (!isToken) return next(new Error("invalid token!"));
  // Send a response indicating successful logout
  res.json({ success: true, message: "Logout successful" });
});

//////////////////////  update email
export const updateEmail = asyncHandler(async (req, res, next) => {
  const { currentEmail, newEmail } = req.body;

  if (!currentEmail || !newEmail) {
    return next(new AppError("Please provide current and new email", 400));
  }

  // Check if the current email exists
  const member = await Member.findOne({ email: currentEmail });
  if (!member) {
    return next(new AppError("Invalid current email", 401));
  }

  // Generate verification code
  const verificationCode = randomstring.generate({
    length: 5,
    charset: "numeric",
  });

  // Send verification email
  const messageSent = await sendEmail({
    to: newEmail,
    subject: "Email Update Verification",
    message: `<div>Your email update verification code is: ${verificationCode}</div>`,
  });

  if (!messageSent) {
    return next(new AppError("Failed to send verification email", 500));
  }

  // Store the verification code and new email temporarily
  member.emailUpdateCode = verificationCode;
  member.pendingEmail = newEmail;
  try {
    await member.save();
  } catch (error) {
    return next(new AppError("Failed to save member details", 500));
  }

  res.status(200).json({
    message:
      "Verification code sent to new email. Please verify to complete the update.",
  });
});

//verify and complete email update
export const verifyEmailUpdate = asyncHandler(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  const member = await Member.findOne({ email });
  if (!member) {
    return next(new AppError("Invalid Email", 401));
  }

  if (member.emailUpdateCode !== verificationCode) {
    return next(new AppError("Invalid verification code", 400));
  }

  // Update email
  member.email = member.pendingEmail;
  member.emailUpdateCode = undefined;
  member.pendingEmail = undefined;
  await member.save();

  res.status(200).json({
    message: "Email updated successfully",
    newEmail: member.email,
  });
});

//////////////////////forget code
export const sendForgetCode = asyncHandler(async (req, res, next) => {
  const member = await Member.findOne({ email: req.body.email });
  if (!member) return next(new Error("Member not found"));
  if (!member.verifyEmail)
    return next(new Error("you must activate your account first!"));
  const code = randomstring.generate({
    length: 5,
    charset: "numeric",
  });
  member.forgetCode = code;
  await member.save();
  const messageSent = sendEmail({
    to: member.email,
    subject: "forget password code",
    message: `<div>The code is: ${code}</div>`,
  });
  if (!messageSent) return next(new Error("Error sending email"));
  return res.json("you can reset password now check email");
});

//////////////////////reset password (if user forgot the password)
export const resetPassword = asyncHandler(async (req, res, next) => {
  const member = await Member.findOne({ email: req.body.email });
  if (!member) return next(new AppError("email doesn't exist", { cause: 404 }));
  if (member.forgetCode != req.body.forgetCode) {
    return next(new Error("invalid code!"));
  }

  member.password = req.body.password;
  await member.save();
  // invalidate all tokens
  const tokens = await Token.find({ Member: member._id });
  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });
  await Member.findOneAndUpdate(
    { email: req.body.email },
    { $unset: { forgetCode: 1 } }
  );
  return res.json({ success: true, message: "you can login now" });
});

////////////////////// Update password
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { email, oldPassword, newPassword } = req.body;

  // Check if the Member exists and password matches
  const member = await Member.findOne({ email, isDeleted: false });
  if (!member) {
    return next(new Error("Member not found"), { cause: 404 });
  }
  const match = bcrypt.compareSync(oldPassword, member.password);
  if (!match) {
    return next(new Error("Incorrect old password"));
  }

  // Update the password
  member.password = newPassword;
  await member.save();
  // invalidate all tokens
  const tokens = await Token.find({ user: member._id });
  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });
  res.json({ success: true, message: "Password updated successfully" });
});

////////////////////// Run every day at midnight to delete unused tokens
cron.schedule(
  "0 0 * * *",
  asyncHandler(async () => {
    const cleanupExpiredTokens = asyncHandler(async () => {
      const now = new Date();
      await Token.deleteMany({
        $or: [{ expiredAt: { $lt: now } }, { isValid: false }],
      });
    });
  })
);

/////// PUT EMAIL

// export const updateEmail = async (req, res, next) => {
//     // prepare user
//     const {email} = req.body;
//     const member = await Member.findOne({email})
//     // check existance
// if (!member) {
//     return next(new AppError(messages.Member.invalidCredentials),401)
// }
// const createdMember = await Member.findByIdAndUpdate(member._id, {email}, {new: true})

// }

// export const getProfile = asyncHandler(async (req, res) => {
//     const member = await Member.findById(req.member._id).select('-password');
//     res.json(member);
// });

// export const updateProfile = asyncHandler(async (req, res) => {
//     const { firstName, lastName, phone } = req.body;

//     const member = await Member.findByIdAndUpdate(
//         req.member._id,
//         { firstName, lastName, phone },
//         { new: true }
//     ).select('-password');

//     res.json(member);
// });
