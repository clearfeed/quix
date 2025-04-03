'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('slack_workspaces', {
      team_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      bot_access_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      authed_user_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      bot_user_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_enterprise_install: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      scopes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      app_id: {
        type: Sequelize.STRING,
        allowNull: false
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
    await queryInterface.dropTable('slack_workspaces');
  }
};
