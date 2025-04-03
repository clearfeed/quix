'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add default_prompt column to github_configs
    await queryInterface.addColumn('github_configs', 'default_prompt', {
      type: Sequelize.TEXT,
      allowNull: true,
      description: 'Default prompt to use when invoking tools from this integration'
    });

    // Add default_prompt column to hubspot_configs
    await queryInterface.addColumn('hubspot_configs', 'default_prompt', {
      type: Sequelize.TEXT,
      allowNull: true,
      description: 'Default prompt to use when invoking tools from this integration'
    });

    // Add default_prompt column to jira_configs
    await queryInterface.addColumn('jira_configs', 'default_prompt', {
      type: Sequelize.TEXT,
      allowNull: true,
      description: 'Default prompt to use when invoking tools from this integration'
    });

    // Add default_prompt column to linear_configs
    await queryInterface.addColumn('linear_configs', 'default_prompt', {
      type: Sequelize.TEXT,
      allowNull: true,
      description: 'Default prompt to use when invoking tools from this integration'
    });

    // Add default_prompt column to mcp_connections
    await queryInterface.addColumn('mcp_connections', 'default_prompt', {
      type: Sequelize.TEXT,
      allowNull: true,
      description: 'Default prompt to use when invoking tools from this integration'
    });

    // Add default_prompt column to notion_configs
    await queryInterface.addColumn('notion_configs', 'default_prompt', {
      type: Sequelize.TEXT,
      allowNull: true,
      description: 'Default prompt to use when invoking tools from this integration'
    });

    // Add default_prompt column to postgres_configs
    await queryInterface.addColumn('postgres_configs', 'default_prompt', {
      type: Sequelize.TEXT,
      allowNull: true,
      description: 'Default prompt to use when invoking tools from this integration'
    });

    // Add default_prompt column to salesforce_configs
    await queryInterface.addColumn('salesforce_configs', 'default_prompt', {
      type: Sequelize.TEXT,
      allowNull: true,
      description: 'Default prompt to use when invoking tools from this integration'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove default_prompt column from github_configs
    await queryInterface.removeColumn('github_configs', 'default_prompt');

    // Remove default_prompt column from hubspot_configs
    await queryInterface.removeColumn('hubspot_configs', 'default_prompt');

    // Remove default_prompt column from jira_configs
    await queryInterface.removeColumn('jira_configs', 'default_prompt');

    // Remove default_prompt column from linear_configs
    await queryInterface.removeColumn('linear_configs', 'default_prompt');

    // Remove default_prompt column from mcp_connections
    await queryInterface.removeColumn('mcp_connections', 'default_prompt');

    // Remove default_prompt column from notion_configs
    await queryInterface.removeColumn('notion_configs', 'default_prompt');

    // Remove default_prompt column from postgres_configs
    await queryInterface.removeColumn('postgres_configs', 'default_prompt');

    // Remove default_prompt column from salesforce_configs
    await queryInterface.removeColumn('salesforce_configs', 'default_prompt');
  }
}; 