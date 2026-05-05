// backend/src/commands/controllers/command-preparation.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { CommandPreparationService } from './command-preparation.service';
import {
  MarkItemPickedDto,
  ValidateItemDto,
  MoveToLoadingZoneDto,
  SimulateRfidCheckDto,
  LoadItemToTruckDto,
  CompleteLoadingDto,
} from './dto/prepare-item.dto';

@ApiTags('Commands - Preparation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preparation')
export default class CommandPreparationController {
  constructor(private readonly preparationService: CommandPreparationService) {}

  /**
   * Mark a command item as picked from its location
   */
  @Post('items/pick')
  @ApiOperation({ summary: 'Mark item as picked' })
  @ApiResponse({
    status: 200,
    description: 'Item marked as picked',
  })
  async markItemPicked(@Body() dto: MarkItemPickedDto) {
    return this.preparationService.markItemPicked(dto);
  }

  /**
   * Validate a picked item (manual or QR code)
   */
  @Post('items/validate')
  @ApiOperation({ summary: 'Validate a picked item' })
  @ApiResponse({
    status: 200,
    description: 'Item validated',
  })
  async validateItem(@Body() dto: ValidateItemDto) {
    return this.preparationService.validateItem(dto);
  }

  /**
   * Move all prepared items to loading zone
   */
  @Post('loading-zone/move')
  @ApiOperation({ summary: 'Move items to loading zone' })
  @ApiResponse({
    status: 200,
    description: 'Items moved to loading zone',
  })
  async moveToLoadingZone(@Body() dto: MoveToLoadingZoneDto) {
    return this.preparationService.moveToLoadingZone(dto);
  }

  /**
   * Simulate RFID check for loading zone
   */
  @Post('rfid/check-loading-zone')
  @ApiOperation({ summary: 'Simulate RFID check at loading zone' })
  @ApiResponse({
    status: 200,
    description: 'RFID check completed',
  })
  async simulateRfidCheckLoadingZone(@Body() dto: SimulateRfidCheckDto) {
    return this.preparationService.simulateRfidCheck(dto);
  }

  /**
   * Start loading items onto truck
   */
  @Post(':commandId/loading/start')
  @ApiOperation({ summary: 'Start loading items onto truck' })
  @ApiParam({ name: 'commandId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Loading started',
  })
  async startLoading(@Param('commandId', ParseIntPipe) commandId: number) {
    return this.preparationService.startLoading(commandId);
  }

  /**
   * Mark an item as loaded onto truck
   */
  @Post('items/load')
  @ApiOperation({ summary: 'Mark item as loaded onto truck' })
  @ApiResponse({
    status: 200,
    description: 'Item loaded',
  })
  async loadItemToTruck(@Body() dto: LoadItemToTruckDto) {
    return this.preparationService.loadItemToTruck(dto);
  }

  /**
   * Complete loading with final RFID check
   */
  @Post('loading/complete')
  @ApiOperation({ summary: 'Complete loading process' })
  @ApiResponse({
    status: 200,
    description: 'Loading completed',
  })
  async completeLoading(@Body() dto: CompleteLoadingDto) {
    return this.preparationService.completeLoading(dto);
  }

  /**
   * Get preparation status for a command
   */
  @Get(':commandId/preparation-status')
  @ApiOperation({ summary: 'Get preparation status' })
  @ApiParam({ name: 'commandId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Preparation status retrieved',
  })
  async getPreparationStatus(
    @Param('commandId', ParseIntPipe) commandId: number,
  ) {
    return this.preparationService.getPreparationStatus(commandId);
  }
}
