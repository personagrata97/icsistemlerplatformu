import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { IndependenceService } from './independence.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('audit/independence')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IndependenceController {
    constructor(private readonly independenceService: IndependenceService) { }

    // Get all declarations (admin)
    @Get()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getAll(
        @Query('status') status?: string,
        @Query('year') year?: string,
        @Query('userId') userId?: string,
    ) {
        return this.independenceService.getAll({
            status,
            year: year ? parseInt(year) : undefined,
            userId,
        });
    }

    // Get current user's declarations
    @Get('my')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getMyDeclarations(@Request() req: any) {
        return this.independenceService.getMyDeclarations(req.user.userId);
    }

    // Get pending declarations (admin review queue)
    @Get('pending')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getPending() {
        return this.independenceService.getPending();
    }

    // Get stats
    @Get('stats')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getStats() {
        return this.independenceService.getStats();
    }

    // Get single declaration
    @Get(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getById(@Param('id') id: string) {
        return this.independenceService.getById(id);
    }

    // Create new declaration
    @Post()
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    create(@Request() req: any, @Body() data: any) {
        return this.independenceService.create(req.user, data);
    }

    // Update declaration
    @Put(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.independenceService.update(id, req.user, data);
    }

    // Review declaration (admin)
    @Put(':id/review')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    review(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.independenceService.review(id, req.user, data);
    }

    // Upload signed document
    @Post(':id/upload-signed')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './private_uploads/independence',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `signed-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'application/pdf') {
                    cb(null, true);
                } else {
                    cb(new Error('Sadece PDF dosyaları kabul edilir'), false);
                }
            },
        }),
    )
    uploadSigned(@Param('id') id: string, @UploadedFile() file: any) {
        return this.independenceService.uploadSignedDocument(id, file?.path);
    }

    // Delete declaration
    @Delete(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    delete(@Request() req: any, @Param('id') id: string) {
        const isAdmin = req.user.roles?.some((r: any) => 
            (typeof r === 'string' ? r : r.code || r.role?.code) === 'ADMIN' || 
            (typeof r === 'string' ? r : r.code || r.role?.code) === 'AUDIT_MANAGER'
        );
        return this.independenceService.delete(id, req.user, isAdmin);
    }
}
