-- we don't know how to generate schema main (class Schema) :(
create table archive_note
(
    archiveId INTEGER
        primary key autoincrement,
    guid VARCHAR(255),
    title VARCHAR(255) not null,
    content TEXT,
    contentHash TEXT not null,
    contentLength INTEGER not null,
    created BIGINT,
    updated BIGINT,
    deleted BIGINT,
    active TINYINT(1) not null,
    updateSequenceNum INTEGER not null,
    notebookGuid VARCHAR(255),
    tagGuids TEXT,
    resources TEXT,
    attributes__subjectDate BIGINT,
    attributes__latitude DOUBLE PRECISION,
    attributes__longitude DOUBLE PRECISION,
    attributes__altitude DOUBLE PRECISION,
    attributes__author VARCHAR(255),
    attributes__source VARCHAR(255),
    attributes__sourceURL VARCHAR(255),
    attributes__sourceApplication VARCHAR(255),
    attributes__shareDate BIGINT,
    attributes__reminderOrder BIGINT,
    attributes__reminderDoneTime BIGINT,
    attributes__reminderTime BIGINT,
    attributes__placeName VARCHAR(255),
    attributes__contentClass VARCHAR(255),
    attributes__applicationData TEXT,
    attributes__classifications TEXT,
    attributes__creatorId INTEGER,
    attributes__lastEditorId INTEGER,
    attributes__sharedWithBusiness TINYINT(1),
    attributes__conflictSourceNoteGuid VARCHAR(255),
    attributes__noteTitleQuality INTEGER,
    tagNames TEXT,
    sharedNotes TEXT,
    restrictions TEXT,
    limits TEXT,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create index archive_notes_guid
    on archive_note (guid);

create table attendance
(
    id INTEGER
        primary key autoincrement,
    personId INTEGER not null,
    year INTEGER not null,
    month INTEGER not null,
    day INTEGER not null,
    arrivalTime INTEGER,
    departureTime INTEGER,
    restTime INTEGER,
    remarks TEXT,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create unique index attendances_person_id_year_month_day
    on attendance (personId, year, month, day);

create table constraint_result
(
    id INTEGER
        primary key autoincrement,
    noteGuid VARCHAR(255) not null,
    constraintId INTEGER not null,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create table linked_notebook
(
    guid VARCHAR(255)
        primary key,
    shareName VARCHAR(255),
    username VARCHAR(255),
    shareId VARCHAR(255),
    sharedNotebookGlobalId VARCHAR(255),
    uri VARCHAR(255),
    updateSequenceNum INTEGER not null,
    noteStoreUrl VARCHAR(255),
    webApiUrlPrefix VARCHAR(255),
    stack VARCHAR(255),
    businessId INTEGER,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create table note
(
    guid VARCHAR(255)
        primary key,
    title VARCHAR(255) not null,
    content TEXT,
    contentHash TEXT not null,
    contentLength INTEGER not null,
    created BIGINT,
    updated BIGINT,
    deleted BIGINT,
    active TINYINT(1) not null,
    updateSequenceNum INTEGER not null,
    notebookGuid VARCHAR(255),
    tagGuids TEXT,
    resources TEXT,
    attributes__subjectDate BIGINT,
    attributes__latitude DOUBLE PRECISION,
    attributes__longitude DOUBLE PRECISION,
    attributes__altitude DOUBLE PRECISION,
    attributes__author VARCHAR(255),
    attributes__source VARCHAR(255),
    attributes__sourceURL VARCHAR(255),
    attributes__sourceApplication VARCHAR(255),
    attributes__shareDate BIGINT,
    attributes__reminderOrder BIGINT,
    attributes__reminderDoneTime BIGINT,
    attributes__reminderTime BIGINT,
    attributes__placeName VARCHAR(255),
    attributes__contentClass VARCHAR(255),
    attributes__applicationData TEXT,
    attributes__classifications TEXT,
    attributes__creatorId INTEGER,
    attributes__lastEditorId INTEGER,
    attributes__sharedWithBusiness TINYINT(1),
    attributes__conflictSourceNoteGuid VARCHAR(255),
    attributes__noteTitleQuality INTEGER,
    tagNames TEXT,
    sharedNotes TEXT,
    restrictions TEXT,
    limits TEXT,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create table notebook
(
    guid VARCHAR(255)
        primary key,
    name VARCHAR(255) not null,
    updateSequenceNum INTEGER not null,
    defaultNotebook TINYINT(1) not null,
    serviceCreated BIGINT,
    serviceUpdated BIGINT,
    publishing TEXT,
    published TINYINT(1),
    stack VARCHAR(255),
    sharedNotebookIds TEXT,
    sharedNotebooks TEXT,
    businessNotebooks TEXT,
    contact TEXT,
    restrictions TEXT,
    recipientSettings TEXT,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create table option
(
    key VARCHAR(255)
        primary key,
    value TEXT,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create table profit_log
(
    id INTEGER
        primary key autoincrement,
    noteGuid VARCHAR(255) not null,
    comment TEXT,
    profit INTEGER not null,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create table saved_search
(
    guid VARCHAR(255)
        primary key,
    name VARCHAR(255) not null,
    query VARCHAR(255),
    format INTEGER,
    updateSequenceNum INTEGER not null,
    scope TEXT,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create table tag
(
    guid VARCHAR(255)
        primary key,
    name VARCHAR(255) not null,
    parentGuid VARCHAR(255),
    updateSequenceNum INTEGER not null,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

create table time_log
(
    id INTEGER
        primary key autoincrement,
    noteGuid VARCHAR(255) not null,
    comment TEXT,
    allDay TINYINT(1) not null,
    date BIGINT not null,
    personId INTEGER not null,
    spentTime INTEGER,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

