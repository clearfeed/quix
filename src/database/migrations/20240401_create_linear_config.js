"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('linear_configs', {
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
      workspace_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      linear_org_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('linear_configs');
  },
};