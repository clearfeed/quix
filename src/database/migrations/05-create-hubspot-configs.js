'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hubspot_configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      hub_domain: {
        type: Sequelize.STRING,
        allowNull: false
      },
      hub_id: {
        type: Sequelize.BIGINT,
        allowNull: false
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.dropTable('hubspot_configs');
  }
}; 