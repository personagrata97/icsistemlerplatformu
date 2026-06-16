import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, UseInterceptors, UploadedFile, Res, NotFoundException, Req, Logger, ParseFilePipeBuilder, HttpStatus, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditStaffService } from './audit-staff.service';
import { ReportGeneratorService } from './report-generator.service';
import { FindingService } from './finding.service';
import { AuditTrashService } from './audit-trash.service';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { IndependenceGuard } from '../auth/guards/independence.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateAuditDto, UpdateAuditDto } from './dto/audit.dto';
import { CreateFindingDto, UpdateFindingDto } from './dto/finding.dto';
import { CreateAuditExtensionDto, HandleAuditExtensionDto } from './dto/audit-extension.dto';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard, IndependenceGuard)
export class AuditController {
    constructor(private readonly auditStaffService: AuditStaffService, 
        private readonly auditService: AuditService,
        private readonly reportService: ReportGeneratorService,
        private readonly findingService: FindingService,
        private readonly trashService: AuditTrashService,
        private readonly auditLogService: AuditLogService
    ) { }

    private readonly logger = new Logger(AuditController.name);

    @Get('audits')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAudits(@Request() req: any) {
        this.logger.log(`Denetim listesi istendi. Kullanıcı: ${req.user?.username}`);
        return this.auditService.getAllAudits(req.user);
    }

    // REPORTS & EXECUTIVE SUMMARY
    @Get('executive/stats')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getExecutiveStats(@Request() req: any, @Query('year') year?: string) {
        return this.auditService.getExecutiveStats(req.user, year);
    }

    @Post('reports/generate')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async generateReport(@Body() data: { type: string, period: string, templateId?: string, includeWatermark?: boolean }, @Request() req: any) {
        return this.reportService.generateReport(data.type, data.period, data.templateId, req.user, data.includeWatermark ?? true);
    }

    @Post('reports/generate-word')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async generateWordReport(@Body() data: { auditId: string }, @Request() req: any) {
        return this.reportService.generateWordReport(data.auditId, req.user);
    }

    @Get('reports/history')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getReportHistory() {
        return this.reportService.getGeneratedReports();
    }

    @Get('reports/download/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async downloadReport(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
        const filePath = await this.reportService.downloadReport(id, req.user);
        res.download(filePath);
    }

    @Delete('reports/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteReport(@Param('id') id: string) {
        return this.reportService.deleteGeneratedReport(id);
    }


    @Get('logs')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getLogs() {
        return this.auditService.getLogs();
    }

    @Get('notifications')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getNotifications() {
        return this.auditLogService.getNotifications();
    }

    @Get('audits/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAudit(@Param('id') id: string, @Request() req: any) {
        return this.auditService.getAudit(id, req.user);
    }

    @Get('audits/:id/history')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAuditHistory(@Param('id') id: string) {
        return this.auditLogService.getAuditHistory(id);
    }

    @Post('audits')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createAudit(@Body() data: CreateAuditDto, @Request() req: any) {
        return this.auditService.createAudit(data, req.user);
    }

    @Put('audits/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateAudit(@Param('id') id: string, @Body() data: UpdateAuditDto, @Request() req: any) {
        return this.auditService.updateAudit(id, data, req.user);
    }

    @Delete('audits/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteAudit(@Param('id') id: string, @Body() body: { reason?: string, comment?: string }, @Request() req: any) {
        return this.auditService.deleteAudit(id, req.user, body?.reason, body?.comment);
    }

    @Post('audits/:id/approve-delete')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async approveDeleteAudit(@Param('id') id: string, @Request() req: any) {
        return this.auditService.approveDeleteAudit(id, req.user);
    }

    @Post('audits/:id/reject-delete')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async rejectDeleteAudit(@Param('id') id: string, @Request() req: any) {
        return this.auditService.rejectDeleteAudit(id, req.user);
    }



