// src/modules/users/dto/create-user.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

class AddressDTO {
  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  zip?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDTO)
  addresses?: AddressDTO[];

  @IsOptional()
  isVerified?: boolean;
}
