import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MembershipLevelDto } from './dto/membership-level.dto';
import { MembershipsService } from './memberships.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('memberships')
@Public()
@Controller('membership-levels')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los niveles de membresía activos y sus beneficios' })
  @ApiOkResponse({ type: [MembershipLevelDto] })
  findAll(): Promise<MembershipLevelDto[]> {
    return this.membershipsService.findAll();
  }
}
