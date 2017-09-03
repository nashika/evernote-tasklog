import {QueryInterface} from "sequelize";
import sequelize = require("sequelize");

export async function up(queryInterface: QueryInterface) {
  let i = 0;
  console.log(`${++i}. Create constraintResults table.`);
  await queryInterface.createTable("constraintResults", {
    id: {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    noteGuid: {type: sequelize.STRING, allowNull: false},
    constraintId: {type: sequelize.INTEGER, allowNull: false},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${++i}. Done.`)
}

export async function down(queryInterface: QueryInterface) {
  let i = 0;
  console.log(`${++i}. Drop constraintResults table.`);
  await queryInterface.dropTable("constraintResults");
  console.log(`${++i}. Done.`)
}
