import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op } from 'sequelize';
import { ConversationState } from '@quix/database/models';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  /**
   * Runs every day at 03:00 AM server time.
   * - Soft-reset any state older than 7 days by nulling its JSON/count fields.
   * - Hard-delete entire rows older than 2 months.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleRetention(): Promise<void> {
    const nowMs = Date.now();
    const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(nowMs - 60 * 24 * 60 * 60 * 1000);

    const [numUpdated] = await ConversationState.update(
      {
        last_tool_calls: null,
        last_plan: null,
        contextual_memory: null
      },
      {
        where: {
          createdAt: { [Op.lt]: sevenDaysAgo }
        }
      }
    );
    this.logger.log(`Soft-reset ${numUpdated} rows older than ${sevenDaysAgo.toISOString()}`);

    const numDeleted = await ConversationState.destroy({
      where: {
        createdAt: { [Op.lt]: twoMonthsAgo }
      }
    });
    this.logger.log(`Deleted ${numDeleted} rows older than ${twoMonthsAgo.toISOString()}`);
  }
}
