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
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@ApiTags('Trucks')
@ApiBearerAuth()
@Controller('trucks')
@UseGuards(JwtAuthGuard)
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  /**
   * Create a new truck
   * POST /trucks
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new truck',
    description: 'Creates a new truck with IMAT and maximum load capacity',
  })
  @ApiResponse({
    status: 201,
    description: 'Truck successfully created',
    schema: {
      example: {
        id: 1,
        imat: 'AA-123-BB',
        maxLoad: 1500,
        createdAt: '2026-05-04T10:30:00.000Z',
        updatedAt: '2026-05-04T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or IMAT already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 409,
    description: 'IMAT already used by another truck',
  })
  async create(@Body() createTruckDto: CreateTruckDto) {
    return this.trucksService.create(createTruckDto);
  }

  /**
   * Retrieve all trucks
   * GET /trucks
   */
  @Get()
  @ApiOperation({
    summary: 'Retrieve all trucks',
    description: 'Gets all trucks with their assigned commands summary',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all trucks',
    schema: {
      example: [
        {
          id: 1,
          imat: 'AA-123-BB',
          maxLoad: 1500,
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
    return this.trucksService.findAll();
  }

  /**
   * Retrieve a truck by id
   * GET /trucks/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get truck by ID',
    description:
      'Retrieves detailed truck information including all assigned commands and items',
  })
  @ApiParam({
    name: 'id',
    description: 'Truck ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Truck found',
    schema: {
      example: {
        id: 1,
        imat: 'AA-123-BB',
        maxLoad: 1500,
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
                  weight: 220.5,
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
    description: 'Truck not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.trucksService.findOne(id);
  }

  /**
   * Search truck by IMAT
   * GET /trucks/search/:imat
   */
  @Get('search/:imat')
  @ApiOperation({
    summary: 'Search truck by IMAT',
    description: 'Searches for a truck by its license plate (IMAT)',
  })
  @ApiParam({
    name: 'imat',
    description: 'Truck IMAT (license plate)',
    example: 'AA-123-BB',
  })
  @ApiResponse({
    status: 200,
    description: 'Truck found',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findByImat(@Param('imat') imat: string) {
    return this.trucksService.findByImat(imat);
  }

  /**
   * Get commands count for a truck
   * GET /trucks/:id/commands-count
   */
  @Get(':id/commands-count')
  @ApiOperation({
    summary: 'Get commands count',
    description: 'Returns the total number of commands assigned to a truck',
  })
  @ApiParam({
    name: 'id',
    description: 'Truck ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Commands count',
    schema: {
      example: {
        truckId: 1,
        commandsCount: 5,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Truck not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async countCommands(@Param('id', ParseIntPipe) id: number) {
    const count = await this.trucksService.countCommands(id);
    return { truckId: id, commandsCount: count };
  }

  /**
   * Get total weight of current cargo
   * GET /trucks/:id/total-weight
   */
  @Get(':id/total-weight')
  @ApiOperation({
    summary: 'Get total weight',
    description:
      'Returns the total weight of items being transported in WAITING or PENDING commands',
  })
  @ApiParam({
    name: 'id',
    description: 'Truck ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Total weight in kg',
    schema: {
      example: {
        truckId: 1,
        totalWeight: 550.5,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Truck not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getTotalWeight(@Param('id', ParseIntPipe) id: number) {
    const totalWeight = await this.trucksService.getTotalWeight(id);
    return { truckId: id, totalWeight };
  }

  /**
   * Check truck capacity
   * GET /trucks/:id/capacity
   */
  @Get(':id/capacity')
  @ApiOperation({
    summary: 'Check truck capacity',
    description:
      'Checks if truck can carry additional weight or returns current capacity status',
  })
  @ApiParam({
    name: 'id',
    description: 'Truck ID',
    example: 1,
  })
  @ApiQuery({
    name: 'additionalWeight',
    description: 'Additional weight to check in kg',
    example: 100,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Capacity information',
    schema: {
      example: {
        truckId: 1,
        maxCapacity: 1500,
        currentWeight: 550.5,
        additionalWeight: 100,
        totalWeight: 650.5,
        availableCapacity: 949.5,
        canCarry: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Truck not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async checkCapacity(
    @Param('id', ParseIntPipe) id: number,
    @Query('additionalWeight') additionalWeight: string = '0',
  ) {
    const weight = parseFloat(additionalWeight) || 0;
    return this.trucksService.checkCapacity(id, weight);
  }

  /**
   * Get truck statistics
   * GET /trucks/:id/statistics
   */
  @Get(':id/statistics')
  @ApiOperation({
    summary: 'Get truck statistics',
    description:
      'Returns comprehensive statistics about truck usage including commands, weight, and utilization',
  })
  @ApiParam({
    name: 'id',
    description: 'Truck ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Truck statistics',
    schema: {
      example: {
        truckId: 1,
        imat: 'AA-123-BB',
        maxCapacity: 1500,
        totalCommands: 10,
        statusCount: {
          WAITING: 2,
          PENDING: 3,
          DELIVERED: 4,
          CANCELLED: 1,
        },
        totalWeight: 550.5,
        totalItems: 50,
        totalValue: 549.5,
        averageCommandValue: 54.95,
        utilizationPercentage: 36.7,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Truck not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.trucksService.getStatistics(id);
  }

  /**
   * Get available trucks
   * GET /trucks/available/list
   */
  @Get('available/list')
  @ApiOperation({
    summary: 'Get available trucks',
    description:
      'Returns list of trucks not currently assigned to any WAITING or PENDING commands',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available trucks',
    schema: {
      example: [
        {
          id: 1,
          imat: 'AA-123-BB',
          maxLoad: 1500,
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
  async findAvailable() {
    return this.trucksService.findAvailable();
  }

  /**
   * Get most utilized trucks
   * GET /trucks/most-utilized
   */
  @Get('most-utilized/list')
  @ApiOperation({
    summary: 'Get most utilized trucks',
    description: 'Returns trucks sorted by current utilization percentage',
  })
  @ApiResponse({
    status: 200,
    description: 'List of trucks sorted by utilization',
    schema: {
      example: [
        {
          id: 1,
          imat: 'AA-123-BB',
          maxLoad: 1500,
          currentWeight: 1100,
          utilizationPercentage: 73.33,
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
  async findMostUtilized() {
    return this.trucksService.findMostUtilized();
  }

  /**
   * Update an existing truck
   * PATCH /trucks/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update truck',
    description: 'Updates an existing truck with partial information',
  })
  @ApiParam({
    name: 'id',
    description: 'Truck ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Truck successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'IMAT already used by another truck',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTruckDto: UpdateTruckDto,
  ) {
    return this.trucksService.update(id, updateTruckDto);
  }

  /**
   * Delete a truck
   * DELETE /trucks/:id
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete truck',
    description: 'Deletes a truck from the database',
  })
  @ApiParam({
    name: 'id',
    description: 'Truck ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Truck successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.trucksService.remove(id);
  }
}
