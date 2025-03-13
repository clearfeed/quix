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
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: false
      },
      team_id: {
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.dropTable('github_configs');
  }
}; 