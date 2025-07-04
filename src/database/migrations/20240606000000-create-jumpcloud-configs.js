'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jumpcloud_configs', {
      team_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'slack_workspaces',
          key: 'team_id'
        },
        unique: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      api_key: {
        type: Sequelize.TEXT,
        allowNull: false
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
    await queryInterface.dropTable('jumpcloud_configs');
  }
};
