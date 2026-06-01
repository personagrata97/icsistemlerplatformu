import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';

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

    @IsString()
    @IsOptional()
    status?: string;

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
}
