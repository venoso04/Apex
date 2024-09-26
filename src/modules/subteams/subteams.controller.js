
import { Member } from '../../../db/models/members.model.js';
import { SubTeam } from '../../../db/models/subteams.model.js';
import { asyncHandler } from '../../utils/common/asyncHandler.js';

// // Function to count members per subteam
// async function getMemberCountsBySubteam() {
//      const counts = await Member.aggregate([
//        {
//          $match: { isDeleted: false }  // Only count active (non-deleted) members
//        },
//        {
//          $group: {
//            _id: "$subTeamId",  // Group by subTeamId (referencing Subteam)
//            memberCount: { $sum: 1 }  // Count the number of members in each group
//          }
//        },
//        {
//          $lookup: {
//            from: "subteams",  // Collection name for Subteam
//            localField: "_id", // _id is the subTeamId from Member schema
//            foreignField: "_id",  // Foreign field is the _id in the Subteam schema
//            as: "subteamInfo"  // Name of the joined field
//          }
//        },
//        {
//          $unwind: "$subteamInfo"  // Unwind subteamInfo array to an object
//        },
//        {
//          $project: {
//            _id: 0,
//            subteamName: "$subteamInfo.title",  // Get the subteam title from the joined data
//            memberCount: 1  // Include the member count
//          }
//        }
//      ]);
   
//      return counts;
//    }

//    // Get all subteams
// export const getAllSubteams = asyncHandler(async (req, res) => {

//        const subteams = await SubTeam.find();
//        // Optionally, if you want to include the member count for each subteam:
//        const subteamCounts = await SubTeam.getMemberCount();
       
//        const subteamsWithCounts = subteams.map(subteam => {
//          const countData = subteamCounts.find(count => count.subteamName === subteam.title);
//          return {
//            ...subteam.toObject(),
//            memberCount: countData ? countData.memberCount : 0
//          };
//        });
   
//        res.status(200).json(subteamsWithCounts);
//      });

// Get all subteams without member count


export const getAllSubteams = asyncHandler(async (req, res) => {
     try {
         // Fetch all subteams
         const subteams = await SubTeam.find();
 
         // Respond with the subteams data
         res.status(200).json(subteams);
     } catch (error) {
         res.status(500).json({ error: 'Server error' });
     }
 });
   // Get a subteam by ID
export const getSubteamById = asyncHandler(async (req, res) => {
     const { id } = req.params;
     

       const subteam = await SubTeam.findById(id);
       
       if (!subteam) {
         return res.status(404).json({ error: "Subteam not found." });
       }
   
       // Optionally, if you want to include the member count for this subteam:
       const memberCount = await Member.countDocuments({ subTeamId: subteam._id, isDeleted: false });
   
       res.status(200).json({
         ...subteam.toObject(),
         memberCount
       });
     })
   ;