    // FINDINGS
    @Get('findings')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getFindings(@Request() req: any) {
        return this.findingService.getAllFindings(req.user);
    }

    @Post('findings/check-recurring')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async checkRecurringFindings(@Body() data: { unitId?: string, department?: string, category?: string, title?: string }) {
        return this.findingService.checkRecurringFindings(data.unitId, data.department, data.category, data.title);
    }

    @Get('findings/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getFinding(@Param('id') id: string, @Request() req: any) {
        return this.findingService.getFinding(id, req.user);
    }

    @Post('findings')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createFinding(@Body() data: CreateFindingDto, @Request() req: any) {
        return this.findingService.createFinding(data, req.user);
    }

    @Put('findings/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateFinding(@Param('id') id: string, @Body() data: UpdateFindingDto, @Request() req: any) {
        return this.findingService.updateFinding(id, data, req.user);
    }

    @Delete('findings/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteFinding(@Param('id') id: string, @Body() body: { reason?: string, comment?: string }, @Request() req: any) {
        return this.findingService.deleteFinding(id, req.user, body?.reason, body?.comment);
    }

    @Post('findings/:id/approve-delete')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async approveDeleteFinding(@Param('id') id: string, @Request() req: any) {
        return this.findingService.approveDeleteFinding(id, req.user);
    }

    @Post('findings/:id/reject-delete')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async rejectDeleteFinding(@Param('id') id: string, @Request() req: any) {
        return this.findingService.rejectDeleteFinding(id, req.user);
    }

    @Post('findings/:id/notify')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async notifyFinding(
        @Param('id') id: string,
        @Body() body: { email: string },
        @Request() req: any
    ) {
        return this.findingService.notifyFinding(id, body.email, req.user);
    }

