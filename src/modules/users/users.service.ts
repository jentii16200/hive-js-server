// src/modules/users/users.service.ts
import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RESPONSE } from 'src/utils/response.util';
import { Users } from '../../database/schema/Users.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(Users.name) private userModel: Model<Users>) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const userData: any = { ...createUserDto };
      const response = await this.userModel.create(userData);
      if (!response) {
        return RESPONSE(HttpStatus.BAD_REQUEST, {}, 'User not created!');
      }
      return response;
    } catch (error: any) {
      throw new Error('Internal server error: ' + error.message);
    }
  }

  async findAllUsers() {
    try {
      let users = await this.userModel.find();
      if (users.length === 0) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'No users found!');
      }
      return RESPONSE(HttpStatus.OK, users, 'Users fetched successfully!');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching users: ' + error.message,
      );
    }
  }

  async findOneUserRaw(id: string) {
    return this.userModel
      .findById(id)
      .select('_id fullName email role avatar isVerified')
      .exec();
  }

  async findOneUser(id: string) {
    try {
      const user = await this.findOneUserRaw(id);
      if (!user) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'User not found!');
      }
      return RESPONSE(HttpStatus.OK, user, 'User fetched successfully!');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching user: ' + error.message,
      );
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      const updateData: any = { ...updateUserDto };
      if (updateUserDto.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateUserDto.password, salt);
      }
      let updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (!updatedUser) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'User not found!');
      }
      return RESPONSE(HttpStatus.OK, updatedUser, 'User updated successfully!');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error updating user: ' + error.message,
      );
    }
  }

  async deleteUser(id: string) {
    try {
      let deletedUser = await this.userModel.findByIdAndDelete(id).exec();
      if (!deletedUser) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'User not found!');
      }
      return RESPONSE(HttpStatus.OK, {}, 'User deleted successfully!');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error deleting user: ' + error.message,
      );
    }
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  // async findByName(fullName: string) {
  //   return this.userModel.findOne({ fullName }).exec();
  // }

  async addAddress(userId: string, address: any) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'User not found!');
      }
      user.addresses.push(address);
      await user.save();
      return RESPONSE(HttpStatus.OK, user, 'Address added successfully!');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error adding address: ' + error.message,
      );
    }
  }

  async updateAddresses(userId: string, addresses: any[]) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'User not found!');
      }
      user.addresses = addresses;
      await user.save();
      return RESPONSE(HttpStatus.OK, user, 'Addresses updated successfully!');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error updating addresses: ' + error.message,
      );
    }
  }

  async removeAddress(userId: string, index: number) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'User not found!');
      }
      user.addresses.splice(index, 1);
      await user.save();
      return RESPONSE(HttpStatus.OK, user, 'Address removed successfully!');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error removing address: ' + error.message,
      );
    }
  }
}
