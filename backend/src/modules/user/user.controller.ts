import { Body, Controller, Param, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { AssignVisibleProjectsDto } from './assign-visible-projects.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put(':id/visible-projects')
  async assignVisibleProjects(
    @Param('id') id: string,
    @Body() dto: AssignVisibleProjectsDto,
  ) {
    return this.userService.assignVisibleProjects(
      id,
      dto.visibleProjectIds,
    );
  }
}