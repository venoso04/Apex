
import { allowedMembers } from "../../../db/models/allowedMembers.model.js";
import { Member } from "../../../db/models/members.model.js";
import { SubTeam } from "../../../db/models/subteams.model.js";
import { Team } from "../../../db/models/teams.model.js";
import { Video } from "../../../db/models/videos.model.js";
import { asyncHandler } from "../../utils/common/asyncHandler.js";


//////////////// add an allowed member
export const addAllowedMember = asyncHandler(async (req, res, next) => {
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

// assign a member to a team
export const setMemberTeam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { teamId } = req.body;

    try {
        const member = await Member.findById(id);
        if (!member) throw new Error('Member not found');

        const team = await Team.findById(teamId);
        if (!team) throw new Error('Team not found');

        member.teamId = teamId;
        await member.save();

        team.totalMembers += 1;
        await team.save();
      res.status(201).json({ message: 'Member added to team successfully', member });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

// Assign a member to a subteam
export const setMemberSubteam = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { subTeamId } = req.body;

  try {
      const member = await Member.findById(id);
      if (!member) throw new Error('Member not found');

      const subTeam = await SubTeam.findById(subTeamId);
      if (!subTeam) throw new Error('SubTeam not found');

      if (!member.teamId) {
        throw new Error('Member does not have a team');
    }
    if (subTeam.teamId.toString() !== member.teamId.toString()) {
      throw new Error('SubTeam does not belong to the provided team');
  }
      member.subTeamId = subTeamId;
      await member.save();

      subTeam.totalMembers += 1;
      await subTeam.save();

      res.status(201).json({ message: 'Member added to subteam successfully', member });
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
})

// Get all members
export const getAllmembers = asyncHandler( async (req, res) => {
  try {
      const members = await Member.find(req.query).populate('firstName lastName  role  teamId subTeamId');
      res.json(members);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
});

///////////////// Delete member by id
export const deleteMemberById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find the member by ID
  const member = await Member.findById(id);

  if (!member) {
    return res.status(404).json({ message: 'Member not found' });
  }

  // Check if the member is already deleted
  if (member.isDeleted) {
    return res.status(400).json({ message: 'Member is already deleted' });
  }

  // Soft Delete the member (set isDeleted to true)
  member.isDeleted = true;
  await member.save();

  // Respond with a success message
  res.status(200).json({ message: 'Member deleted successfully' });
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

