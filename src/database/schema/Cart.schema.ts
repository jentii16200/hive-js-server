// src/modules/cart/cart.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: [
      {
        design: { type: Types.ObjectId, ref: 'Designs', required: true }, // ✅ plural
        quantity: { type: Number, default: 1 },
        color: { type: String }, // ✅ added
        size: { type: String }, // ✅ added
      },
    ],
    default: [],
  })
  items: {
    design: Types.ObjectId;
    quantity: number;
    color?: string;
    size?: string;
  }[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
