import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RESPONSE } from 'src/utils/response.util';
import { Designs } from 'src/database/schema/Designs.schema';

@Injectable()
export class DesignsService {
  constructor(@InjectModel(Designs.name) private designModel: Model<Designs>) {}

  async createDesign(createDesignDto: CreateDesignDto) {
    try {
      console.debug(
        '🛠 Creating design with DTO:',
        JSON.stringify(createDesignDto),
      );
      const totalStock =
        createDesignDto.variations?.reduce((sum, variation) => {
          return (
            sum +
            variation.sizes.reduce((sizeSum, s) => sizeSum + (s.stock || 0), 0)
          );
        }, 0) || 0;

      console.debug('Calculated totalStock:', totalStock);

      const newDesign = new this.designModel({
        ...createDesignDto,
        totalStock,
        soldOut: totalStock <= 0,
      });

      const response = await newDesign.save();
      console.debug('Mongo save response:', response);

      if (!response) {
        return RESPONSE(HttpStatus.BAD_REQUEST, {}, 'Design not created!');
      }
      return RESPONSE(
        HttpStatus.CREATED,
        response,
        'Design created successfully!',
      );
    } catch (error: any) {
      console.error('❌ Error creating design:', error.message);
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Internal server error: ' + error.message,
      );
    }
  }

  async findAllDesigns() {
    try {
      console.debug('🔍 Fetching all designs...');
      const response = await this.designModel.find();
      console.debug('Mongo find() result count:', response.length);

      if (response.length === 0) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'No designs found!');
      }
      return RESPONSE(HttpStatus.OK, response, 'Designs fetched successfully!');
    } catch (error: any) {
      console.error('❌ Error fetching designs:', error.message);
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching designs: ' + error.message,
      );
    }
  }

  async findPublishedDesigns() {
    try {
      console.debug('🔍 Fetching published designs...');
      const response = await this.designModel.find({ status: 'published' });
      console.debug(
        'Mongo find({status:published}) result count:',
        response.length,
      );

      if (response.length === 0) {
        return RESPONSE(
          HttpStatus.NOT_FOUND,
          [],
          'No published designs found!',
        );
      }
      return RESPONSE(
        HttpStatus.OK,
        response,
        'Published designs fetched successfully!',
      );
    } catch (error: any) {
      console.error('❌ Error fetching published designs:', error.message);
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching published designs: ' + error.message,
      );
    }
  }

  async findOneDesign(id: string) {
    try {
      console.debug(`🔍 Looking up design with designId=${id}`);
      const design = await this.designModel.findOne({ _id: id });
      console.debug('Mongo findOne result:', design);

      if (!design) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'Design not found!');
      }
      return RESPONSE(HttpStatus.OK, design, 'Design fetched successfully!');
    } catch (error: any) {
      console.error('❌ Error fetching design:', error.message);
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching design: ' + error.message,
      );
    }
  }

  async updateDesign(id: string, updateDesignDto: UpdateDesignDto) {
    try {
      console.debug(
        `🛠 Updating designId=${id} with DTO:`,
        JSON.stringify(updateDesignDto),
      );
      const totalStock =
        updateDesignDto.variations?.reduce((sum, variation) => {
          return (
            sum +
            variation.sizes.reduce((sizeSum, s) => sizeSum + (s.stock || 0), 0)
          );
        }, 0) || 0;

      console.debug('Recalculated totalStock:', totalStock);

      const design = await this.designModel.findOneAndUpdate(
        { _id: id },
        {
          ...updateDesignDto,
          totalStock,
          soldOut: totalStock <= 0,
        },
        { new: true },
      );

      console.debug('Mongo findOneAndUpdate result:', design);

      if (!design) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'Design not found!');
      }
      return RESPONSE(HttpStatus.OK, design, 'Design updated successfully!');
    } catch (error: any) {
      console.error('❌ Error updating design:', error.message);
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error updating design: ' + error.message,
      );
    }
  }

  async removeDesign(id: string) {
    try {
      console.debug(`🗑 Removing designId=${id}`);
      const response = await this.designModel.deleteOne({ _id: id });
      console.debug('Mongo deleteOne result:', response);

      if (response.deletedCount === 0) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'Design not found!');
      }
      return RESPONSE(HttpStatus.OK, {}, 'Design deleted successfully!');
    } catch (error: any) {
      console.error('❌ Error deleting design:', error.message);
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error deleting design: ' + error.message,
      );
    }
  }
}
