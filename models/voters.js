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

      Voters.hasMany(models.answers, {
        foreignKey: "voterid",
      });
    }
    static add(Voterid, password, electionID) {
      return this.create({
        voterid: Voterid,
        voted: false,
        password: password,
        electionID: electionID,
      });
    }

    static modifypassword(Voterid, newpassword) {
      return this.update(
        {
          password: newpassword,
        },
        {
          where: {
            voterid: Voterid,
          },
        }
      );
    }

    static retrivevoters(electionID) {
      return this.findAll({
        where: {
          electionID,
        },
      });
    }
    static countvoters(electionID) {
      return this.count({
        where: {
          electionID,
        },
      });
    }
    static votersvoted(electionID) {
      return this.count({
        where: {
          electionID,
          voted: true,
        },
      });
    }

    static votersnotvoted(electionID) {
      return this.count({
        where: {
          electionID,
          voted: false,
        },
      });
    }
    static findVoter(Voterid) {
      return this.findOne({
        where: {
          voterid: Voterid,
        },
      });
    }

    static delete(voterid) {
      return this.destroy({
        where: {
          voterid: voterid,
        },
      });
    }

    static votecompleted(id) {
      return this.update(
        {
          voted: true,
        },
        {
          where: {
            id,
          },
        }
      );
    }
  }
  Voters.init(
    {
      voterid: DataTypes.STRING,
      voted: DataTypes.BOOLEAN,
      password: DataTypes.STRING,
      case: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Voters",
    }
  );
  return Voters;
};
