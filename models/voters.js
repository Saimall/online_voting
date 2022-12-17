"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Voters.belongsTo(models.Election, {
        foreignKey: "electionID",
      });
    }
    static add(voterid, vote, password, electionID) {
      return this.create({
        voterid,
        vote,
        password,
        electionID,
      });
    }
    static retrivevoters(electionID) {
      return this.findAll({
        where: {
          electionID,
        },
      });
    }
    static countvoters(voterid) {
      return this.count({
        where: {
          voterid,
        },
      });
    }

    static async delete(voterID) {
      const res = await Voters.destroy({
        where: {
          id: voterID,
        },
      });
      return res;
    }
  }
  Voters.init(
    {
      voterid: DataTypes.STRING,
      voted: DataTypes.BOOLEAN,
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Voters",
    }
  );
  return Voters;
};
