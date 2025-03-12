'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jira_sites', 'default_config', {
      type: Sequelize.JSON,
      allowNull: true,
      description: 'Default configuration for JIRA site (e.g., { projectKey: "APP" })'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jira_sites', 'default_config');
  }
}; 