import { Controller, Post, Body, Param } from '@nestjs/common';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('start')
  start(
    @Body() body: { userId: string; storeId: string; openingCash: number },
  ) {
    return this.shiftsService.startShift(body);
  }

  // Original endpoint for manual Z-Out
  @Post(':id/end')
  end(@Param('id') id: string, @Body() body: { closingCash: number }) {
    return this.shiftsService.endShift(id, body.closingCash);
  }

  // Endpoint for Automatic Z-Out
  @Post(':id/auto-end')
  autoEnd(@Param('id') id: string) {
    return this.shiftsService.autoEndShift(id);
  }
}
