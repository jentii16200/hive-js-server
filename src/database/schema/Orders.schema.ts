// src/database/schema/Orders.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Orders>;

@Schema()
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Designs', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;

  @Prop()
  size?: string;

  @Prop()
  color?: string;

  @Prop({ type: Types.ObjectId })
  variationId?: Types.ObjectId;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema()
class ShippingAddress {
  @Prop({ required: true }) street: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) province: string;
  @Prop({ required: true }) region: string;
  @Prop({ required: true }) zip: string;
  @Prop({ required: true }) fullName: string;
  @Prop({ required: true }) phone: string;
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true, collection: 'orders' })
export class Orders {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({
    required: true,
    enum: [
      'pending',
      'awaiting_payment',
      'awaiting_cod',
      'paid',
      'shipped',
      'delivered',
      'cancelled',
    ],
    default: 'pending',
  })
  status: string;

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({
    required: true,
    enum: ['cod', 'paymongo_gcash'],
  })
  paymentMethod: string;

  @Prop({ type: Types.ObjectId, ref: 'Payments' })
  paymentId?: Types.ObjectId;

  @Prop() orderedAt?: Date;
  @Prop() paidAt?: Date;
  @Prop() shippedAt?: Date;
  @Prop() deliveredAt?: Date;
  @Prop() cancelledAt?: Date;
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);
