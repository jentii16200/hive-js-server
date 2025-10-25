// src/modules/cart/dto/remove-cart.dto.ts
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class RemoveCartDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  designId: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  size?: string;
}
