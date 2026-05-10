import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandsService } from './commands.service';
import { CreateCommandDto } from './dto/create-command.dto';
import { UpdateCommandDto } from './dto/update-command.dto';
import { CommandStatus } from './enums/command-status.enum';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@Controller('commands')
@UseGuards(JwtAuthGuard)
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  /**
   * Create a new command
   * POST /commands
   */
  @Post()
  async create(@Body() createCommandDto: CreateCommandDto) {
    return this.commandsService.create(createCommandDto);
  }

  /**
   * Retrieve all commands with optional filters
   * GET /commands
   * Query params: ?status=WAITING&userId=1
   */
  @Get()
  async findAll(
    @Query('status') status?: CommandStatus,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
  ) {
    return this.commandsService.findAll(status, userId);
  }

  /**
   * Retrieve a command by id
   * GET /commands/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commandsService.findOne(id);
  }

  /**
   * Retrieve a command by reference
   * GET /commands/reference/:reference
   */
  @Get('reference/:reference')
  async findByReference(@Param('reference') reference: string) {
    return this.commandsService.findByReference(reference);
  }

  /**
   * Get commands by status
   * GET /commands/filter/status/:status
   */
  @Get('filter/status/:status')
  async findByStatus(@Param('status') status: CommandStatus) {
    return this.commandsService.findByStatus(status);
  }

  /**
   * Get commands by user
   * GET /commands/filter/user/:userId
   */
  @Get('filter/user/:userId')
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.commandsService.findByUser(userId);
  }

  /**
   * Get commands by client
   * GET /commands/filter/client/:clientId
   */
  @Get('filter/client/:clientId')
  async findByClient(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.commandsService.findByClient(clientId);
  }

  /**
   * Update an existing command
   * PATCH /commands/:id
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommandDto: UpdateCommandDto,
  ) {
    return this.commandsService.update(id, updateCommandDto);
  }

  /**
   * Update command status only
   * PATCH /commands/:id/status
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: CommandStatus,
  ) {
    return this.commandsService.updateStatus(id, status);
  }

  /**
   * Delete a command
   * DELETE /commands/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.commandsService.remove(id);
  }
}
