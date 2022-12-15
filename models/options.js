"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class options extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static retrieveoptions(questionID) {
      return this.findAll({
        where: {
          questionID,
        },
      });
    }
    static async modifyoption(newValue, id) {
      return options.update(
        {
          optionname: newValue,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
    static removeoptions(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    static addoption({ optionname, questionID }) {
      return this.create({
        optionname,
        questionID,
      });
    }

    static associate(models) {
      options.belongsTo(models.questions, {
        foreignKey: "questionID",
        onDelete: "CASCADE",
      });
    }
    // define association here
  }
  options.init(
    {
      optionname: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "options",
    }
  );
  return options;
};
