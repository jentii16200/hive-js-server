import { Module } from '@nestjs/common';
import { DesignsService } from './designs.service';
import { DesignsController } from './designs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DesignsSchema, Designs } from 'src/database/schema/Designs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Designs.name, schema: DesignsSchema }]),
  ],
  controllers: [DesignsController],
  providers: [DesignsService],
})
export class DesignsModule {}
