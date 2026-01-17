import {
  Controller,
  Get,
  Patch,
  Body,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  updateSettings(
    @Body()
    dto: {
      businessName?: string;
      businessAddress?: string;
      reportEmail?: string;
      emailHost?: string;
      emailPort?: number;
      emailUser?: string;
      emailPass?: string;
      emailSecure?: boolean;
      currency?: string;
    },
  ) {
    return this.settingsService.updateSettings(dto);
  }

  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      // 'logo' must match the field name in the frontend form
      storage: diskStorage({
        destination: './public/uploads', // Save files to this folder
        filename: (req, file, cb) => {
          // Generate a unique filename
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `logo-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const logoUrl = `/uploads/${file.filename}`; // The URL path to the file
    return this.settingsService.updateLogoUrl(logoUrl);
  }
}
