"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static addElections({ electionName, adminID }) {
      return this.create({
        electionName,
        adminID,
      });
    }
    static getElections(adminID) {
      return this.findAll({
        where: {
          adminID,
        },
        order: [["id", "ASC"]],
      });
    }
    static associate(models) {
      // define association here
      Election.belongsTo(models.Admin, {
        foreignKey: "adminID",
      });
      Election.hasMany(models.questions, {
        foreignKey: "electionID",
      });
    }
  }
  Election.init(
    {
      electionName: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Election",
    }
  );
  return Election;
};
