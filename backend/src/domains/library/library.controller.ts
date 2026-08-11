import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Media Library')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'manager')
@ApiBearerAuth()
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('media')
  @ApiOperation({ summary: 'List media library with filtering and pagination' })
  async listMedia(
    @Query('folderId') folderId?: string,
    @Query('mimeType') mimeType?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return ResponseBuilder.success(
      await this.libraryService.listMedia({
        folderId,
        mimeType,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      }),
    );
  }

  @Get('media/:id')
  @ApiOperation({ summary: 'Get media by ID' })
  async getMedia(@Param('id') id: string) {
    return ResponseBuilder.success(await this.libraryService.getMedia(id));
  }

  @Post('media')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Create media record after upload' })
  async createMedia(
    @Body()
    body: {
      filename: string;
      originalFilename: string;
      mimeType: string;
      size: number;
      width?: number;
      height?: number;
      folderId?: string;
      storageKey: string;
      publicUrl: string;
      thumbnailUrl?: string;
      mediumUrl?: string;
      largeUrl?: string;
      checksum?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.libraryService.createMedia({ ...body, uploadedBy: user.sub }),
      'Media uploaded',
    );
  }

  @Patch('media/:id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Update media metadata' })
  async updateMedia(
    @Param('id') id: string,
    @Body() body: { altText?: string; caption?: string; folderId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.libraryService.updateMedia(id, body, user.sub),
      'Media updated',
    );
  }

  @Patch('media/:id/rename')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Rename media file' })
  async renameMedia(
    @Param('id') id: string,
    @Body() body: { originalFilename: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.libraryService.renameMedia(
        id,
        body.originalFilename,
        user.sub,
      ),
      'Media renamed',
    );
  }

  @Post('media/:id/replace')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Replace media file' })
  async replaceMedia(
    @Param('id') id: string,
    @Body()
    body: {
      filename: string;
      originalFilename: string;
      mimeType: string;
      size: number;
      width?: number;
      height?: number;
      storageKey: string;
      publicUrl: string;
      thumbnailUrl?: string;
      mediumUrl?: string;
      largeUrl?: string;
      checksum?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.libraryService.replaceMedia(id, body, user.sub),
      'Media replaced',
    );
  }

  @Post('media/bulk-delete')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Bulk soft delete media' })
  async bulkDeleteMedia(
    @Body() body: { ids: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.libraryService.bulkDeleteMedia(body.ids, user.sub),
      'Media deleted',
    );
  }

  @Post('media/bulk-move')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Bulk move media to folder' })
  async bulkMoveMedia(
    @Body() body: { ids: string[]; folderId: string | null },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.libraryService.bulkMoveMedia(body.ids, body.folderId, user.sub);
    return ResponseBuilder.success(null, 'Media moved');
  }

  @Post('media/:id/restore')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Restore soft-deleted media' })
  async restoreMedia(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.libraryService.restoreMedia(id, user.sub),
      'Media restored',
    );
  }

  @Delete('media/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Soft delete media' })
  async deleteMedia(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.libraryService.deleteMedia(id, user.sub);
    return ResponseBuilder.deleted('Media deleted');
  }

  @Post('media/upload-url')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get signed S3 upload URL for library media' })
  async getUploadUrl(@Body() body: { filename: string; mimeType: string }) {
    return ResponseBuilder.success(
      await this.libraryService.getUploadUrl(body.filename, body.mimeType),
      'Upload URL generated',
    );
  }

  @Get('media/duplicates')
  @ApiOperation({ summary: 'Find duplicate media by checksum' })
  async findDuplicates(@Query('checksum') checksum: string) {
    return ResponseBuilder.success(
      await this.libraryService.findDuplicates(checksum),
    );
  }

  @Get('folders')
  @ApiOperation({
    summary: 'List root-level folders (pass parentId to get children)',
  })
  async listFolders(@Query('parentId') parentId?: string) {
    return ResponseBuilder.success(
      await this.libraryService.listFolders(parentId),
    );
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Get folder by ID' })
  async getFolder(@Param('id') id: string) {
    return ResponseBuilder.success(await this.libraryService.getFolder(id));
  }

  @Post('folders')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Create a media folder' })
  async createFolder(
    @Body() body: { name: string; parentId?: string; description?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.libraryService.createFolder({ ...body, createdBy: user.sub }),
      'Folder created',
    );
  }

  @Patch('folders/:id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Update folder metadata' })
  async updateFolder(
    @Param('id') id: string,
    @Body()
    body: { name?: string; parentId?: string | null; description?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.libraryService.updateFolder(id, body, user.sub),
      'Folder updated',
    );
  }

  @Delete('folders/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a folder' })
  async deleteFolder(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.libraryService.deleteFolder(id, user.sub);
    return ResponseBuilder.deleted('Folder deleted');
  }
}
