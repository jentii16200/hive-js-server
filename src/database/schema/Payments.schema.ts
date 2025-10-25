// src/database/schema/Payments.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { randomInt } from 'crypto';

export type PaymentsDocument = HydratedDocument<Payments>;

export type PaymentMethod = 'paymongo_gcash' | 'cod';

export type PaymentStatus =
  | 'pending'
  | 'requires_action'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

@Schema({ timestamps: true, collection: 'payments' })
export class Payments {
  @Prop({ default: () => randomInt(100000, 999999), unique: true })
  paymentId: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orders',
    required: true,
    index: true,
  })
  orderId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    index: true,
  })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({
    required: true,
    enum: ['paymongo_gcash', 'cod'],
    default: 'paymongo_gcash',
    index: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({ unique: true, sparse: true })
  transactionId?: string;

  @Prop({
    required: true,
    enum: [
      'pending',
      'requires_action',
      'processing',
      'completed',
      'failed',
      'refunded',
    ],
    default: 'pending',
    index: true,
  })
  status: PaymentStatus;

  @Prop()
  currency?: string;

  @Prop()
  clientSecret?: string;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  providerResponseRaw?: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  paidAt?: Date;
}

export const PaymentsSchema = SchemaFactory.createForClass(Payments);

PaymentsSchema.index({ userId: 1, createdAt: -1 });
PaymentsSchema.index({ orderId: 1, status: 1 });
