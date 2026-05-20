import { Injectable } from '@nestjs/common';
import { ActivityRepository } from './repositories/activity.repository';
import { QueryActivityDto } from './dto/query-activity.dto';

@Injectable()
export class ActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async findAll(userId: string, query: QueryActivityDto) {
    return this.activityRepository.findMany(userId, query);
  }
}
