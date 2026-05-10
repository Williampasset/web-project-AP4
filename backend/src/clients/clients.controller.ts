import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Create a new client
   * POST /clients
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new client',
    description: 'Creates a new client in the database',
  })
  @ApiResponse({
    status: 201,
    description: 'Client successfully created',
    schema: {
      example: {
        id: 1,
        name: 'Acme Corporation',
        address: '123 Business Street, Paris, 75000',
        email: 'contact@acme.com',
        phone: '+33123456789',
        createdAt: '2026-05-04T10:30:00.000Z',
        updatedAt: '2026-05-04T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  /**
   * Retrieve all clients
   * GET /clients
   */
  @Get()
  @ApiOperation({
    summary: 'Retrieve all clients',
    description: 'Gets all clients with their associated commands summary',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all clients',
    schema: {
      example: [
        {
          id: 1,
          name: 'Acme Corporation',
          address: '123 Business Street, Paris, 75000',
          email: 'contact@acme.com',
          phone: '+33123456789',
          commands: [
            {
              id: 1,
              reference: 'CMD-001',
              status: 'WAITING',
              commandDate: '2026-05-04T10:30:00.000Z',
            },
          ],
          createdAt: '2026-05-04T10:30:00.000Z',
          updatedAt: '2026-05-04T10:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll() {
    return this.clientsService.findAll();
  }

  /**
   * Retrieve a client by id
   * GET /clients/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get client by ID',
    description:
      'Retrieves detailed client information including all associated commands and items',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Client found',
    schema: {
      example: {
        id: 1,
        name: 'Acme Corporation',
        address: '123 Business Street, Paris, 75000',
        email: 'contact@acme.com',
        phone: '+33123456789',
        commands: [
          {
            id: 1,
            reference: 'CMD-001',
            status: 'WAITING',
            items: [
              {
                id: 1,
                quantity: 5,
                unitPrice: 10.99,
                article: {
                  id: 1,
                  reference: 'ART-001',
                  label: 'Product A',
                  price: 10.99,
                },
              },
            ],
          },
        ],
        createdAt: '2026-05-04T10:30:00.000Z',
        updatedAt: '2026-05-04T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  /**
   * Search clients by name
   * GET /clients/search/:name
   */
  @Get('search/:name')
  @ApiOperation({
    summary: 'Search client by name',
    description:
      'Searches for clients by name (case-insensitive partial match)',
  })
  @ApiParam({
    name: 'name',
    description: 'Client name or partial name',
    example: 'Acme',
  })
  @ApiResponse({
    status: 200,
    description: 'Client found',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findByName(@Param('name') name: string) {
    return this.clientsService.findByName(name);
  }

  /**
   * Get commands count for a client
   * GET /clients/:id/commands-count
   */
  @Get(':id/commands-count')
  @ApiOperation({
    summary: 'Get commands count',
    description: 'Returns the total number of commands for a specific client',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Commands count',
    schema: {
      example: {
        clientId: 1,
        commandsCount: 5,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async countCommands(@Param('id', ParseIntPipe) id: number) {
    const count = await this.clientsService.countCommands(id);
    return { clientId: id, commandsCount: count };
  }

  /**
   * Get total spent by a client
   * GET /clients/:id/total-spent
   */
  @Get(':id/total-spent')
  @ApiOperation({
    summary: 'Get total spent',
    description:
      'Returns the total amount spent by a client on delivered commands',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Total spent information',
    schema: {
      example: {
        clientId: 1,
        totalSpent: 549.5,
        deliveredCommandsCount: 5,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getTotalSpent(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.getTotalSpent(id);
  }

  /**
   * Get client statistics
   * GET /clients/:id/statistics
   */
  @Get(':id/statistics')
  @ApiOperation({
    summary: 'Get client statistics',
    description:
      'Returns comprehensive statistics about a client including command counts by status, total items, and average order value',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Client statistics',
    schema: {
      example: {
        clientId: 1,
        totalCommands: 10,
        statusCount: {
          WAITING: 2,
          PENDING: 3,
          DELIVERED: 4,
          CANCELLED: 1,
        },
        totalItems: 50,
        totalValue: 549.5,
        averageOrderValue: 54.95,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.getStatistics(id);
  }

  /**
   * Update an existing client
   * PATCH /clients/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update client',
    description: 'Updates an existing client with partial information',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Client successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  /**
   * Delete a client
   * DELETE /clients/:id
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete client',
    description: 'Deletes a client from the database',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Client successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id);
  }
}
