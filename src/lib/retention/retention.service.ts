import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op, Sequelize } from 'sequelize';
import { ConversationState } from '@quix/database/models';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  constructor(
    @InjectModel(ConversationState)
    private readonly conversationStateModel: typeof ConversationState,
    @InjectConnection()
    private readonly sequelize: Sequelize
  ) {}
  /**
   * Runs every day at 03:00 AM server time.
   * - Soft-reset any state older than 7 days by nulling its JSON/count fields.
   * - Hard-delete entire rows older than 2 months.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleRetention(): Promise<void> {
    const [numUpdated] = await this.conversationStateModel.update(
      {
        last_tool_calls: null,
        last_plan: null,
        contextual_memory: null
      },
      {
        where: {
          createdAt: { [Op.lt]: this.sequelize.literal("NOW() - INTERVAL '7 day'") }
        }
      }
    );
    this.logger.log(`Soft-reset ${numUpdated} rows older than 7 days`);

    const numDeleted = await this.conversationStateModel.destroy({
      where: {
        createdAt: { [Op.lt]: this.sequelize.literal("NOW() - INTERVAL '2 month'") }
      }
    });
    this.logger.log(`Deleted ${numDeleted} rows older than 2 months`);
  }
}
