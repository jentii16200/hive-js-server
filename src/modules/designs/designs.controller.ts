import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Controller('designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Post('create-design')
  create(@Body() createDesignDto: CreateDesignDto) {
    console.debug('📥 POST /designs/create-design called');
    console.debug('Payload:', JSON.stringify(createDesignDto));
    return this.designsService.createDesign(createDesignDto);
  }

  @Get('get-all-designs')
  findAll() {
    console.debug('📥 GET /designs/get-all-designs called');
    return this.designsService.findAllDesigns();
  }

  @Get('published')
  findPublished() {
    console.debug('📥 GET /designs/published called');
    return this.designsService.findPublishedDesigns();
  }

  // 🔑 Use _id (string) instead of casting to Number
  @Get('get-design/:id')
  async findOne(@Param('id') id: string) {
    console.debug(`📥 GET /designs/get-design/${id} called`);
    const result = await this.designsService.findOneDesign(id);
    console.debug(`📤 Returning design: ${JSON.stringify(result)}`);
    return result;
  }

  @Put('update-design/:id')
  update(@Param('id') id: string, @Body() updateDesignDto: UpdateDesignDto) {
    console.debug(`📥 PUT /designs/update-design/${id} called`);
    console.debug('Payload:', JSON.stringify(updateDesignDto));
    return this.designsService.updateDesign(id, updateDesignDto);
  }

  @Delete('delete-design/:id')
  remove(@Param('id') id: string) {
    console.debug(`📥 DELETE /designs/delete-design/${id} called`);
    return this.designsService.removeDesign(id);
  }
}