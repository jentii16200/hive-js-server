import { IsMongoId, IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateAuditDto {
  @IsMongoId()
  @IsNotEmpty()
  adminId: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsMongoId()
  @IsNotEmpty()
  targetId: string;

  @IsDateString()
  @IsOptional()
  timestamp?: Date;

  @IsString()
  @IsOptional()
  details?: string;
}
