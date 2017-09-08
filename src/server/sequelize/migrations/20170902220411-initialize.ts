import {QueryInterface} from "sequelize";
import sequelize = require("sequelize");

export async function up(queryInterface: QueryInterface) {
  let i = 0;
  let j = 0;
  console.log(`${++i}. Create initial tables.`);
  console.log(`${i}-${++j}. Create archiveNotes table.`);
  await queryInterface.createTable("archiveNotes", {
    archiveId: {type: sequelize.INTEGER, primaryKey: true},
    guid: {type: sequelize.STRING},
    title: {type: sequelize.STRING, allowNull: false},
    content: {type: sequelize.TEXT},
    contentHash: {type: sequelize.TEXT, allowNull: false},
    contentLength: {type: sequelize.INTEGER, allowNull: false},
    created: {type: sequelize.BIGINT},
    updated: {type: sequelize.BIGINT},
    deleted: {type: sequelize.BIGINT},
    active: {type: sequelize.BOOLEAN, allowNull: false},
    updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
    notebookGuid: {type: sequelize.STRING},
    tagGuids: {type: sequelize.TEXT},
    resources: {type: sequelize.TEXT},
    "attributes__subjectDate": {type: sequelize.BIGINT},
    "attributes__latitude": {type: sequelize.DOUBLE},
    "attributes__longitude": {type: sequelize.DOUBLE},
    "attributes__altitude": {type: sequelize.DOUBLE},
    "attributes__author": {type: sequelize.STRING},
    "attributes__source": {type: sequelize.STRING},
    "attributes__sourceURL": {type: sequelize.STRING},
    "attributes__sourceApplication": {type: sequelize.STRING},
    "attributes__shareDate": {type: sequelize.BIGINT},
    "attributes__reminderOrder": {type: sequelize.BIGINT},
    "attributes__reminderDoneTime": {type: sequelize.BIGINT},
    "attributes__reminderTime": {type: sequelize.BIGINT},
    "attributes__placeName": {type: sequelize.STRING},
    "attributes__contentClass": {type: sequelize.STRING},
    "attributes__applicationData": {type: sequelize.TEXT},
    "attributes__classifications": {type: sequelize.TEXT},
    "attributes__creatorId": {type: sequelize.INTEGER},
    "attributes__lastEditorId": {type: sequelize.INTEGER},
    "attributes__sharedWithBusiness": {type: sequelize.BOOLEAN},
    "attributes__conflictSourceNoteGuid": {type: sequelize.STRING},
    "attributes__noteTitleQuality": {type: sequelize.INTEGER},
    tagNames: {type: sequelize.TEXT},
    sharedNotes: {type: sequelize.TEXT},
    restrictions: {type: sequelize.TEXT},
    limits: {type: sequelize.TEXT},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${i}-${++j}. Create attendances table.`);
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
  console.log(`${i}-${++j}. Create linkedNotebooks table.`);
  await queryInterface.createTable("linkedNotebooks", {
    guid: {type: sequelize.STRING, primaryKey: true},
    shareName: {type: sequelize.STRING},
    username: {type: sequelize.STRING},
    shareId: {type: sequelize.STRING},
    sharedNotebookGlobalId: {type: sequelize.STRING},
    uri: {type: sequelize.STRING},
    updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
    noteStoreUrl: {type: sequelize.STRING},
    webApiUrlPrefix: {type: sequelize.STRING},
    stack: {type: sequelize.STRING},
    businessId: {type: sequelize.INTEGER},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${i}-${++j}. Create notebooks table.`);
  await queryInterface.createTable("notebooks", {
    guid: {type: sequelize.STRING, primaryKey: true},
    name: {type: sequelize.STRING, allowNull: false},
    updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
    defaultNotebook: {type: sequelize.BOOLEAN, allowNull: false},
    serviceCreated: {type: sequelize.BIGINT},
    serviceUpdated: {type: sequelize.BIGINT},
    publishing: {type: sequelize.TEXT},
    published: {type: sequelize.BOOLEAN},
    stack: {type: sequelize.STRING},
    sharedNotebookIds: {type: sequelize.TEXT},
    sharedNotebooks: {type: sequelize.TEXT},
    businessNotebooks: {type: sequelize.TEXT},
    contact: {type: sequelize.TEXT},
    restrictions: {type: sequelize.TEXT},
    recipientSettings: {type: sequelize.TEXT},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${i}-${++j}. Create notes table.`);
  await queryInterface.createTable("notes", {
    guid: {type: sequelize.STRING, primaryKey: true},
    title: {type: sequelize.STRING, allowNull: false},
    content: {type: sequelize.TEXT},
    contentHash: {type: sequelize.TEXT, allowNull: false},
    contentLength: {type: sequelize.INTEGER, allowNull: false},
    created: {type: sequelize.BIGINT},
    updated: {type: sequelize.BIGINT},
    deleted: {type: sequelize.BIGINT},
    active: {type: sequelize.BOOLEAN, allowNull: false},
    updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
    notebookGuid: {type: sequelize.STRING},
    tagGuids: {type: sequelize.TEXT},
    resources: {type: sequelize.TEXT},
    "attributes__subjectDate": {type: sequelize.BIGINT},
    "attributes__latitude": {type: sequelize.DOUBLE},
    "attributes__longitude": {type: sequelize.DOUBLE},
    "attributes__altitude": {type: sequelize.DOUBLE},
    "attributes__author": {type: sequelize.STRING},
    "attributes__source": {type: sequelize.STRING},
    "attributes__sourceURL": {type: sequelize.STRING},
    "attributes__sourceApplication": {type: sequelize.STRING},
    "attributes__shareDate": {type: sequelize.BIGINT},
    "attributes__reminderOrder": {type: sequelize.BIGINT},
    "attributes__reminderDoneTime": {type: sequelize.BIGINT},
    "attributes__reminderTime": {type: sequelize.BIGINT},
    "attributes__placeName": {type: sequelize.STRING},
    "attributes__contentClass": {type: sequelize.STRING},
    "attributes__applicationData": {type: sequelize.TEXT},
    "attributes__classifications": {type: sequelize.TEXT},
    "attributes__creatorId": {type: sequelize.INTEGER},
    "attributes__lastEditorId": {type: sequelize.INTEGER},
    "attributes__sharedWithBusiness": {type: sequelize.BOOLEAN},
    "attributes__conflictSourceNoteGuid": {type: sequelize.STRING},
    "attributes__noteTitleQuality": {type: sequelize.INTEGER},
    tagNames: {type: sequelize.TEXT},
    sharedNotes: {type: sequelize.TEXT},
    restrictions: {type: sequelize.TEXT},
    limits: {type: sequelize.TEXT},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${i}-${++j}. Create options table.`);
  await queryInterface.createTable("options", {
    key: {type: sequelize.STRING, primaryKey: true},
    value: {type: sequelize.TEXT},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${i}-${++j}. Create profitLogs table.`);
  await queryInterface.createTable("profitLogs", {
    id: {type: sequelize.INTEGER, primaryKey: true},
    noteGuid: {type: sequelize.STRING, allowNull: false},
    comment: {type: sequelize.TEXT, allowNull: true},
    profit: {type: sequelize.INTEGER, allowNull: false},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${i}-${++j}. Create savedSearches table.`);
  await queryInterface.createTable("savedSearches", {
    guid: {type: sequelize.STRING, primaryKey: true},
    name: {type: sequelize.STRING, allowNull: false},
    query: {type: sequelize.STRING},
    format: {type: sequelize.INTEGER},
    updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
    scope: {type: sequelize.TEXT},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${i}-${++j}. Create tags table.`);
  await queryInterface.createTable("tags", {
    guid: {type: sequelize.STRING, primaryKey: true},
    name: {type: sequelize.STRING, allowNull: false},
    parentGuid: {type: sequelize.STRING, allowNull: true},
    updateSequenceNum: {type: sequelize.INTEGER, allowNull: false},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  console.log(`${i}-${++j}. Create timeLogs table.`);
  await queryInterface.createTable("timeLogs", {
    id: {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    noteGuid: {type: sequelize.STRING, allowNull: false},
    comment: {type: sequelize.TEXT, allowNull: true},
    allDay: {type: sequelize.BOOLEAN, allowNull: false},
    date: {type: sequelize.BIGINT, allowNull: false},
    personId: {type: sequelize.INTEGER, allowNull: false},
    spentTime: {type: sequelize.INTEGER, allowNull: true},
    createdAt: {type: sequelize.DATE, allowNull: false},
    updatedAt: {type: sequelize.DATE, allowNull: false},
  });
  j = 0;
  console.log(`${++i}. Create initial indexes.`);
  console.log(`${i}-${++j}. Create archiveNotes guid index.`);
  await queryInterface.addIndex("archiveNotes", ["guid"]);
  console.log(`${i}-${++j}. Create attendances unique key.`);
  await queryInterface.addIndex("attendances", ["personId", "year", "month", "day"], {indicesType: "UNIQUE"});
  console.log(`${++i}. Done.`);
}

export async function down(queryInterface: QueryInterface) {
  let i = 0;
  let j = 0;
  console.log(`${++i}. Drop tables.`);
  console.log(`${i}-${++j}. Drop archiveNotes table.`);
  await queryInterface.dropTable("archiveNotes");
  console.log(`${i}-${++j}. Drop attendances table.`);
  await queryInterface.dropTable("attendances");
  console.log(`${i}-${++j}. Drop linkedNotebooks table.`);
  await queryInterface.dropTable("linkedNotebooks");
  console.log(`${i}-${++j}. Drop notebooks table.`);
  await queryInterface.dropTable("notebooks");
  console.log(`${i}-${++j}. Drop notes table.`);
  await queryInterface.dropTable("notes");
  console.log(`${i}-${++j}. Drop options table.`);
  await queryInterface.dropTable("options");
  console.log(`${i}-${++j}. Drop profitLogs table.`);
  await queryInterface.dropTable("profitLogs");
  console.log(`${i}-${++j}. Drop savedSearches table.`);
  await queryInterface.dropTable("savedSearches");
  console.log(`${i}-${++j}. Drop tags table.`);
  await queryInterface.dropTable("tags");
  console.log(`${i}-${++j}. Drop timeLogs table.`);
  await queryInterface.dropTable("timeLogs");
  console.log(`${++i}. Done.`);
}
