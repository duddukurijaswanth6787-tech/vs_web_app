import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { StorageService } from './storage.service';
import { StorageUtils } from './storage.utils';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

const VARIANT_WIDTHS: Record<string, number> = {
  thumb: 150,
  medium: 600,
  large: 1200,
};

/**
 * Public media delivery for private S3 buckets.
 * Serves files directly with immutable cache headers (no redirect).
 * Supports ?variant=thumb|medium|large for on-the-fly WebP generation.
 */
@ApiTags('Storage')
@Controller('storage')
export class StorageServeController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Direct file upload (works with local or S3 storage)',
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string | undefined,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const absolute = (url?: string) =>
      url && url.startsWith('/')
        ? `${req.protocol}://${req.get('host')}${url}`
        : url;

    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
      const variants = await this.storageService.uploadImage(file.buffer, {
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: folder || 'products',
      });
      return ResponseBuilder.success({
        url: absolute(variants.original.url),
        thumbnailUrl: absolute(variants.thumbnail?.url),
        mediumUrl: absolute(variants.medium?.url),
        largeUrl: absolute(variants.large?.url),
      });
    }
    const result = await this.storageService.upload(file.buffer, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder: folder || 'products',
    });
    return ResponseBuilder.success({ url: absolute(result.url) });
  }

  @Get('*path')
  @ApiOperation({
    summary: 'Serve a stored file by key with optional WebP variant',
  })
  @ApiQuery({
    name: 'variant',
    required: false,
    enum: ['thumb', 'medium', 'large'],
  })
  async serve(
    @Param('path') path: string | string[],
    @Query('variant') variant: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const raw =
      (Array.isArray(path) ? path.join('/') : path) ||
      req.path.replace(/^\/api\/v1\/storage\/?/, '');
    const key = decodeURIComponent(String(raw).replace(/^\/+/, ''));

    if (!key || key.includes('..')) {
      return res.status(400).json({ message: 'Invalid storage key' });
    }

    try {
      StorageUtils.assertSafePath(key);
    } catch {
      return res.status(400).json({ message: 'Invalid storage key' });
    }

    const isVariantRequest =
      variant && Object.prototype.hasOwnProperty.call(VARIANT_WIDTHS, variant);

    try {
      if (isVariantRequest) {
        const { buffer, contentType } =
          await this.storageService.getOrGenerateVariant(
            key,
            variant as 'thumb' | 'medium' | 'large',
          );

        res.set({
          'Content-Type': contentType,
          'Content-Length': String(buffer.length),
          'Cache-Control': 'public, max-age=31536000, immutable',
          Vary: 'Accept',
        });
        return res.send(buffer);
      }

      // Original file — serve directly
      const exists = await this.storageService.exists(key);
      if (!exists) {
        return res.status(404).json({ message: 'File not found' });
      }

      const buffer = await this.storageService.get(key);
      const ext = key.split('.').pop()?.toLowerCase() ?? '';
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        avif: 'image/avif',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
        mp4: 'video/mp4',
      };

      res.set({
        'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return res.send(buffer);
    } catch (err: any) {
      if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
        return res.status(404).json({ message: 'File not found' });
      }
      return res.status(500).json({ message: 'Failed to serve file' });
    }
  }
}
