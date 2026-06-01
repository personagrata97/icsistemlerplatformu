import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

/**
 * Denetim Süresi Uzatma Talebi DTO'su
 * (Denetimin kendisi için – bulgu süre uzatması ayrı modülde)
 */
export class CreateAuditExtensionDto {
    @IsString()
    @IsNotEmpty({ message: 'Denetim ID zorunludur.' })
    auditId: string;

    @IsString()
    @IsNotEmpty({ message: 'Mevcut bitiş tarihi zorunludur.' })
    currentEndDate: string;

    @IsString()
    @IsNotEmpty({ message: 'Talep edilen yeni bitiş tarihi zorunludur.' })
    requestedEndDate: string;

    @IsString()
    @IsNotEmpty({ message: 'Uzatma gerekçesi zorunludur.' })
    reason: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

/**
 * Denetim Süresi Uzatma Talep Cevabı DTO'su
 */
export class HandleAuditExtensionDto {
    @IsString({ message: 'Durum metin olmalıdır.' })
    @IsNotEmpty({ message: 'Uzatma talep durumu zorunludur.' })
    status: 'Onaylandı' | 'Reddedildi';

    @IsString()
    @IsOptional()
    notes?: string;
}
