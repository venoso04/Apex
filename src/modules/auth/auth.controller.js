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
import cloudinaryConnection from "../../utils/cloudinary.js";

const cloudinary = cloudinaryConnection();

////////////////// sign up
export const signUp = asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;

  // 1. Check if the user is authorized to sign up
  const allowedMember = await allowedMembers.findOne({ email });
  if (!allowedMember) {
    return res
      .status(403)
      .json({ message: "You are not authorized to sign up." });
  }

  // 2. Check for phone or email conflicts
  const phoneExist = await Member.findOne({ phone });
  if (phoneExist) {
    return res.status(400).json({ message: "Phone already in use" });
  }

  const emailExist = await Member.findOne({ email });
  if (emailExist) {
    return res.status(400).json({ message: "Member already exists" });
  }

  // 3. Define the member role
  const role = allowedMember.role || systemRoles.MEMBER;

  // 4. Initialize profilePicture object
  let profilePicture = { secure_url: null, public_id: null };

  // 5. Handle profile picture upload
  try {
    if (req.file) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: "members/profile_pictures",
        use_filename: true,
        unique_filename: false,
      });
      profilePicture = { secure_url, public_id };
    }
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return next(new AppError("Failed to upload profile picture.", 500));
  }

  // 6. Create the member instance
  const member = new Member({
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    profilePicture,
  });

  // 7. Save the member to the database with rollback handling
  try {
    await member.save();
  } catch (error) {
    console.error("Couldn't Save The User To Database", error);

    // Rollback: Delete uploaded profile picture from Cloudinary if it exists
    if (profilePicture.public_id) {
      try {
        await cloudinary.uploader.destroy(profilePicture.public_id);
      } catch (rollbackError) {
        console.error("Failed to rollback Cloudinary upload:", rollbackError);
      }
    }

    return next(new AppError("Failed to register member.", 500));
  }

  // 8. Send verification email
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
    // Rollback: Delete uploaded profile picture from Cloudinary and the member record from the database
    try {
      if (profilePicture.public_id) {
        await cloudinary.uploader.destroy(profilePicture.public_id);
      }
      await Member.findByIdAndDelete(member._id);
    } catch (rollbackError) {
      console.error("Failed to rollback after email send failure:", rollbackError);
    }

    return next(new AppError("Email could not be sent", 500));
  }

  // 9. Respond with success
  res.status(201).json({
    message: "Member registered successfully, waiting on email confirmation",
    member,
  });
});


/////////////////////  Update Profile Picture 

export const updateProfilePicture = asyncHandler(async (req, res, next) => {
  // 1. Validate the request
  if (!req.file) {
    return next(new AppError("No profile picture provided.", 400));
  }

  const { id } = req.params;
  const loggedInUser = req.member
  
  // 2. Find the member by ID
  const member = await Member.findById(id);
  
  if (!member) {
    return next(new AppError("Member not found.", 404)); 
  }
  

  if (  member._id.toString() !== loggedInUser._id.toString() && loggedInUser.role !== systemRoles.ADMIN && loggedInUser.role !== systemRoles.SUPER) {
    return next(new AppError("You're Not Authorized To Take This Action", 404)); 
  }


  let newProfilePicture;

  // 3. Upload the new profile picture to Cloudinary
  try { 
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: "members/profile_pictures",
      use_filename: true,
      unique_filename: false,
    });

    newProfilePicture = { secure_url, public_id };
  } catch (uploadError) {
    console.error("Error during Cloudinary upload:", uploadError);
    return next(new AppError("Failed to upload profile picture. Please try again.", 500));
  }

  // 4. Save the new profile picture to the database
  try {
    // Delete the old profile picture from Cloudinary if it exists
    if (member.profilePicture?.public_id) {
      try {
        await cloudinary.uploader.destroy(member.profilePicture.public_id);
      } catch (deleteError) {
        console.error("Failed to delete old profile picture from Cloudinary:", deleteError);
      }
    }

    // Update the member's profilePicture field
    member.profilePicture = newProfilePicture;
    await member.save();
  } catch (dbError) {
    console.error("Error during database update:", dbError);

    // Rollback: Delete the newly uploaded profile picture
    if (newProfilePicture?.public_id) {
      try {
        await cloudinary.uploader.destroy(newProfilePicture.public_id);
      } catch (rollbackError) {
        console.error("Failed to rollback uploaded profile picture:", rollbackError);
      }
    }

    return next(new AppError("Failed to update the database. Please try again.", 500));
  }

  // 5. Respond with success
  res.status(200).json({
    message: "Profile picture updated successfully.",
    data: {
      id: member._id,
      profilePicture: member.profilePicture,
    },
  });
});

// Delete Profile Picture API

export const deleteProfilePicture = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const loggedInUser = req.member

  // Ensure the ID is provided
  if (!id) {
    return next(new AppError('User ID is required!', 400));
  }

  // Find the user in the database
  const member = await Member.findById(id);
  if (!member) {
    return next(new AppError('User not found!', 404));
  }

  // Check authorization: only the user or an admin can perform this action
  if (  member._id.toString() !== loggedInUser._id.toString() && loggedInUser.role !== systemRoles.ADMIN && loggedInUser.role !== systemRoles.SUPER) {
    return next(new AppError("You're Not Authorized To Take This Action", 404)); 
  }

  // Check if the user has a profile picture to delete
  if (!member.profilePicture.public_id) {
    return next(new AppError('No profile picture to delete!', 400));
  }

  const { public_id: oldPublicId } = member.profilePicture;


  // Step 1: Update the database first
  try {
    member.profilePicture = { secure_url: null, public_id: null };
    await member.save();
  } catch (error) {
    console.error('Error updating user in database:', error);
    return next(
      new AppError(
        'Failed to update the user in the database. Profile picture deletion aborted.',
        500
      )
    );
  }

  // Step 2: Delete the profile picture from Cloudinary
  try {
    await cloudinary.uploader.destroy(oldPublicId);
  } catch (error) {
    console.error('Error deleting profile picture from Cloudinary:', error);

    // Rollback the database update if Cloudinary deletion fails
    try {
      member.profilePicture = { secure_url: `https://res.cloudinary.com/dpzrf2mca/image/upload/v1733578988/members/profile_pictures/${oldPublicId}`, public_id: oldPublicId };
      await member.save();
    } catch (rollbackError) {
      console.error('Error rolling back database update:', rollbackError);
      return next(
        new AppError(
          'Failed to delete the profile picture from Cloudinary, and rollback failed. Manual intervention required.',
          500
        )
      );
    }

    return next(
      new AppError(
        'Failed to delete the profile picture from Cloudinary. Rollback successful.',
        500
      )
    );
  }

  // Respond with success
  return res.status(200).json({
    message: 'Profile picture deleted successfully.',
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
