"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class answers extends Model {
    static addResponse({ VoterID, ElectionID, QuestionID, chossedoption }) {
      return this.create({
        ElectionID,
        QuestionID,
        VoterID,
        chossedoption,
      });
    }

    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      answers.belongsTo(models.Election, {
        foreignKey: "ElectionID",
      });

      answers.belongsTo(models.questions, {
        foreignKey: "QuestionID",
      });

      answers.belongsTo(models.Voters, {
        foreignKey: "VoterID",
      });
      answers.belongsTo(models.options, {
        foreignKey: "chossedoption",
      });

      // define association here
    }
  }
  answers.init(
    {},
    {
      sequelize,
      modelName: "answers",
    }
  );
  return answers;
};
