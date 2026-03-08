import { Readable } from "stream";
import cloudinary from "../services/uploadService.js";
import logger from "../configs/loggerConfig.js";
export const uploadPostImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided",
            });
        }
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "post_images",
                resource_type: "image",
                transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            const bufferStream = Readable.from(req.file.buffer);
            bufferStream.pipe(uploadStream);
        });
        res.status(200).json({
            success: true,
            url: uploadResult.secure_url,
        });
    }
    catch (error) {
        console.error("Error uploading post image:", error);
        logger.error("Error uploading post image");
        next(error);
    }
};
