'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('github_configs', {
      github_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      avatar: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scopes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
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
      default_config: {
        type: Sequelize.JSON,
        allowNull: true,
        description: 'Default configuration for GitHub repositories (e.g., { repo: "default-repo", owner: "default-owner" })'
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
    await queryInterface.dropTable('github_configs');
  }
}; 