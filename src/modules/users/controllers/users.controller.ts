import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { UsersService } from '../services/users.service';
import { CreateUserRequestDto } from '../dtos/requests/create-user.request.dto';
import { UpdateUserRequestDto } from '../dtos/requests/update-user.request.dto';
import { UpdateUserStatusRequestDto } from '../dtos/requests/update-user-status.request.dto';
import { UserResponseDto } from '../dtos/responses/user.response.dto';
import { PaginatedUsersResponseDto } from '../dtos/responses/paginated-users.response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  create(@Body() createUserDto: CreateUserRequestDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get paginated users' })
  @ApiResponse({ status: 200, type: PaginatedUsersResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll(page, limit, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserRequestDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusRequestDto,
  ) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }
}
