import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  UsersRepository,
  UserWithRole,
} from '../repositories/users.repository';
import { CreateUserRequestDto } from '../dtos/requests/create-user.request.dto';
import { UpdateUserRequestDto } from '../dtos/requests/update-user.request.dto';
import { UpdateUserStatusRequestDto } from '../dtos/requests/update-user-status.request.dto';
import { UserResponseDto } from '../dtos/responses/user.response.dto';
import { PaginatedUsersResponseDto } from '../dtos/responses/paginated-users.response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private mapToResponse(user: UserWithRole): UserResponseDto {
    const {
      password: _password,
      roleId: _roleId,
      ...userWithoutSensitiveFields
    } = user;
    return new UserResponseDto({
      ...userWithoutSensitiveFields,
      role: user.role,
    });
  }

  async create(data: CreateUserRequestDto): Promise<UserResponseDto> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const createData: Prisma.UserCreateInput = {
      email: data.email,
      password: passwordHash,
      name: data.name,
      lastname: data.lastname,
      phone: data.phone,
      isActive: data.isActive ?? true,
    };

    if (data.roleId) {
      createData.role = { connect: { id: data.roleId } };
    }

    try {
      const user = await this.usersRepository.create(createData);
      return this.mapToResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email ya registrado');
      }
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: string,
  ): Promise<PaginatedUsersResponseDto> {
    const skip = (page - 1) * limit;
    const [users, totalItems] = await this.usersRepository.findAll(
      skip,
      limit,
      role,
    );

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      data: users.map((u) => this.mapToResponse(u)),
      meta: {
        firstPage: 1,
        lastPage: totalPages,
        currentPage: page,
        totalPages,
        totalItems,
      },
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return this.mapToResponse(user);
  }

  async update(
    id: string,
    data: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    await this.findOne(id); // Ensure user exists

    const updateData: Prisma.UserUpdateInput = {
      email: data.email,
      name: data.name,
      lastname: data.lastname,
      phone: data.phone,
      isActive: data.isActive,
    };

    if (data.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(data.password, saltRounds);
    }

    if (data.roleId !== undefined) {
      updateData.role = data.roleId
        ? { connect: { id: data.roleId } }
        : { disconnect: true };
    }

    try {
      const user = await this.usersRepository.update(id, updateData);
      return this.mapToResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email ya registrado');
      }
      throw error;
    }
  }

  async updateStatus(
    id: string,
    data: UpdateUserStatusRequestDto,
  ): Promise<UserResponseDto> {
    await this.findOne(id); // Ensure user exists

    const user = await this.usersRepository.update(id, {
      isActive: data.isActive,
    });
    return this.mapToResponse(user);
  }
}
