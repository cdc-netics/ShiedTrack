import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CustomRoleService } from './custom-role.service';
import { CreateCustomRoleDto, UpdateCustomRoleDto } from './dto/custom-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('api/custom-roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomRoleController {
  constructor(private readonly customRoleService: CustomRoleService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  async create(@Body() dto: CreateCustomRoleDto, @Request() req: any) {
    return this.customRoleService.create(dto, req.user);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.customRoleService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.customRoleService.findOne(id, req.user);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCustomRoleDto, @Request() req: any) {
    return this.customRoleService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.customRoleService.remove(id, req.user);
    return { message: 'Rol eliminado exitosamente' };
  }
}
