import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';
import {
  CreateContactMessageDto,
  CreateSupportTicketDto,
  CreateSupportReplyDto,
  UpdateTicketStatusDto,
  ContactQueryDto,
  TicketQueryDto,
} from './support.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { PrismaService } from '@database/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly prisma: PrismaService,
  ) {}

  // Covers admins and the 'staff' role, which runs the support desk in the
  // staff portal but isn't an admin. Used to decide whether a caller sees
  // the full ticket queue (staff) vs. only their own tickets (customer),
  // and whether their replies are marked as staff replies.
  private isStaffMember(user: JwtPayload): boolean {
    return !!user.roles?.some((r) =>
      ['super_admin', 'admin', 'staff'].includes(r),
    );
  }

  private async resolveCustomerId(userId: string): Promise<string | null> {
    let profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        profile = await this.prisma.customerProfile.create({
          data: { userId: user.id },
        });
      }
    }
    return profile?.id ?? null;
  }

  @Post('contact')
  @ApiOperation({ summary: 'Create contact message (public)' })
  async createContact(@Body() dto: CreateContactMessageDto) {
    return ResponseBuilder.created(
      await this.supportService.createContact(dto),
      'Contact message submitted',
    );
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contact messages (admin)' })
  async findContacts(@Query() query: ContactQueryDto) {
    return ResponseBuilder.success(
      await this.supportService.findContacts(query),
    );
  }

  @Patch('contacts/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contact status (admin)' })
  async updateContactStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return ResponseBuilder.success(
      await this.supportService.updateContactStatus(
        id,
        dto.status ?? 'NEW',
        dto.assignedTo,
      ),
      'Contact status updated',
    );
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tickets (admin: all, customer: own)' })
  async findTickets(
    @Query() query: TicketQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!this.isStaffMember(user)) {
      const customerId = await this.resolveCustomerId(user.sub);
      if (!customerId) return ResponseBuilder.success([]);
      query.customerId = customerId;
    }
    return ResponseBuilder.success(
      await this.supportService.findTickets(query),
    );
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findTicketById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const ticket = await this.supportService.findTicketById(id);
    if (!this.isStaffMember(user)) {
      const customerId = await this.resolveCustomerId(user.sub);
      if (!customerId || (ticket as any).customerId !== customerId) {
        throw new ForbiddenException('Ticket not found');
      }
    }
    return ResponseBuilder.success(ticket);
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create support ticket' })
  async createTicket(
    @Body() dto: CreateSupportTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const customerId = await this.resolveCustomerId(user.sub);
    if (!customerId) throw new ForbiddenException('Customer profile not found');
    return ResponseBuilder.created(
      await this.supportService.createTicket(customerId, dto),
      'Ticket created',
    );
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status (admin or support-desk staff)' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return ResponseBuilder.success(
      await this.supportService.updateTicketStatus(id, dto),
      'Ticket status updated',
    );
  }

  @Post('tickets/:id/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add reply to ticket' })
  async addReply(
    @Param('id') id: string,
    @Body() dto: CreateSupportReplyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.supportService.addReply(id, dto, this.isStaffMember(user)),
      'Reply added',
    );
  }
}
