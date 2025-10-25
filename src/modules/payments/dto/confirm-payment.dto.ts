// src/modules/payments/dto/confirm-payment.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsIn(['paymongo_gcash', 'cod'])
  paymentMethod: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
