'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('slack_workspaces', 'access_settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {
        allowedUsersForInteraction: 'everyone'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('slack_workspaces', 'access_settings');
  }
};
