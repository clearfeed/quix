'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('slack_workspaces', 'admin_user_ids', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    });

    // Add the authed_user_id as the first admin for existing workspaces
    await queryInterface.sequelize.query(`
      UPDATE slack_workspaces 
      SET admin_user_ids = ARRAY[authed_user_id]
      WHERE array_length(admin_user_ids, 1) IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('slack_workspaces', 'admin_user_ids');
  }
};
