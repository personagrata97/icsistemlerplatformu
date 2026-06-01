import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
    @IsString({ message: 'Yenileme jetonu metin olmalıdır.' })
    @IsNotEmpty({ message: 'Yenileme jetonu boş bırakılamaz.' })
    refresh_token: string;
}
