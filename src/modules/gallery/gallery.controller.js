import cloudinaryConnection from "../../utils/cloudinary.js";
import Gallery from "../../../db/models/gallery.model.js";
import { asyncHandler } from "../../utils/common/asyncHandler.js";
import { AppError } from "../../utils/common/appError.js";

// Initialize Cloudinary connection
const cloudinary = cloudinaryConnection();

// Upload an image to the gallery
export const uploadGalleryImage = asyncHandler(async (req, res, next) => {
  // 1. Extract category from request body
  const {
    category,
    title,
    description,
    team,
    subTeam,
    priority,
    isHighlighted,
    landingPageVisibility,
    gallerySectionVisibility,
  } = req.body;
  const _id = req.member._id;

  // 2. Validate the required data
  if (!req.file) {
    return next(new AppError("No file uploaded."));
  }
  if (!category || !title) {
    return next(new AppError("Category and title are required."));
  }

  // Variables for Cloudinary results
  let public_id, secure_url;

  // 3. Upload the file to Cloudinary in the appropriate folder
  const folderPath = `gallery/${category}`;

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: folderPath,
      use_filename: true,
      unique_filename: false,
    });

    public_id = result.public_id;
    secure_url = result.secure_url;
  } catch (error) {
    console.error("Error uploading the image:", error);
    return next(new AppError("Failed to upload image to Cloudinary."));
  }

  // 4. Save the metadata to MongoDB
  try {
    const newImage = await Gallery.create({
      title,
      description,
      Image: { public_id, secure_url },
      category,
      team: team || null,
      subTeam: subTeam || null,
      priority: priority || 0,
      isHighlighted: isHighlighted || false,
      landingPageVisibility: landingPageVisibility || false,
      gallerySectionVisibility: gallerySectionVisibility || true,
      uploadedBy: _id,
    });

    if (!newImage) {
      return next(new AppError("Failed to add image to database."));
    }

    // 5. Respond with success
    res
      .status(201)
      .json({ message: "Image uploaded successfully.", data: newImage });
  } catch (error) {
    console.error("Error saving image to database:", error);
    // Rollback Cloudinary upload
    await cloudinary.uploader.destroy(public_id);
    return next(new AppError("Failed to save image to database."));
  }
});

