import { allowedMembers } from "../../../db/models/allowedMembers.model.js";
import { Member } from "../../../db/models/members.model.js";
import { SubTeam } from "../../../db/models/subteams.model.js";
import { Video } from "../../../db/models/videos.model.js";
import { asyncHandler } from "../../utils/common/asyncHandler.js";
import mongoose from "mongoose";

//////////////// add an allowed member
export const addAllowedMember = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

    const allowedMemberExists = await allowedMembers.findOne({ email });
    if (allowedMemberExists) {
      return res.status(400).json({ message: 'Member already exists' });
    }

    const newallowedMember = new allowedMembers({ email });
    await newallowedMember.save();
    res.status(201).json({ message: 'allowedMember added successfully', newallowedMember });
  }
);


////////////////adding a new subteam
export const addSubteam =asyncHandler( async (req, res) => {


  const existingSubteam = await SubTeam.findOne({ title: req.body.title });
  if (existingSubteam) {
    return res.status(400).json({ error: 'A subteam with this title already exists.' });
  }

  if (req.body.leader) {
    const leaderExists = await Member.exists({ _id: req.body.leader });
    if (!leaderExists) {
      return res.status(400).json({ error: 'The specified leader does not exist.' });
    }
  }

    // Create a new subteam
    const newSubteam = new SubTeam(req.body);

    // Save the subteam to the database
    await newSubteam.save();

    res.status(201).json({
      message: 'Subteam added successfully.',
      subteam: newSubteam
    });
  })


//////////////// Delete a subteam by ID
export const deleteSubteamById = asyncHandler(async (req, res) => {
  const { id } = req.params;


    const subteam = await SubTeam.findById(id);

    if (!subteam) {
      return res.status(404).json({ error: "Subteam not found." });
    }


    await Member.updateMany({ subTeamId: id }, { subTeamId: null });

    // Delete the subteam
    await subteam.deleteOne();

    res.status(200).json({ message: "Subteam deleted successfully." });
  } 
);


// Set or update a member's subteam
export const setMemberSubteam = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const { subTeamId } = req.body;

  // // Validate memberId is a valid ObjectId
  // if (!mongoose.isValidObjectId(memberId)) {
  //   return res.status(400).json({ error: "Invalid member ID." });
  // }

  // Find the member by ID
  const member = await Member.findById(memberId);
  if (!member) {
    return res.status(404).json({ error: "Member not found." });
  }

  // Check if the subteam exists
  if (!isValidObjectId(subTeamId)) {
    return res.status(400).json({ error: "Invalid subteam ID." });
  }

  const subteam = await SubTeam.findByIdAndUpdate(
    subTeamId,  // Find subteam by subTeamId directly (not as an object)
    { $inc: { totalMembers: 1 } },  // Increment the total members of the subteam
    { new: true, useFindAndModify: false }  // Return the updated document
  );

  if (!subteam) {
    return res.status(404).json({ error: "Subteam not found." });
  }

  // Update the member's subTeamId
  member.subTeamId = subTeamId;
  await member.save();

  res.status(200).json({ message: "Member's subteam updated successfully.", member });
});
  

///////////////// Delete member by id
export const deleteMemberById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { sendEmail } = req.query; // Get the optional sendEmail query parameter

  // Find the member by ID
  const member = await Member.findById(id);
  
  if (!member) {
      return res.status(404).json({ message: 'Member not found' });
  }

  // Check if the 'sendEmail' flag is true
  if (sendEmail === 'true') {
      // Email content for "firing"
      const emailMessage = `
          <p>Dear ${member.firstName},</p>
          <p>We regret to inform you that your membership with our organization has been terminated effective immediately.</p>
          <p>For any inquiries or clarifications, please do not hesitate to contact us.</p>
          <p>Best regards,<br>Team</p>
      `;

      // Send the firing email
      const emailSent = await sendEmail({
        to: member.email,
        subject: "Membership Termination",
        message: emailMessage
      });

      // Check if email was sent successfully
      if (!emailSent) {
        return next(new AppError('Firing email could not be sent', 500));
      }
    }

  // Soft Delete the member after checking email status (or if sendEmail was false)
  await Member.findByIdAndUpdate(isDeleted);

  // Respond with a success message
  res.status(200).json({ message: `Member deleted successfully ${sendEmail === 'true' ? ' and firing email sent' : ''}` });
});


/////////////////////// add video
export const addVideo = async (req, res, next) => {
  const { title, description, url, subteamId, vidType } = req.body;

    // Check if the subteamId exists
    const subteam = await SubTeam.findById(subteamId);
    if (!subteam) {
      return res.status(400).json({ message: 'Invalid subteam ID' });
    }

    // Create and save the new video
    const newVideo = new Video({ title, description, url, subteamId, vidType });
    await newVideo.save();
    
    res.status(201).json({ message: 'Video added successfully', video: newVideo });

};



/////////////delete video by id
export const deleteVideoById = async (req, res, next) => {

      const { id } = req.params;
      const result = await Video.findByIdAndDelete(id);
      if (!result) {
          return res.status(404).json({ message: 'Video not found' });
      }
      res.status(200).json({ message: 'Video deleted successfully' });
  }


////// add admin or super
export const addMemberRole = async (req, res, next) => {
  const { memberId, role } = req.body;

  // Validate role
  if (!['admin', 'super'].includes(role)) {
    return res.status(400).json({ error: "Role must be either 'admin' or 'super'." });
  }

  const member = await Member.findById(memberId);
  if (!member) {
    return res.status(404).json({ error: "Member not found." });
  }

  member.role = role;
  await member.save();

  res.status(200).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} added successfully.` });
};

/////////////// remove user role
export const removeMemberRole = async (req, res, next) => {
  const { memberId } = req.body;

  // Find the member by ID
  const member = await Member.findById(memberId);
  if (!member) {
    return res.status(404).json({ error: "Member not found." });
  }

  // Check if the member has the role of 'admin' or 'super'
  if (!['admin', 'super'].includes(member.role)) {
    return res.status(400).json({ error: "Member does not have an 'admin' or 'super' role." });
  }

  // Remove the role by setting it to a default value like 'user'
  member.role = 'user'; // or set it to null if there's no default role
  await member.save();

  res.status(200).json({ message: "Admin or Super role removed successfully." });
};


// Set or update a member as the subteam leader
export const setSubteamLeader = asyncHandler(async (req, res) => {
  const { memberId, subTeamId } = req.body;

  // Validate memberId and subTeamId are valid ObjectIds
  if (!mongoose.isValidObjectId(memberId)) {
    return res.status(400).json({ error: "Invalid member ID." });
  }
  if (!mongoose.isValidObjectId(subTeamId)) {
    return res.status(400).json({ error: "Invalid subteam ID." });
  }


  // Find the member by ID
  const member = await Member.findById(memberId);
  if (!member) {
    return res.status(404).json({ error: "Member not found." });
  }

  // Find the subteam by ID
  const subteam = await SubTeam.findById(subTeamId);
  if (!subteam) {
    return res.status(404).json({ error: "Subteam not found." });
  }

  // Set the member as the leader of the subteam
  subteam.leader = memberId;
  await subteam.save();

  res.status(200).json({ message: "Member set as subteam leader successfully.", subteam });
});