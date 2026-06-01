import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

/**
 * Bulgu Oluşturma DTO'su
 */
export class CreateFindingDto {
    @IsString()
    @IsNotEmpty({ message: 'Denetim ID zorunludur.' })
    auditId: string;

    @IsString()
    @IsNotEmpty({ message: 'Bulgu başlığı zorunludur.' })
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    risk?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    rootCause?: string;

    @IsString()
    @IsOptional()
    recommendation?: string;

    @IsString()
    @IsOptional()
    actionPlan?: string;

    @IsString()
    @IsOptional()
    dueDate?: string;

    @IsString()
    @IsOptional()
    assignedUserId?: string;

    @IsString()
    @IsOptional()
    evidence?: string;

    @IsString()
    @IsOptional()
    controlId?: string;
}

/**
 * Bulgu Güncelleme DTO'su – Tüm alanlar opsiyonel
 */
export class UpdateFindingDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    risk?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    rootCause?: string;

    @IsString()
    @IsOptional()
    recommendation?: string;

    @IsString()
    @IsOptional()
    actionPlan?: string;

    @IsString()
    @IsOptional()
    dueDate?: string;

    @IsString()
    @IsOptional()
    assignedUserId?: string;

    @IsString()
    @IsOptional()
    evidence?: string;

    @IsString()
    @IsOptional()
    response?: string;

    @IsString()
    @IsOptional()
    responseDate?: string;

    @IsString()
    @IsOptional()
    verificationNote?: string;
}
