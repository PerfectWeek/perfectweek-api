import Fs from "fs";
import Glob from "glob";
import Mime from "mime";


class ImageStorageService {

    private readonly imageDirectory: string;

    constructor(imageDirectory: string) {
        this.imageDirectory = imageDirectory;

        // Create the directory if it does not exists
        if (!Fs.existsSync(imageDirectory)) {
            Fs.mkdirSync(imageDirectory, { recursive: true });
        }
    }

    public readonly storeImage = (imagePath: string, mimeType: string, id: number): void => {
        // Remove existing file
        const existingFile = this.getImage(id);
        if (existingFile) {
            Fs.unlinkSync(existingFile);
        }

        // Store new file
        const mimeExtension = Mime.getExtension(mimeType);
        const targetFile = `${this.imageDirectory}/${id}.${mimeExtension}`;
        Fs.renameSync(imagePath, targetFile);
    };

    public readonly getImage = (id: number): string | undefined => {
        const targetImagePattern = `${this.imageDirectory}/${id}.*`;

        const filesMatching = Glob.sync(targetImagePattern, {});
        if (filesMatching.length != 1) {
            return undefined;
        }

        return filesMatching[0];
    };

    public readonly getImageOrDefault = (id: number, defaultImage: string): string => {
        const matchingFile = this.getImage(id);
        return matchingFile !== undefined ? matchingFile : defaultImage;
    };
}


export default ImageStorageService;
