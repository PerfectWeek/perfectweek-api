import Multer from "multer";


export function generateImageUploadMiddleware(uploadDirectory: string): Multer.Instance {
    return Multer({ dest: uploadDirectory });
}
