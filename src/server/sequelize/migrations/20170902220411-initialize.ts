import {QueryInterface} from "sequelize";
import sequelize = require("sequelize");

export async function up(queryInterface: QueryInterface) {
  console.log("Create initial tables started.");
  await queryInterface.createTable("attendances", {
    id: {type: sequelize.INTEGER, primaryKey: true},
    personId: {type: sequelize.INTEGER, allowNull: false},
    year: {type: sequelize.INTEGER, allowNull: false, validate: {min: 1, max: 9999}},
    month: {type: sequelize.INTEGER, allowNull: false, validate: {min: 1, max: 12}},
    day: {type: sequelize.INTEGER, allowNull: false, validate: {min: 1, max: 31}},
    arrivalTime: {type: sequelize.INTEGER, validate: {min: 0, max: 24 * 60}},
    departureTime: {type: sequelize.INTEGER, validate: {min: 0, max: 24 * 60}},
    restTime: {type: sequelize.INTEGER, validate: {min: 0, max: 24 * 60}},
    remarks: {type: sequelize.TEXT},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  await queryInterface.addIndex("attendances", ["personId", "year", "month", "day"], {indexType: "UNIQUE"});
  console.log("Create initial tables finished.");
}

export async function down(queryInterface: QueryInterface) {
  return queryInterface.dropTable("attendances");
}
