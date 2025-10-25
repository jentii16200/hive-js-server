// src/database/schema/Designs.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { randomInt } from 'crypto';

export type DesignDocument = HydratedDocument<Designs>;

export enum DesignStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum DesignCategory {
  SHIRT = 'shirt',
  SHORTS = 'shorts',
  HOODIE = 'hoodie',
}

@Schema()
export class SizeVariation {
  @Prop({ required: true })
  size: string;

  @Prop({ required: true, default: 0 })
  stock: number;
}

export const SizeVariationSchema = SchemaFactory.createForClass(SizeVariation);

@Schema()
export class ColorVariation {
  @Prop({ required: true })
  color: string;

  @Prop({ type: [SizeVariationSchema], default: [] })
  sizes: SizeVariation[];
}

export const ColorVariationSchema =
  SchemaFactory.createForClass(ColorVariation);

@Schema({ timestamps: true, collection: 'designs' })
export class Designs {
  @Prop({ default: () => randomInt(100000, 999999), unique: true })
  designId: number;

  @Prop({ type: String, required: true, unique: true })
  designName: string;

  @Prop({ type: [String], required: true })
  imageUrl: string[];

  @Prop({ type: String, enum: DesignCategory, required: true })
  category: DesignCategory;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: [ColorVariationSchema], default: [] })
  variations: ColorVariation[];

  @Prop({ type: Number, default: 0 })
  totalStock: number;

  @Prop({ type: Boolean, default: false })
  isBestSeller: boolean;

  @Prop({ type: Boolean, default: false })
  soldOut: boolean;

  @Prop({ type: String, enum: DesignStatus, default: DesignStatus.DRAFT })
  status: DesignStatus;
}

export const DesignsSchema = SchemaFactory.createForClass(Designs);

DesignsSchema.pre('save', function (next) {
  const totalStock = this.variations.reduce((sum: number, variation: any) => {
    return (
      sum +
      variation.sizes.reduce(
        (sizeSum: number, s: any) => sizeSum + (s.stock || 0),
        0,
      )
    );
  }, 0);
  this.soldOut = totalStock <= 0;
  next();
});
