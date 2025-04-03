'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('postgres_configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      host: {
        type: Sequelize.STRING,
        allowNull: false
      },
      port: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      database: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      default_config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ssl: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    await queryInterface.dropTable('postgres_configs');
  }
};
