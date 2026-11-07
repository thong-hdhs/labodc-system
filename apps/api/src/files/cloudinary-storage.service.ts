import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import {
  CloudinarySignedUpload,
  CloudinaryUploadVerification,
  FileAsset,
  FileResourceType,
} from './file.types';

@Injectable()
export class CloudinaryStorageService {
  createSignedUpload(
    asset: FileAsset,
    allowedFormats: string[],
  ): CloudinarySignedUpload {
    const config = this.getConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const signedFields = {
      allowed_formats: allowedFormats.join(','),
      context: `file_id=${asset.id}|owner_id=${asset.ownerUserId}|category=${asset.category}`,
      overwrite: 'false',
      public_id: asset.publicId,
      timestamp: String(timestamp),
      type: 'authenticated',
      use_filename: 'false',
      filename_override: asset.fileName,
    };
    const signature = cloudinary.utils.api_sign_request(
      signedFields,
      config.api_secret,
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloud_name)}/${asset.resourceType}/upload`,
      fields: {
        ...signedFields,
        api_key: config.api_key,
        signature,
      },
    };
  }

  async verifyUploadedAsset(asset: FileAsset): Promise<CloudinaryUploadVerification> {
    this.getConfig();
    const response: unknown = await cloudinary.api.resource(asset.publicId, {
      resource_type: asset.resourceType,
      type: 'authenticated',
    });
    if (!this.isResourceResponse(response)) {
      throw new ServiceUnavailableException(
        'Cloudinary trả về metadata không hợp lệ cho tệp vừa tải lên.',
      );
    }
    return {
      publicId: response.public_id,
      resourceType: response.resource_type,
      deliveryType: response.type,
      format: response.format.toLowerCase(),
      bytes: response.bytes,
    };
  }

  createPrivateDownloadUrl(
    asset: FileAsset,
    expiresAt: number,
  ): string {
    const config = this.getConfig();
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
      secure: true,
    });
    return cloudinary.utils.private_download_url(
      asset.publicId,
      asset.format,
      {
        resource_type: asset.resourceType,
        type: 'authenticated',
        expires_at: expiresAt,
        attachment: true,
      },
    );
  }

  private getConfig(): {
    cloud_name: string;
    api_key: string;
    api_secret: string;
  } {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud_name || !api_key || !api_secret) {
      throw new ServiceUnavailableException(
        'Cloudinary chưa được cấu hình đầy đủ; upload/download tệp hiện không khả dụng.',
      );
    }
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    return { cloud_name, api_key, api_secret };
  }

  private isResourceResponse(
    value: unknown,
  ): value is {
    public_id: string;
    resource_type: FileResourceType;
    type: string;
    format: string;
    bytes: number;
  } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'public_id' in value &&
      typeof value.public_id === 'string' &&
      'resource_type' in value &&
      (value.resource_type === 'image' || value.resource_type === 'raw') &&
      'type' in value &&
      typeof value.type === 'string' &&
      'format' in value &&
      typeof value.format === 'string' &&
      'bytes' in value &&
      typeof value.bytes === 'number' &&
      Number.isInteger(value.bytes)
    );
  }
}