// Get gallery items
export const fetchGalleryItems = asyncHandler(async (req, res, next) => {
  try {
    // 1. Extract request query parameters
    const {
      category,
      team,
      subTeam,
      isHighlighted,
      landingPageVisibility,
      gallerySectionVisibility,
      priority,
      page = 1,
      limit = 10,
      priorityThreshold,
    } = req.query;

    // 2. Validate query parameters
    if (priorityThreshold !== undefined && isNaN(Number(priorityThreshold))) {
      return next(
        new AppError("Invalid priority threshold value. It must be a number.")
      );
    }
    if (isNaN(Number(page)) || isNaN(Number(limit))) {
      return next(
        new AppError(
          "Invalid pagination values. Page and limit must be numbers."
        )
      );
    }

    // 3. Build the query object dynamically based on filters
    const queryObject = {};
    if (category) queryObject.category = category;
    if (team) queryObject.team = team;
    if (subTeam) queryObject.subTeam = subTeam;
    if (isHighlighted !== undefined)
      queryObject.isHighlighted = isHighlighted === "true";
    if (landingPageVisibility !== undefined)
      queryObject.landingPageVisibility = landingPageVisibility === "true";
    if (gallerySectionVisibility !== undefined)
      queryObject.gallerySectionVisibility =
        gallerySectionVisibility === "true";
    if (priorityThreshold !== undefined)
      queryObject.priority = { $gte: Number(priorityThreshold)};

    // 4. Implement pagination and sorting
    const skip = (Number(page) - 1) * Number(limit); // Calculate documents to skip
    const sort = priority ? { priority: -1 } : { createdAt: -1 }; // Sort by priority or creation date

    // 5. Query the database
    const [images, totalItems] = await Promise.all([
      Gallery.find(queryObject).sort(sort).skip(skip).limit(Number(limit)),
      Gallery.countDocuments(queryObject),
    ]);
    const totalPages = Math.ceil(totalItems / Number(limit));

    // 6. Respond with the data and pagination info
    res.status(200).json({
      data: images,
      paginationInfo: {
        totalItems,
        currentPage: Number(page),
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    next(new AppError("An error occurred while fetching gallery items.", 500));
  }
});

// get gallery item by ID
export const getGalleryItemById = asyncHandler(async (req, res, next) => {
  //-1 construct the id from the req
  const { id } = req.params;
  //1.1 check for the ID presence
  if (!id) {
    return next(new AppError("Image ID is required!"));
  }
  //2- query the databse for the desired image
  const image = await Gallery.findById(id);
  //2.1 check if the image exists
  if (!image) {
    return next(new AppError("Image image is not found"));
  }
  //3- send response
  res.status(200).json({
    message: "Sucess!",
    image,
  });
});

// Delete Gallery Item API
export const deleteGalleryItem = asyncHandler(async (req, res, next) => {
  // 1. Extract ID from request parameters
  const { id } = req.params;

  // 1.1 Check for the presence of the ID
  if (!id) {
    return next(new AppError("Image ID is required!", 400)); // Bad Request
  }

  // 2. Retrieve the gallery item from the database
  const galleryItem = await Gallery.findById(id);

  // 2.1 Handle case where the item does not exist
  if (!galleryItem) {
    return next(new AppError("Gallery item not found!", 404)); // Not Found
  }

  // 3. Delete the image from Cloudinary
  try {
    // 3.1 Extract the public ID of the image from the `Image` field
    const { public_id } = galleryItem.Image;

    // 3.2 Perform deletion on Cloudinary
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);

    return next(
      new AppError(
        "Failed to delete image from Cloudinary. Please try again later.",
        500
      )
    ); 
  }

  // 4. Delete the gallery item from the database
  try {
    await galleryItem.deleteOne();
  } catch (error) {
    console.error("Error deleting gallery item from the database:", error);

    return next(
      new AppError(
        "Failed to delete gallery item from the database. Please try again later.",
        500
      )
    ); 
  }

  // 5. Send a success response
  res.status(200).json({
    message: "Gallery item has been removed successfully.",
  });
});

// Update Gallery Item
export const updateGalleryImage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  
  if (!id) {
    return next(new AppError("Gallery item ID is required!", 400)); // Bad Request
  }

  const galleryItem = await Gallery.findById(id);
  if (!galleryItem) {
    return next(new AppError("Gallery item not found!", 404)); // Not Found
  }

  // Initialize a flag for determining if the image update was successful
  let isImageUploaded = false;

  // save the public id of the old image
  const oldPublicId  = galleryItem.Image?.public_id
 
  try {
    if (req.file) {
      // Use the new category from `updates` if provided, otherwise fall back to the old category
      const category = updates.category || galleryItem.category;
      const folderPath = `gallery/${category}`;

      // Upload the new image to Cloudinary first
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath,
        use_filename: true,
        unique_filename: false,
      });

      // Update the image field in the `updates` object
      updates.Image = { secure_url, public_id };
      isImageUploaded = true;
    }
  } catch (error) {
    console.error("Error during Cloudinary image update:", error);

    if (!isImageUploaded) {
      return next(
        new AppError(
          "Failed to upload the new image to Cloudinary. The old image has not been deleted.",
          500
        )
      );
    }
  }

  // Update other fields
  Object.keys(updates).forEach((field) => {
    galleryItem[field] = updates[field];
  });

  // Save the updated gallery item
  try {
    await galleryItem.save();
    // After successful upload, delete the old image
    if (oldPublicId) {
      await cloudinary.uploader.destroy(oldPublicId);
    }
  } catch (error) {
    console.error("Error saving updated gallery item:", error);

    if (isImageUploaded) {
      // Revert the uploaded image on Cloudinary to prevent an orphaned file
      if (updates.Image?.public_id) {
        await cloudinary.uploader.destroy(updates.Image.public_id);
      }
    }

    return next(
      new AppError(
        "Failed to update gallery item in the database. Please try again later.",
        500
      )
    );
  }

  // Respond with success
  res.status(200).json({
    message: "Gallery item updated successfully.",
    data: galleryItem,
  });
});
