"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("answers", "ElectionID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("answers", {
      fields: ["ElectionID"],
      type: "foreign key",
      references: {
        table: "Elections",
        field: "id",
      },
    });

    await queryInterface.addColumn("answers", "QuestionID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("answers", {
      fields: ["QuestionID"],
      type: "foreign key",
      references: {
        table: "questions",
        field: "id",
      },
    });
    await queryInterface.addColumn("answers", "VoterID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("answers", {
      fields: ["VoterID"],
      type: "foreign key",
      references: {
        table: "Voters",
        field: "id",
      },
    });

    await queryInterface.addColumn("answers", "chossedoption", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("answers", {
      fields: ["chossedoption"],
      type: "foreign key",
      references: {
        table: "options",
        field: "id",
      },
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn("answers", "VoterID");
    await queryInterface.removeColumn("answers", "ElectionID");
    await queryInterface.removeColumn("answers", "QuestionID");
    await queryInterface.removeColumn("answers", "chossedoption");
  },
};
