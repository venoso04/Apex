import { SubTeam } from "../../../db/models/subteams.model.js";
import { asyncHandler } from "../../utils/common/asyncHandler.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import { AppError } from "../../utils/common/appError.js";
import fs from 'fs';
import { Team } from "../../../db/models/teams.model.js";
import { Member } from "../../../db/models/members.model.js";

// Initialize Cloudinary connection
const cloudinary = cloudinaryConnection();


export const addSubTeam = asyncHandler(async (req, res, next) => {
    const { title, description,head, vice} = req.body;
    const {teamId} = req.params;
    const _id = req.member._id;

    // Validate required fields
    if (!title) {
        return next(new AppError("Title is required.", 400));
    }

    if (!teamId) {
        return next(new AppError("Team ID is required.", 400));
    }
    const existingSubTeam = await SubTeam.findOne({ title });
    if (existingSubTeam) {
        return next(new AppError("Subteam with this title already exists.", 400));
    }
    // Validate team ID
    const team = await Team.findById(teamId);
    if (!team) {
        return next(new AppError("Team not found.", 404));
    }

if (!req.files || req.files.length === 0) {
        return next(new AppError("No files uploaded.", 400));
    }

    const folderPath = `Apex/SubTeams`;
    const uploadedImages = [];

    // Upload files to Cloudinary with improved error handling and timeout
try {
        const uploadPromises = req.files.map(async (file) => {
            return new Promise((resolve, reject) => {
                const uploadTimeout = setTimeout(() => {
                    reject(new Error('Cloudinary upload timed out'));
                }, 30000); // 30 seconds timeout

                cloudinary.uploader.upload(
                    file.path,
                    {
                        folder: folderPath,
                        use_filename: false,
                        unique_filename: true,
                        timestamp: Date.now(),
                    },
                    (error, result) => {
                        clearTimeout(uploadTimeout);

                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                public_id: result.public_id,
                                secure_url: result.secure_url,
                            });
                        }

                        // Clean up local file after upload
                        fs.unlink(file.path, (unlinkError) => {
                            if (unlinkError) {
                                console.warn('Failed to delete local file:', unlinkError);
                            }
                        });
                    }
                );
            });
        });

        // Wait for all uploads to complete
        uploadedImages.push(...await Promise.all(uploadPromises));
    } catch (error) {
        console.error("Cloudinary upload error:", error);

        // Clean up any uploaded images in case of partial upload
        if (uploadedImages.length > 0) {
            await Promise.all(
                uploadedImages.map(img =>
                    cloudinary.uploader.destroy(img.public_id)
                )
            );
        }

        return next(new AppError(`Failed to upload images: ${error.message}`, 500));
    }

    // Create a new SubTeam document
    const newSubTeam = new SubTeam({
        title,
        description,
        createdBy: _id,
        images: uploadedImages,
        teamId,
        head: head || null,
        vice: vice || null,


    });

    try {
        // Save the new SubTeam
        const savedSubTeam = await newSubTeam.save();



        return res.status(201).json({
            success: true,
            message: "Sub Team created ",
            data: savedSubTeam,
        });
    } catch (error) {
        // If subteam save fails, delete previously uploaded Cloudinary images
        if (uploadedImages.length > 0) {
            await Promise.all(
                uploadedImages.map(img =>
                    cloudinary.uploader.destroy(img.public_id)
                )
            );
        }

        if (error.code === 11000) {
            return next(new AppError("Duplicate sub team ID detected. Please try again.", 400));
        }
        console.error("Detailed Database Error:", {
          errorMessage: error.message,
          errorCode: error.code,
          errorStack: error.stack
      });
  
    }
});