    @Post('findings/:id/accept-risk')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file'))
    async acceptRisk(
        @Param('id') id: string,
        @Body() body: { justification: string },
        @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })) file: any,
        @Request() req: any
    ) {
        return this.findingService.acceptRisk(id, body.justification, file, req.user);
    }

    @Get('extension-requests')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getExtensionRequests() {
        return this.findingService.getExtensionRequests();
    }

    @Post('extension-requests')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createExtensionRequest(@Body() data: any, @Request() req: any) {
        return this.findingService.createExtensionRequest(data, req.user);
    }

    @Put('extension-requests/:id/status')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async handleExtensionRequest(@Param('id') id: string, @Body() data: { status: string, notes: string }, @Request() req: any) {
        return this.findingService.handleExtensionRequest(id, data.status, data.notes, req.user);
    }

    // LOGS


    @Post('logs')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createLog(@Body() data: any, @Req() req: any) {
        data.ipAddress = req.ip;
        data.user = data.user || req.user?.userId || req.user?.id || 'Bilinmeyen';
        return this.auditLogService.createLog(data);
    }

    @Get('logs/verify-integrity')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async verifyLogIntegrity() {
        return this.auditLogService.verifyLogIntegrity();
    }

    @Post('logs/repair-chain')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async repairLogChain() {
        return this.auditLogService.repairLogChain();
    }

    // STAFF
    @Get('staff')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getStaff() {
        return this.auditStaffService.getStaff();
    }

    @Post('staff')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createStaff(@Body() data: any) {
        return this.auditStaffService.createStaff(data);
    }

    @Put('staff/:id')
    async updateStaff(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.auditStaffService.updateStaff(id, data, req.user);
    }

    @Delete('staff/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteStaff(@Param('id') id: string, @Req() req: any) {
        return this.auditStaffService.deleteStaff(id, req.user);
    }

    @Post('staff/upload-photo')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadStaffPhoto(@UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })) file: any) {
        return this.auditStaffService.uploadStaffPhoto(file);
    }

    @Post('staff/:id/promotion')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async addStaffPromotion(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.auditStaffService.addStaffPromotion(id, data, req.user);
    }

    @Put('staff/promotion/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateStaffPromotion(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        return this.auditStaffService.updateStaffPromotion(id, data, req.user);
    }

    @Delete('staff/promotion/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteStaffPromotion(@Param('id') id: string, @Req() req: any) {
        return this.auditStaffService.deleteStaffPromotion(id, req.user);
    }

    // ETHICS REPORTS
    @Get('ethics-reports')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getEthicsReports() {
        return this.auditService.getEthicsReports();
    }

    @Post('ethics-reports')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createEthicsReport(@Body() data: any) {
        return this.auditService.createEthicsReport(data);
    }

    @Put('ethics-reports/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateEthicsReport(@Param('id') id: string, @Body() data: any) {
        return this.auditService.updateEthicsReportStatus(id, data.status);
    }

    // AUDIT PLAN
    @Get('plans')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getPlans() { return this.auditService.getPlans(); }
    @Get('plans/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getPlan(@Param('id') id: string) { return this.auditService.getPlan(id); }
    @Post('plans')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createPlan(@Body() data: any) { return this.auditService.createPlan(data); }
    @Put('plans/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updatePlan(@Param('id') id: string, @Body() data: any) { return this.auditService.updatePlan(id, data); }
    @Delete('plans/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deletePlan(@Param('id') id: string) { return this.auditService.deletePlan(id); }

    @Post('plans/:id/document')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadPlanDocument(@Param('id') id: string, @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })) file: any, @Request() req: any) {
        return this.auditService.uploadPlanDocument(id, file, req.user);
    }

    @Get('plans/:id/document/:filename')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getPlanDocument(@Param('id') id: string, @Param('filename') filename: string, @Res() res: Response) {
        const filePath = await this.auditService.getPlanDocumentPath(id, filename);
        res.download(filePath);
    }

    // AUDITABLE UNITS (UNIVERSE)
    @Get('units')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getUnits(@Request() req: any, @Query('summary') summary?: string) {
        // frontend'den /audit/units çağrılırsa default olarak payload bloat'u önlemek için summary=true gibi davranacak
        const isSummary = summary !== 'false';
        return this.auditService.getUnits(req.user, isSummary);
    }
    @Post('units')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createUnit(@Body() data: any) { return this.auditService.createUnit(data); }
    @Put('units/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateUnit(@Param('id') id: string, @Body() data: any) { return this.auditService.updateUnit(id, data); }
    @Delete('units/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteUnit(@Param('id') id: string) { return this.auditService.deleteUnit(id); }

    // EDUCATION
    @Get('educations')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getEducations() { return this.auditService.getEducations(); }
    @Post('educations')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createEducation(@Body() data: any, @Request() req: any) { return this.auditService.createEducation(data, req.user); }
    @Put('educations/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateEducation(@Param('id') id: string, @Body() data: any, @Request() req: any) { return this.auditService.updateEducation(id, data, req.user); }
    @Delete('educations/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteEducation(@Param('id') id: string, @Request() req: any) { return this.auditService.deleteEducation(id, req.user); }

    // FOLLOW UP
    @Get('follow-ups')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getFollowUps(@Request() req: any) {
        return this.auditService.getFollowUps(req.user);
    }
    @Post('follow-ups')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createFollowUp(@Body() data: any) { return this.auditService.createFollowUp(data); }
    @Put('follow-ups/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateFollowUp(@Param('id') id: string, @Body() data: any) { return this.auditService.updateFollowUp(id, data); }

    // CONCILIATION
    @Get('conciliations')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getConciliations(@Request() req: any) {
        return this.auditService.getConciliations(req.user);
    }
    @Post('conciliations')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createConciliation(@Body() data: any) { return this.auditService.createConciliation(data); }

    @Put('conciliations/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateConciliation(@Param('id') id: string, @Body() data: any) { return this.auditService.updateConciliation(id, data); }

    @Delete('conciliations/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteConciliation(@Param('id') id: string) { return this.auditService.deleteConciliation(id); }

    // WORKPAPERS (File Upload)
    @Post('audits/:id/workpapers')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadWorkpaper(
        @Param('id') id: string,
        @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })) file: any,
        @Body() body: any,
        @Request() req: any
    ) {
        const category = body?.category || 'Genel';
        return this.auditService.uploadWorkpaper(id, file, category, req.user);
    }

    @Delete('workpapers/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteWorkpaper(@Param('id') id: string, @Request() req: any) {
        return this.auditService.deleteWorkpaper(id, req.user);
    }

    @Get('audits/:id/workpapers/:filename')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getWorkpaper(@Param('id') id: string, @Param('filename') filename: string, @Res() res: Response) {
        const filePath = await this.auditService.getWorkpaperPath(id, filename);
        res.download(filePath);
    }

    // FINDING EVIDENCE (File Upload)
    @Post('findings/:id/evidence')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFindingEvidence(@Param('id') id: string, @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })) file: any, @Request() req: any) {
        return this.auditService.uploadFindingEvidence(id, file, req.user);
    }

    @Get('findings/:id/evidence/:filename')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getFindingEvidence(@Param('id') id: string, @Param('filename') filename: string, @Res() res: Response) {
        const filePath = await this.auditService.getFindingEvidencePath(id, filename);
        res.download(filePath);
    }

    @Post('findings/:id/conciliation-evidence')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadConciliationEvidence(@Param('id') id: string, @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })) file: any, @Request() req: any) {
        return this.auditService.uploadConciliationEvidence(id, file, req.user);
    }

    // TRASH (Çöp Kutusu)
    @Get('trash/audits')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getDeletedAudits() {
        return this.trashService.getDeletedAudits();
    }

    @Get('trash/findings')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getDeletedFindings() {
        return this.trashService.getDeletedFindings();
    }

    @Post('trash/audits/:id/restore')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async restoreAudit(@Param('id') id: string) {
        return this.trashService.restoreAudit(id);
    }

    @Post('trash/findings/:id/restore')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async restoreFinding(@Param('id') id: string) {
        return this.trashService.restoreFinding(id);
    }

    @Delete('trash/audits/:id/permanent')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async permanentDeleteAudit(@Param('id') id: string, @Request() req: any) {
        return this.trashService.permanentDeleteAudit(id, req.user);
    }

    @Delete('trash/findings/:id/permanent')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async permanentDeleteFinding(@Param('id') id: string, @Request() req: any) {
        return this.trashService.permanentDeleteFinding(id, req.user);
    }

    @Delete('trash/empty')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async emptyTrash(@Request() req: any) {
        return this.trashService.emptyTrash(req.user);
    }

    // ==========================================
    // RCM ENDPOINTS
    // ==========================================

    @Get('units/:unitId/processes')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getProcesses(@Param('unitId') unitId: string) { return this.auditService.getProcesses(unitId); }
    @Post('processes')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createProcess(@Body() data: any) { return this.auditService.createProcess(data); }
    @Put('processes/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateProcess(@Param('id') id: string, @Body() data: any) { return this.auditService.updateProcess(id, data); }
    @Delete('processes/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteProcess(@Param('id') id: string) { return this.auditService.deleteProcess(id); }

    @Get('processes/:processId/risks')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getRisks(@Param('processId') processId: string) { return this.auditService.getRisks(processId); }
    @Post('risks')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createRisk(@Body() data: any) { return this.auditService.createRisk(data); }
    @Put('risks/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateRisk(@Param('id') id: string, @Body() data: any) { return this.auditService.updateRisk(id, data); }
    @Delete('risks/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteRisk(@Param('id') id: string) { return this.auditService.deleteRisk(id); }

    @Get('controls')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAllControls() { return this.auditService.getAllControls(); }

    @Get('risks/:riskId/controls')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getControls(@Param('riskId') riskId: string) { return this.auditService.getControls(riskId); }
    @Post('controls')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createControl(@Body() data: any) { return this.auditService.createControl(data); }
    @Put('controls/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateControl(@Param('id') id: string, @Body() data: any) { return this.auditService.updateControl(id, data); }
    @Delete('controls/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteControl(@Param('id') id: string) { return this.auditService.deleteControl(id); }

    @Get('audits/:auditId/tests')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAuditTests(@Param('auditId') auditId: string) { return this.auditService.getAuditTests(auditId); }
    @Post('tests')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createAuditTest(@Body() data: any) { return this.auditService.createAuditTest(data); }
    @Put('tests/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateAuditTest(@Param('id') id: string, @Body() data: any) { return this.auditService.updateAuditTest(id, data); }
    @Delete('tests/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteAuditTest(@Param('id') id: string, @Request() req: any) { return this.auditService.deleteAuditTest(id, req.user); }

    // Staff Career & Education
    @Get('staff/:id/profile')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getStaffProfile(@Param('id') id: string, @Req() req: any) { return this.auditStaffService.getStaffProfile(id, req.user); }

    @Get('staff/cpe-stats')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getCpeStats(@Query('year') year: string, @Req() req: any) {
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        return this.auditStaffService.getCpeStats(targetYear, req.user);
    }

    // --- Mesleki Eğitim Endpoints ---

    @Post('staff/:userId/training')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async addStaffTraining(@Param('userId') userId: string, @Body() data: any, @Request() req: any) {
        return this.auditStaffService.addStaffTraining(userId, data, req.user);
    }

    @Put('staff/training/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateStaffTraining(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.auditStaffService.updateStaffTraining(id, data, req.user);
    }

    @Delete('staff/training/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteStaffTraining(@Param('id') id: string, @Req() req: any) {
        return this.auditStaffService.deleteStaffTraining(id, req.user);
    }

    @Post('staff/trainings/bulk')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createTrainingBatch(@Body() data: any) {
        return this.auditService.createTrainingBatch(data);
    }

    @Post('staff/trainings/batch/:batchId/cancel')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async cancelTrainingBatch(@Param('batchId') batchId: string, @Body() body: { notes: string }) {
        return this.auditService.cancelTrainingBatch(batchId, body.notes);
    }

    @Post('staff/:userId/experience')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async addStaffExperience(@Param('userId') userId: string, @Body() data: any, @Req() req: any) {
        return this.auditStaffService.addStaffExperience(userId, data, req.user);
    }

    // --- LEAVE ENDPOINTS ---
    @Post('staff/:userId/leave')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async addStaffLeave(@Param('userId') userId: string, @Body() data: any, @Req() req: any) {
        return this.auditStaffService.addStaffLeave(userId, data, req.user);
    }
    @Put('staff/leave/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateStaffLeave(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        return this.auditStaffService.updateStaffLeave(id, data, req.user);
    }
    @Delete('staff/leave/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteStaffLeave(@Param('id') id: string, @Req() req: any) {
        return this.auditStaffService.deleteStaffLeave(id, req.user);
    }
    // -----------------------
    @Put('staff/experience/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateStaffExperience(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        return this.auditStaffService.updateStaffExperience(id, data, req.user);
    }
    @Delete('staff/experience/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteStaffExperience(@Param('id') id: string, @Req() req: any) {
        return this.auditStaffService.deleteStaffExperience(id, req.user);
    }

    @Post('staff/:userId/education')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async addStaffEducation(@Param('userId') userId: string, @Body() data: any, @Req() req: any) {
        return this.auditStaffService.addStaffEducation(userId, data, req.user);
    }
    @Put('staff/education/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateStaffEducation(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        return this.auditStaffService.updateStaffEducation(id, data, req.user);
    }
    @Delete('staff/education/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteStaffEducation(@Param('id') id: string, @Req() req: any) {
        return this.auditStaffService.deleteStaffEducation(id, req.user);
    }

    // ITERATIVE CONCILIATION
    @Get('findings/:findingId/conciliation-messages')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getConciliationMessages(@Param('findingId') findingId: string) {
        return this.findingService.getConciliationMessages(findingId);
    }

    @Post('findings/:findingId/conciliation-messages')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async addConciliationMessage(@Param('findingId') findingId: string, @Body() data: any, @Req() req: any) {
        return this.findingService.addConciliationMessage(findingId, data, req.user);
    }

    // ==========================================
    // DENETİM TOPLANTILARI (AUDIT MEETINGS)
    // ==========================================
    @Get(':id/meetings')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAuditMeetings(@Param('id') id: string) {
        return this.auditService.getAuditMeetings(id);
    }

    @Post(':id/meetings')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createAuditMeeting(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        return this.auditService.createAuditMeeting(id, data, req.user);
    }

    @Put('meetings/:meetingId')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateAuditMeeting(@Param('meetingId') meetingId: string, @Body() data: any, @Req() req: any) {
        return this.auditService.updateAuditMeeting(meetingId, data, req.user);
    }

    @Delete('meetings/:meetingId')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteAuditMeeting(@Param('meetingId') meetingId: string, @Req() req: any) {
        return this.auditService.deleteAuditMeeting(meetingId, req.user);
    }

    // ==========================================
    // DENETİM SÜRESİ UZATMA TALEPLERİ
    // ==========================================
    @Get('audit-extensions')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAuditExtensions(@Request() req: any) {
        return this.auditService.getAuditExtensions(req.user);
    }

    @Post('audit-extensions')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async requestAuditExtension(@Body() data: CreateAuditExtensionDto, @Request() req: any) {
        return this.auditService.requestAuditExtension(data, req.user);
    }

    @Put('audit-extensions/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async handleAuditExtension(@Param('id') id: string, @Body() data: HandleAuditExtensionDto, @Request() req: any) {
        return this.auditService.handleAuditExtension(id, data, req.user);
    }

    // ==========================================
    // REVIEW NOTES (HISTORY)
    // ==========================================
    @Post('notes')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async addReviewNote(@Body() data: { targetId: string, type: 'BULGU' | 'TEST' | 'CALISMA_KAGIDI', text: string }, @Request() req: any) {
        return this.findingService.addReviewNote(data.targetId, data.type, data.text, req.user);
    }

    @Get('notes/:type/:targetId')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getReviewNotes(@Param('type') type: 'BULGU' | 'TEST' | 'CALISMA_KAGIDI', @Param('targetId') targetId: string) {
        return this.findingService.getReviewNotes(targetId, type);
    }

    // ==========================================
    // FAST-TRACK PUBLIC COMPLIANCE PORTAL
    // ==========================================

    @Get('findings/:id/fast-track-details')
    @Public()
    async getFastTrackDetails(
        @Param('id') id: string,
        @Query('token') token: string
    ) {
        return this.findingService.getFastTrackDetails(id, token);
    }

    @Post('findings/:id/fast-track-authenticate')
    @Public()
    async fastTrackAuthenticate(
        @Param('id') id: string,
        @Body() body: { username: string; password?: string }
    ) {
        return this.findingService.fastTrackAuthenticate(body.username, body.password || 'mockPasswordBypass');
    }

    @Post('findings/:id/fast-track-approve')
    @Public()
    async fastTrackApprove(
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any
    ) {
        const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        return this.findingService.fastTrackApprove(id, body, clientIp);
    }

    @Get('findings/:id/fast-track-download/:filename')
    @Public()
    async getFastTrackEvidence(
        @Param('id') id: string,
        @Param('filename') filename: string,
        @Query('token') token: string,
        @Res() res: Response
    ) {
        // Validate magic token first to prevent unauthorized resource access
        const details = await this.findingService.getFastTrackDetails(id, token);
        if (!details) {
            throw new NotFoundException('Geçersiz token veya yetkisiz erişim.');
        }

        const filePath = await this.auditService.getFindingEvidencePath(id, filename);
        res.download(filePath);
    }
}
