'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('okta_configs', {
      org_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      org_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      api_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      team_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'slack_workspaces',
          key: 'team_id'
        },
        unique: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      default_prompt: {
        type: Sequelize.TEXT,
        allowNull: true,
        description: 'Default prompt to use when invoking tools from this integration'
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('okta_configs');
  }
};
