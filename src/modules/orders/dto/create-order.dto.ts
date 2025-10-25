// src/modules/orders/dto/create-order.dto.ts
import {
  IsMongoId,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  AWAITING_COD = 'awaiting_cod',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  COD = 'cod',
  GCASH = 'paymongo_gcash',
}

class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  price: number;

  @IsString()
  size?: string;

  @IsString()
  color?: string;

  @IsMongoId()
  @IsOptional()
  variationId?: string;
}

class ShippingAddressDto {
  @IsString() @IsNotEmpty() street: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() province: string;
  @IsString() @IsNotEmpty() region: string;
  @IsString() @IsNotEmpty() zip: string;
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsNotEmpty() phone: string;
}

export class CreateOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;
}
