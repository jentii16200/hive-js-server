import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  fullName: string;
    
  @IsEmail()
  @IsOptional()
  email: string;
    
  @IsString()
  @IsOptional()
  password: string;
    
  @IsString()
  @IsOptional()
  role: string;
    
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDTO)
  addresses?: AddressDTO[];
    
  @IsOptional()
  isVerified?: boolean;
}
