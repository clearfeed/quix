import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op, Sequelize } from 'sequelize';
import { ConversationState } from '@quix/database/models';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { SOFT_RETENTION_DAYS, HARD_RETENTION_MONTHS } from '../constants';
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    @InjectModel(ConversationState)
    private readonly conversationStateModel: typeof ConversationState,
    @InjectConnection() private readonly sequelize: Sequelize
  ) {}
  /**
   * Runs every day at 03:00 AM server time.
   * - Soft-reset any state older than 7 days by nulling its JSON/count fields.
   * - Hard-delete entire rows older than 2 months.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleRetention(): Promise<void> {
    const softInterval = `NOW() - INTERVAL '${SOFT_RETENTION_DAYS} day'`;
    const hardInterval = `NOW() - INTERVAL '${HARD_RETENTION_MONTHS} month'`;

    const [numUpdated] = await this.conversationStateModel.update(
      {
        last_tool_calls: null,
        last_plan: null,
        contextual_memory: null
      },
      {
        where: {
          createdAt: { [Op.lt]: this.sequelize.literal(softInterval) }
        }
      }
    );
    this.logger.log(`Soft-reset ${numUpdated} rows older than ${SOFT_RETENTION_DAYS} days`);

    const numDeleted = await this.conversationStateModel.destroy({
      where: {
        createdAt: { [Op.lt]: this.sequelize.literal(hardInterval) }
      }
    });
    this.logger.log(`Deleted ${numDeleted} rows older than ${HARD_RETENTION_MONTHS} months`);
  }
}
