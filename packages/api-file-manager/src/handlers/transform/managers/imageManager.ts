import S3 from "aws-sdk/clients/s3";
import { getObjectParams, getEnvironment } from "~/handlers/utils";
import {
    SUPPORTED_IMAGES,
    SUPPORTED_TRANSFORMABLE_IMAGES,
    OPTIMIZED_IMAGE_PREFIX,
    OPTIMIZED_TRANSFORMED_IMAGE_PREFIX,
    getImageKey,
    getOptimizedTransformedImageKeyPrefix
} from "../utils";

export interface ImageManagerCanProcessParams {
    key: string;
    extension: string;
}
export interface ImageManagerProcessParams {
    s3: S3;
    key: string;
    extension: string;
}
export default {
    canProcess: (params: ImageManagerCanProcessParams) => {
        const { key, extension } = params;
        if (SUPPORTED_IMAGES.includes(extension) === false) {
            return false;
        }

        return (
            key.startsWith(OPTIMIZED_IMAGE_PREFIX) ||
            key.startsWith(OPTIMIZED_TRANSFORMED_IMAGE_PREFIX)
        );
    },
    async process({ s3, key, extension }: ImageManagerProcessParams) {
        // 1. Get optimized image's key.

        await s3.deleteObject(getObjectParams(getImageKey({ key }))).promise();

        // 2. Search for all transformed images and delete those too.
        if (SUPPORTED_TRANSFORMABLE_IMAGES.includes(extension) === false) {
            return;
        }
        const env = getEnvironment();
        const imagesList = await s3
            .listObjects({
                Bucket: env.bucket,
                Prefix: getOptimizedTransformedImageKeyPrefix(key)
            })
            .promise();

        if (!imagesList.Contents) {
            return;
        }

        for (const imageObject of imagesList.Contents) {
            if (!imageObject.Key) {
                continue;
            }
            await s3.deleteObject(getObjectParams(imageObject.Key)).promise();
        }
    }
};
