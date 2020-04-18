-- we don't know how to generate schema main (class Schema) :(
create table archive_note
(
    archiveId integer not null
        primary key autoincrement,
    guid integer not null,
    title text not null,
    content text,
    contentHash text not null,
    contentLength integer not null,
    created integer,
    updated integer,
    deleted integer,
    active boolean not null,
    updateSequenceNum integer not null,
    notebookGuid text,
    tagGuids text,
    resources text,
    attributes__subjectDate real,
    attributes__latitude real,
    attributes__longitude real,
    attributes__altitude real,
    attributes__author text,
    attributes__source text,
    attributes__sourceURL text,
    attributes__sourceApplication text,
    attributes__shareDate integer,
    attributes__reminderOrder integer,
    attributes__reminderDoneTime integer,
    attributes__reminderTime integer,
    attributes__placeName text,
    attributes__contentClass text,
    attributes__applicationData text,
    attributes__classifications text,
    attributes__creatorId integer,
    attributes__lastEditorId integer,
    attributes__sharedWithBusiness boolean,
    attributes__conflictSourceNoteGuid text,
    attributes__noteTitleQuality integer,
    tagNames text,
    sharedNotes text,
    restrictions text,
    limits text,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create index IDX_8d266d3f81c3081264d5c1680a
    on archive_note (guid);

create table attendance
(
    id integer not null
        primary key autoincrement,
    personId integer not null,
    year integer not null,
    month integer not null,
    day integer not null,
    arrivalTime integer,
    departureTime integer,
    restTime integer,
    remarks text,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create unique index IDX_e5e0fc6e42e37e29bb878066a3
    on attendance (personId, year, month, day);

create table constraint_result
(
    id integer not null
        primary key autoincrement,
    noteGuid text not null,
    constraintId integer not null,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create table linked_notebook
(
    guid text not null
        primary key,
    shareName text,
    username text,
    shareId text,
    sharedNotebookGlobalId text,
    uri text,
    updateSequenceNum integer not null,
    noteStoreUrl text,
    webApiUrlPrefix text,
    stack text,
    businessId integer,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create table note
(
    guid integer not null
        primary key,
    title text not null,
    content text,
    contentHash text not null,
    contentLength integer not null,
    created integer,
    updated integer,
    deleted integer,
    active boolean not null,
    updateSequenceNum integer not null,
    notebookGuid text,
    tagGuids text,
    resources text,
    attributes__subjectDate real,
    attributes__latitude real,
    attributes__longitude real,
    attributes__altitude real,
    attributes__author text,
    attributes__source text,
    attributes__sourceURL text,
    attributes__sourceApplication text,
    attributes__shareDate integer,
    attributes__reminderOrder integer,
    attributes__reminderDoneTime integer,
    attributes__reminderTime integer,
    attributes__placeName text,
    attributes__contentClass text,
    attributes__applicationData text,
    attributes__classifications text,
    attributes__creatorId integer,
    attributes__lastEditorId integer,
    attributes__sharedWithBusiness boolean,
    attributes__conflictSourceNoteGuid text,
    attributes__noteTitleQuality integer,
    tagNames text,
    sharedNotes text,
    restrictions text,
    limits text,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create table notebook
(
    guid text not null
        primary key,
    name text not null,
    updateSequenceNum integer not null,
    defaultNotebook boolean not null,
    serviceCreated integer,
    serviceUpdated integer,
    publishing text,
    published boolean,
    stack text,
    sharedNotebookIds text,
    sharedNotebooks text,
    businessNotebooks text,
    contact text,
    restrictions text,
    recipientSettings text,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create table option
(
    key text not null
        primary key,
    value text,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create table profit_log
(
    id integer not null
        primary key autoincrement,
    noteGuid text not null,
    comment text,
    profit integer not null,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create table saved_search
(
    guid text not null
        primary key,
    name text not null,
    query text,
    format integer,
    updateSequenceNum integer not null,
    scope text,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create table tag
(
    guid text not null
        primary key,
    name text not null,
    parentGuid text,
    updateSequenceNum integer not null,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

create table time_log
(
    id integer not null
        primary key autoincrement,
    noteGuid text not null,
    comment text,
    allDay boolean not null,
    date integer not null,
    personId integer not null,
    spentTime integer,
    createdAt datetime default datetime('now') not null,
    updatedAt datetime default datetime('now') not null
);

