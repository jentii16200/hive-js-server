import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { Request as ExpressRequest } from 'express';

// Define the shape of JWT payload injected by JwtStrategy
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends ExpressRequest {
  user: JwtPayload;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create-user')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // ✅ Only admins can access this
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('get-all-users')
  findAll() {
    return this.usersService.findAllUsers();
  }

  // ✅ Admin OR the same user can access
  @UseGuards(JwtAuthGuard)
  @Get('get-user/:id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      throw new ForbiddenException('Not allowed');
    }
    return this.usersService.findOneUser(id);
  }

  // ✅ Admin OR the same user can update
  @UseGuards(JwtAuthGuard)
  @Put('update-user/:id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      throw new ForbiddenException('Not allowed');
    }
    return this.usersService.updateUser(id, updateUserDto);
  }

  // ✅ Only admins can delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('delete-user/:id')
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  // ✅ Only admins can see this
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-only')
  adminOnly() {
    return { message: 'Only admins can see this' };
  }

  @Post(':id/addresses')
  async addAddress(
    @Param('id') userId: string,
    @Body()
    address: {
      street: string;
      city: string;
      province: string;
      zip: string;
      isDefault?: boolean;
    },
  ) {
    return this.usersService.addAddress(userId, address);
  }

  @Put(':id/addresses')
  async updateAddresses(
    @Param('id') userId: string,
    @Body()
    addresses: {
      street: string;
      city: string;
      province: string;
      zip: string;
      isDefault?: boolean;
    }[],
  ) {
    return this.usersService.updateAddresses(userId, addresses);
  }

  @Delete(':id/addresses/:index')
  async removeAddress(
    @Param('id') userId: string,
    @Param('index') index: number,
  ) {
    return this.usersService.removeAddress(userId, index);
  }
}
