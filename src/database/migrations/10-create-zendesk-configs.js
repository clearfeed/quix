'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('zendesk_configs', {
      team_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        references: {
          model: 'slack_workspaces',
          key: 'team_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      subdomain: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      default_prompt: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('zendesk_configs');
  }
};
