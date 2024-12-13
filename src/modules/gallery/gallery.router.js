import {Router} from "express";
import { multerMiddleHost } from "../../middleware/multer.middleware.js";
import { deleteGalleryItem, fetchGalleryItems,getGalleryItemById, updateGalleryImage, uploadGalleryImage } from "./gallery.controller.js"; 
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import { deleteImageSchema, fetchGalleryItemsSchema, updateImageSchema, uploadImageSchema } from "./gallery.validation.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { systemRoles } from "../../utils/common/enum.js";

const galleryRouter = Router();

galleryRouter.post("/upload-gallery-item",isAuthenticated,isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),multerMiddleHost(allowedExtensions.image).single("image"),validation(uploadImageSchema) ,uploadGalleryImage);
galleryRouter.get("/get-gallery-item",validation(fetchGalleryItemsSchema),fetchGalleryItems);
galleryRouter.get("/get-gallery-item/:id",getGalleryItemById);
galleryRouter.delete("/delete-gallery-item/:id",validation(deleteImageSchema),isAuthenticated,isAuthorized(systemRoles.ADMIN,systemRoles.SUPER),deleteGalleryItem);
galleryRouter.put("/update-gallery-item/:id",validation(updateImageSchema),isAuthenticated,isAuthorized(systemRoles.ADMIN, systemRoles.SUPER),multerMiddleHost(allowedExtensions.image).single("image"),updateGalleryImage);
export default galleryRouter;