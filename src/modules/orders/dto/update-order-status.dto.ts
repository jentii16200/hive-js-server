// src/modules/orders/dto/update-order-status.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from './create-order.dto';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
