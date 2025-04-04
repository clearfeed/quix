'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversation_states', {
      team_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'slack_workspaces',
          key: 'team_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      channel_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      thread_ts: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      last_tool_calls: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      last_plan: {
        type: Sequelize.JSON,
        defaultValue: null
      },
      contextual_memory: {
        type: Sequelize.JSON,
        defaultValue: null
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('conversation_states', ['updated_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conversation_states');
  }
};
