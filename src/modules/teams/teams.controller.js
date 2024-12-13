import { Team } from "../../../db/models/teams.model.js";
import { asyncHandler } from "../../utils/common/asyncHandler.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import { AppError } from "../../utils/common/appError.js";
import fs from 'fs';

// initialize Cloudinary connection
const cloudinary = cloudinaryConnection();

export const addTeam = asyncHandler(async (req, res, next) => {
    const { title, description, head, vice } = req.body;
    const _id = req.member._id;

    // Validate required fields
    if (!title || !description) {
        return next(new AppError("Title and description are required.", 400));
    }

    if (!req.files || req.files.length === 0) {
        return next(new AppError("No files uploaded.", 400));
    }

    const folderPath = `Apex/Teams`;
    const uploadedImages = [];

    // Upload files to Cloudinary with improved error handling and timeout
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

    // Create a new Team document
    const newTeam = new Team({
        title,
        description,
        createdBy: _id,
        images: uploadedImages,
        head: head || null,
        vice: vice || null,
        totalMembers: 0
    });

    try {
        const savedTeam = await newTeam.save();

        return res.status(201).json({
            success: true,
            message: "Team created successfully.",
            data: savedTeam,
        });
    } catch (error) {
        // If team save fails, delete previously uploaded Cloudinary images
        if (uploadedImages.length > 0) {
            await Promise.all(
                uploadedImages.map(img => 
                    cloudinary.uploader.destroy(img.public_id)
                )
            );
        }

        if (error.code === 11000) {
            return next(new AppError("Duplicate team ID detected. Please try again.", 400));
        }
        console.error("Database error:", error);
        return next(new AppError("Failed to save the team to the database.", 500));
    }
});

export const deleteTeam = asyncHandler(async (req, res, next) => {
    const { teamId } = req.params;
    // const deletedBy = req.member._id;

    // Validate team ID
    if (!teamId) {
        return next(new AppError("Team ID is required", 400));
    }

    try {
        // Find the team first to check existence and get images
        const team = await Team.findById(teamId);

        if (!team) {
            return next(new AppError("Team not found", 404));
        }

        // Delete images from Cloudinary
        if (team.images && team.images.length > 0) {
            const deletePromises = team.images.map(async (image) => {
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

        // Delete the team from database
        const deletedTeam = await Team.findByIdAndDelete(teamId);

        if (!deletedTeam) {
            return next(new AppError("Failed to delete team", 500));
        }

        // Respond with success message
        return res.status(200).json({
            success: true,
            message: "Team deleted successfully",
            data: {
                deletedTeamId: teamId
            }
        });

    } catch (error) {
        console.error("Team deletion error:", error);
        return next(new AppError("Internal server error during team deletion", 500));
    }
});

export const updateTeam = asyncHandler(async (req, res, next) => {
    const { teamId } = req.params;
    const { title, description ,head, vice} = req.body;
    const updatedBy = req.member._id;

    // Validate team ID
    if (!teamId) {
        return next(new AppError("Team ID is required.", 400));
    }

    // Fetch the team to be updated
    const team = await Team.findById(teamId);
    if (!team) {
        return next(new AppError("Team not found.", 404));
    }


    const folderPath = `Apex/Teams`;
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
    if (uploadedImages.length > 0 && team.images && team.images.length > 0) {
        try {
            await Promise.all(
                team.images.map(image =>
                    cloudinary.uploader.destroy(image.public_id)
                )
            );
        } catch (deleteError) {
            console.warn("Failed to delete old images:", deleteError);
        }
    }

    // Update team details
    team.title = title || team.title;
    team.description = description || team.description;
    team.images = uploadedImages.length > 0 ? uploadedImages : team.images;
    team.updatedAt = Date.now();
    team.head = head || team.head;
    team.vice = vice || team.vice;


    try {
        const updatedTeam = await team.save();

        return res.status(200).json({
            success: true,
            message: "Team updated successfully.",
            data: updatedTeam,
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

        return next(new AppError("Failed to update the team in the database.", 500));
    }
});


export const getAllTeams = asyncHandler(async (req, res, next) => {
    try {
        // Retrieve all teams from the database
        const teams = await Team.find();

        return res.status(200).json({
            success: true,
            message: "Teams fetched successfully.",
            data: teams,
        });
    } catch (error) {
        console.error("Error fetching teams:", error);
        return next(new AppError("Failed to retrieve teams.", 500));
    }
});

export const getTeamById = asyncHandler(async (req, res, next) => {
    const { teamId } = req.params;

    // Validate team ID format
    if (!teamId) {
        return next(new AppError("Team ID is required.", 400));
    }

    try {
        // Fetch the team by ID
        const team = await Team.findById(teamId);
        
        if (!team) {
            return next(new AppError("Team not found.", 404));
        }

        return res.status(200).json({
            success: true,
            message: "Team fetched successfully.",
            data: team,
        });
    } catch (error) {
        console.error("Error fetching team:", error);
        return next(new AppError("Failed to retrieve the team.", 500));
    }
});
