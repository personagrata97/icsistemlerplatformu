import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsString({ message: 'Kullanıcı adı metin olmalıdır.' })
    @IsNotEmpty({ message: 'Kullanıcı adı boş bırakılamaz.' })
    username: string;

    @IsString({ message: 'Şifre metin olmalıdır.' })
    @IsNotEmpty({ message: 'Şifre boş bırakılamaz.' })
    password: string;
}
