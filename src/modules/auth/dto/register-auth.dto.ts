// src/modules/auth/dto/register-auth.dto.ts
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterAuthDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}
