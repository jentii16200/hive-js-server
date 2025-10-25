// src/database/schema/Users.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { randomUUID } from 'crypto';

export type UserDocument = HydratedDocument<Users>;

@Schema({ timestamps: true, collection: 'users' })
export class Users {
  @Prop({ default: randomUUID, unique: true })
  userId: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({
    default:
      'https://www.dropbox.com/scl/fi/d7ioe7bosz1c5fiu2kmor/blank_avatar.svg?rlkey=d3ek8qx9pxle8alp09xgfs1zv&st=255oxm4b&raw=1',
  })
  avatar: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({
    type: [
      {
        street: { type: String },
        city: { type: String },
        province: { type: String },
        zip: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  addresses: {
    street?: string;
    city?: string;
    province?: string;
    zip?: string;
    isDefault?: boolean;
  }[];
}

export const UsersSchema = SchemaFactory.createForClass(Users);

// ✅ Add virtual id so frontend always gets `id` instead of just `_id`
UsersSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id; // ✅ no TS error
  },
});
