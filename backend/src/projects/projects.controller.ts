import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ProjectMemberGuard } from '../auth/guards/project-member.guard';
import { ProjectOwnerGuard } from '../auth/guards/project-owner.guard';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';
import { ProjectRoles } from '../auth/decorators/project-roles.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @User() user: any) {
    return this.projectsService.create(createProjectDto, user.userId);
  }

  @Get()
  findAll(@User() user: any) {
    return this.projectsService.findAll(user.userId);
  }

  @Get(':id')
  @UseGuards(ProjectMemberGuard) // Only project members can view
  async findOne(@Param('id') id: string) {
    try {
        return await this.projectsService.findOne(id);
    } catch (error) {
        console.error("Error in GET /projects/:id", error);
        throw error;
    }
  }

  @Patch(':id')
  @UseGuards(ProjectRoleGuard) // Only OWNER/EDITOR can update
  @ProjectRoles('OWNER', 'EDITOR')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @User() user: any) {
    return this.projectsService.update(id, updateProjectDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(ProjectOwnerGuard) // Only OWNER can delete
  remove(@Param('id') id: string, @User() user: any) {
    return this.projectsService.remove(id, user.userId);
  }

  // ==================== MEMBER MANAGEMENT ====================

  @Post(':id/members')
  @UseGuards(ProjectOwnerGuard) // Only OWNER can add members
  addMember(@Param('id') projectId: string, @Body() addMemberDto: AddMemberDto, @User() user: any) {
    return this.projectsService.addMember(projectId, addMemberDto, user.userId);
  }

  @Get(':id/members')
  @UseGuards(ProjectMemberGuard) // Only project members can view members
  getMembers(@Param('id') projectId: string) {
    return this.projectsService.getMembers(projectId);
  }

  @Patch(':id/members/:userId')
  @UseGuards(ProjectOwnerGuard) // Only OWNER can update member roles
  updateMemberRole(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @User() user: any,
  ) {
    return this.projectsService.updateMemberRole(projectId, userId, updateMemberRoleDto, user.userId);
  }

  @Delete(':id/members/:userId')
  @UseGuards(ProjectOwnerGuard) // Only OWNER can remove members
  removeMember(@Param('id') projectId: string, @Param('userId') userId: string, @User() user: any) {
    return this.projectsService.removeMember(projectId, userId, user.userId);
  }

  @Post(':id/invite')
  @UseGuards(ProjectOwnerGuard)
  inviteMember(
    @Param('id') projectId: string, 
    @Body() inviteDto: InviteMemberDto, 
    @User() user: any
  ) {
      return this.projectsService.inviteMember(projectId, inviteDto.email, inviteDto.role, user.userId);
  }
}
