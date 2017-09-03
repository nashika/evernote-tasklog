import {QueryInterface} from "sequelize";
import sequelize = require("sequelize");

export async function up(queryInterface: QueryInterface) {
  let i = 0;
  console.log(`${++i}. Change archiveNotes.archiveId column to add auto increment.`);
  await queryInterface.changeColumn("archiveNotes", "archiveId", {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true});
  console.log(`${++i}. Create archiveNotes guid index.`);
  await queryInterface.addIndex("archiveNotes", ["guid"]);
  console.log(`${++i}. Change attendances.id column to add auto increment.`);
  await queryInterface.changeColumn("attendances", "id", {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true});
  console.log(`${++i}. Create attendances unique key.`);
  await queryInterface.addIndex("attendances", ["personId", "year", "month", "day"], {indicesType: "UNIQUE"});
  console.log(`${++i}. Change profitLogs.id column to add auto increment.`);
  await queryInterface.changeColumn("profitLogs", "id", {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true});
  console.log(`${++i}. Done.`);
}

export async function down(queryInterface: QueryInterface) {
  let i = 0;
  console.log(`${++i}. Change archiveNotes.archiveId column to remove auto increment.`);
  await queryInterface.changeColumn("archiveNotes", "archiveId", {type: sequelize.INTEGER, primaryKey: true});
  console.log(`${++i}. Create archiveNotes guid index.`);
  await queryInterface.addIndex("archiveNotes", ["guid"]);
  console.log(`${++i}. Change attendances.id column to remove auto increment.`);
  await queryInterface.changeColumn("attendances", "id", {type: sequelize.INTEGER, primaryKey: true});
  console.log(`${++i}. Create attendances unique key.`);
  await queryInterface.addIndex("attendances", ["personId", "year", "month", "day"], {indicesType: "UNIQUE"});
  console.log(`${++i}. Change profitLogs.id column to remove auto increment.`);
  await queryInterface.changeColumn("profitLogs", "id", {type: sequelize.INTEGER, primaryKey: true});
  console.log(`${++i}. Done.`);
}
