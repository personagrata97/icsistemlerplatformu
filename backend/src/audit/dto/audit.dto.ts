import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsBoolean, Min, Max, IsEnum } from 'class-validator';

export enum AuditStatus {
    TASLAK = 'Taslak',
    PLANLANDI = 'Planlandı',
    DEVAM_EDIYOR = 'Devam Ediyor',
    RAPORLANIYOR = 'Raporlanıyor',
    RAPORLANDI = 'Raporlandı',
    CAE_ONAYI = 'CAE Onayı Bekliyor',
    TAMAMLANDI = 'Tamamlandı',
    IPTAL = 'İptal',
    SILINME_ONAYI = 'Silinme Onayı Bekliyor',
    SILINDI = 'Silindi'
}
/**
 * Denetim Oluşturma DTO'su
 * Frontend'den gelen verinin tip güvenliğini sağlar.
 */
export class CreateAuditDto {
    @IsString()
    @IsNotEmpty({ message: 'Denetim başlığı zorunludur.' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'Denetim türü zorunludur.' })
    type: string;

    @IsString()
    @IsOptional()
    auditCode?: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsNotEmpty({ message: 'Başlangıç tarihi zorunludur.' })
    startDate: string;

    @IsString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    supervisor?: string;

    @IsString()
    @IsOptional()
    supervisorId?: string;

    @IsOptional()
    team?: any; // JSON array – string veya object array olabilir

    @IsOptional()
    auditors?: string[];

    @IsString()
    @IsOptional()
    scope?: string;

    @IsString()
    @IsOptional()
    objective?: string;

    @IsString()
    @IsOptional()
    methodology?: string;

    @IsString()
    @IsOptional()
    criteria?: string;

    @IsString()
    @IsOptional()
    period?: string;

    @IsString()
    @IsOptional()
    riskLevel?: string;

    @IsString()
    @IsOptional()
    opinion?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    progress?: number;

    @IsString()
    @IsOptional()
    unitId?: string;

    @IsString()
    @IsOptional()
    auditableUnitId?: string;

    @IsString()
    @IsOptional()
    plannedStartDate?: string;

    @IsString()
    @IsOptional()
    plannedEndDate?: string;

    @IsString()
    @IsOptional()
    actualStartDate?: string;

    @IsString()
    @IsOptional()
    actualEndDate?: string;

    @IsBoolean()
    @IsOptional()
    allowParallel?: boolean;

    // ACFE Investigation Fields
    @IsString()
    @IsOptional()
    fraudType?: string;

    @IsNumber()
    @IsOptional()
    financialImpact?: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    disciplinaryAction?: string;

    @IsOptional()
    involvedParties?: string;

    // İnceleme/Soruşturma Rapor Metinleri
    @IsString()
    @IsOptional()
    investigationSummary?: string;

    @IsString()
    @IsOptional()
    investigationFindings?: string;

    @IsString()
    @IsOptional()
    investigationOpinion?: string;
}

/**
 * Denetim Güncelleme DTO'su – Tüm alanlar opsiyonel
 */
export class UpdateAuditDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsEnum(AuditStatus, { message: 'Geçersiz denetim statüsü. Lütfen geçerli bir statü giriniz.' })
    @IsOptional()
    status?: AuditStatus;

    @IsString()
    @IsOptional()
    statusJustification?: string;

    @IsString()
    @IsOptional()
    startDate?: string;

    @IsString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    supervisor?: string;

    @IsString()
    @IsOptional()
    supervisorId?: string;

    @IsOptional()
    team?: any;

    @IsString()
    @IsOptional()
    scope?: string;

    @IsString()
    @IsOptional()
    objective?: string;

    @IsString()
    @IsOptional()
    methodology?: string;

    @IsString()
    @IsOptional()
    criteria?: string;

    @IsString()
    @IsOptional()
    period?: string;

    @IsString()
    @IsOptional()
    riskLevel?: string;

    @IsString()
    @IsOptional()
    opinion?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    progress?: number;

    @IsString()
    @IsOptional()
    unitId?: string;

    @IsString()
    @IsOptional()
    auditableUnitId?: string;

    @IsString()
    @IsOptional()
    plannedStartDate?: string;

    @IsString()
    @IsOptional()
    plannedEndDate?: string;

    @IsString()
    @IsOptional()
    actualStartDate?: string;

    @IsString()
    @IsOptional()
    actualEndDate?: string;

    @IsOptional()
    workpapers?: any;

    // ACFE Investigation Fields
    @IsString()
    @IsOptional()
    fraudType?: string;

    @IsNumber()
    @IsOptional()
    financialImpact?: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    disciplinaryAction?: string;

    @IsOptional()
    involvedParties?: string;

    // İnceleme/Soruşturma Rapor Metinleri
    @IsString()
    @IsOptional()
    investigationSummary?: string;

    @IsString()
    @IsOptional()
    investigationFindings?: string;

    @IsString()
    @IsOptional()
    investigationOpinion?: string;
}