export const updateSubTeam = asyncHandler(async (req, res, next) => {
  const { subTeamId } = req.params;
  const { title,
     description,
      // head,
      // vice
       } = req.body;


  // Validate subteam ID
  if (!subTeamId) {
      return next(new AppError("Sub Team ID is required.", 400));
  }

  // Fetch the subteam to be updated
  const subTeam = await SubTeam.findById(subTeamId);
  if (!subTeam) {
      return next(new AppError("Sub Team not found.", 404));
  }
    // Check if a subteam with the same title exists (excluding the current subteam)
    if (title) {
        const existingSubTeam = await SubTeam.findOne({ title, _id: { $ne: subTeamId } });
        if (existingSubTeam) {
            return next(new AppError("A subteam with this title already exists.", 400));
        }
    }
  const folderPath = `Apex/SubTeams`;
  const uploadedImages = [];

  // Handle file uploads if provided
  if (req.files && req.files.length > 0) {
      try {
          // Set a timeout for Cloudinary uploads
          const uploadPromises = req.files.map(async (file) => {
              return new Promise((resolve, reject) => {
                  const uploadTimeout = setTimeout(() => {
                      reject(new Error('Cloudinary upload timed out'));
                  }, 30000); // 30 seconds timeout

                  cloudinary.uploader.upload(
                      file.path,
                      {
                          folder: folderPath,
                          use_filename: false,
                          unique_filename: true,
                          timestamp: Date.now(),
                      },
                      (error, result) => {
                          clearTimeout(uploadTimeout);

                          if (error) {
                              reject(error);
                          } else {
                              resolve({
                                  public_id: result.public_id,
                                  secure_url: result.secure_url,
                              });
                          }

                          // Clean up local file after upload
                          fs.unlink(file.path, (unlinkError) => {
                              if (unlinkError) {
                                  console.warn('Failed to delete local file:', unlinkError);
                              }
                          });
                      }
                  );
              });
          });

          // Wait for all uploads to complete
          uploadedImages.push(...await Promise.all(uploadPromises));
      } catch (error) {
          console.error("Cloudinary upload error:", error);

          // Clean up any uploaded images in case of partial upload
          if (uploadedImages.length > 0) {
              await Promise.all(
                  uploadedImages.map(img =>
                      cloudinary.uploader.destroy(img.public_id)
                  )
              );
          }

          return next(new AppError(`Failed to upload images: ${error.message}`, 500));
      }
  }

  // Delete old images if new ones are provided
  if (uploadedImages.length > 0 && subTeam.images && subTeam.images.length > 0) {
      try {
          await Promise.all(
              subTeam.images.map(image =>
                  cloudinary.uploader.destroy(image.public_id)
              )
          );
      } catch (deleteError) {
          console.warn("Failed to delete old images:", deleteError);
      }
  }

  // Update subteam details
  subTeam.title = title || subTeam.title;
  subTeam.description = description || subTeam.description;
  // subTeam.head = head || subTeam.head;
  // subTeam.vice = vice || subTeam.vice;
  subTeam.images = uploadedImages.length > 0 ? uploadedImages : subTeam.images;
  subTeam.updatedAt = Date.now(); // Automatically set updatedAt to current date and time

  try {
      const updatedSubTeam = await subTeam.save();

      return res.status(200).json({
          success: true,
          message: "Sub Team updated successfully.",
          data: updatedSubTeam,
      });
  } catch (error) {
      console.error("Database error during update:", error);

      // Clean up newly uploaded images if save fails
      if (uploadedImages.length > 0) {
          await Promise.all(
              uploadedImages.map(img =>
                  cloudinary.uploader.destroy(img.public_id)
              )
          );
      }

      return next(new AppError("Failed to update the subteam in the database.", 500));
  }
});

export const deleteSubTeam = asyncHandler(async (req, res, next) => {
  const { subTeamId } = req.params;

  // Validate subteam ID
  if (!subTeamId) {
      return next(new AppError("Sub Team ID is required.", 400));
  }

  // Find the subteam first to check existence and get images
  const subTeam = await SubTeam.findById(subTeamId);

  if (!subTeam) {
      return next(new AppError("Sub Team not found.", 404));
  }

  // Delete images from Cloudinary
  if (subTeam.images && subTeam.images.length > 0) {
      const deletePromises = subTeam.images.map(async (image) => {
          try {
              // Destroy image in Cloudinary
              await cloudinary.uploader.destroy(image.public_id);
          } catch (cloudinaryError) {
              console.warn(`Failed to delete image ${image.public_id}:`, cloudinaryError);
          }
      });

      // Wait for all image deletion attempts
      await Promise.all(deletePromises);
  }

  // Delete the subteam from database
  const deletedSubTeam = await SubTeam.findByIdAndDelete(subTeamId);

  if (!deletedSubTeam) {
      return next(new AppError("Failed to delete subteam.", 500));
  }

  // Respond with success message
  return res.status(200).json({
      success: true,
      message: "Sub Team deleted successfully.",
      data: {
          deletedSubTeamId: subTeamId
      }
  });
});

export const getAllSubTeams = asyncHandler(async (req, res, next) => {
  try {
      const subTeams = await SubTeam.find().populate('teamId', 'title').populate('createdBy', 'name');
          // Check if no subteams exist
    if (subTeams.length === 0) {
      return res.status(404).json({
          success: false,
          message: "No subteams found.",
      });
  }

      return res.status(200).json({
          success: true,
          message: "All subteams retrieved successfully.",
          data: subTeams,
      });
  } catch (error) {
      console.error("Error fetching subteams:", error);
      return next(new AppError("Failed to retrieve subteams.", 500));
  }
});

export const getSubTeamById = asyncHandler(async (req, res, next) => {
  const { subTeamId } = req.params;

  // Validate subTeamId
  if (!subTeamId) {
      return next(new AppError("Subteam ID is required.", 400));
  }
  

  try {
      const subTeam = await SubTeam.findById(subTeamId)
          .populate('teamId', 'title')
          .populate('createdBy', 'name');

      if (!subTeam) {
          return next(new AppError("Subteam not found.", 404));
      }

      return res.status(200).json({
          success: true,
          message: "Subteam retrieved successfully.",
          data: subTeam,
      });
  } catch (error) {
      console.error("Error fetching subteam by ID:", error);
      return next(new AppError("Failed to retrieve the subteam.", 500));
  }
});


// Get members by team and subteam
export const getAllmembersProfilePic = asyncHandler(async (req, res) => {
  const { teamId, subTeamId } = req.params;


    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if the subteam exists and if it belongs to the team
    const subTeam = await SubTeam.findById(subTeamId);
    if (!subTeam) {
      return res.status(404).json({ error: 'Subteam not found' });
    }

    if (subTeam.teamId.toString() !== teamId) {
      return res.status(400).json({ error: 'The subteam does not belong to the specified team' });
    }

      const members = await Member.find({ teamId, subTeamId }, 'firstName lastName role profilePicture.secure_url');
      res.status(201).json({ message: 'All members retrieved successfully', members });

});