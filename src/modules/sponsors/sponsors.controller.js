import { Sponsors } from '../../../db/models/sponsors.model.js';
import { asyncHandler } from '../../utils/common/asyncHandler.js';
import cloudinaryConnection from "../../utils/cloudinary.js";
import { AppError } from '../../utils/common/appError.js';

// initialize Cloudinary connection
const cloudinary = cloudinaryConnection();

// Create a new sponsor
export const createSponsor = asyncHandler(async (req, res, next) => {

  // 1.Extract sponsor data from request body
  const { name, description } = req.body;
  const _id = req.member._id;

  // 2. Validate the required data
  if (!req.file) {
    return next(new AppError("No file uploaded."));
  }
  if (!name || !description) {
    return next(new AppError("name and description are required."));
  }
  // 3. Upload the file to Cloudinary in the appropriate folder
  const folderPath = `Apex/Sponsors`;

    // Variables for Cloudinary results
    let public_id, secure_url;
  
    try {
 
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath,
        use_filename: false,
        unique_filename: true,
        timestamp: Date.now()
      });
      public_id = result.public_id;
      secure_url = result.secure_url;


    } catch (error) {
      console.error('Full Cloudinary Error:', {
        message: error.message,
        name: error.name,
        http_code: error.http_code,
        stack: error.stack
      });
    }
    
    // 3. Create a new sponsor   
    const sponsor = await Sponsors.create({
      name,
      description,
      image: {
        public_id,
        secure_url
      },
      createdBy: _id
    })  
    if (!sponsor) {
      return next(new AppError("Failed to create sponsor."));
    }
    // return response
    res.status(201).json({
      message: "Sponsor created successfully",
      sponsor
    });
})

// Update a sponsor
export const updateSponsor = asyncHandler(async (req, res, next) => {
  
  const { id } = req.params;
  const { name, description } = req.body;


  // Find existing sponsor
  const existingSponsor = await Sponsors.findById(id);
  if (!existingSponsor) {
    return next(new AppError("Sponsor not found.", 404));
  }
  if (req.files) {
    return res.status(400).json({
      success: false,
      message: "Multiple files are not allowed."
    });
  }

  // Handle image update
  let updateData = { name, description };
  let oldPublicId = existingSponsor.image.public_id;



  if (req.file) {
    const folderPath = `Apex/Sponsors`;
    try {
      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath,
        use_filename: false,
        unique_filename: true,
        timestamp: Date.now()
      });

      // Update image details
    console.log (result.public_id,result.secure_url); 
     updateData.image = {
        public_id: result.public_id,
        secure_url: result.secure_url
      };

      // Delete old image from Cloudinary
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      return next(new AppError("Failed to upload new image.", 500));
    }
  }

  // Update sponsor
  try {
    const updatedSponsor = await Sponsors.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Sponsor updated successfully",
      data: updatedSponsor
    });
  } catch (error) {
    return next(new AppError("Failed to update sponsor.", 500));
  }
});

// Delete a sponsor
export const deleteSponsor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find and delete sponsor
  const sponsor = await Sponsors.findByIdAndDelete(id);

  if (!sponsor) {
    return next(new AppError("Sponsor not found.", 404));
  }

  // Delete image from Cloudinary
  try {
    if (sponsor.image && sponsor.image.public_id) {
      await cloudinary.uploader.destroy(sponsor.image.public_id);
    }
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
  }

  res.status(200).json({
    success: true,
    message: "Sponsor deleted successfully"
  });
});


// Get all sponsors 
export const getAllSponsors = asyncHandler(async (req, res, next) => {

      const sponsors = await Sponsors.find();

      if (!sponsors) {
        return res.status(404).json({ 
          message: 'Sponsors not found' 
        });
      }
      res.status(200).json({
        message: 'Sponsors retrieved successfully',
        sponsors
      });
    } );
  
  // Get a single sponsor by ID 
export const getSponsorById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
  
    const sponsor = await Sponsors.findById(id);
      
      if (!sponsor) {
        return res.status(404).json({ 
          message: 'Sponsor not found' 
        });
      }
  
      res.status(200).json({
        message: 'Sponsor retrieved successfully',
        sponsor
      });
    });