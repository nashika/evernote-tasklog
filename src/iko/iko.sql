ATTACH "C:\Users\info\Documents\workspace\evernote-tasklog-nuxt\db\database_old.db" AS old;

INSERT INTO archive_note
SELECT * FROM old.archiveNotes;

INSERT INTO attendance
SELECT * FROM old.attendances;

INSERT INTO constraint_result
SELECT * FROM old.constraintResults;

INSERT INTO linked_notebook
SELECT * FROM old.linkedNotebooks;

INSERT INTO note
SELECT * FROM old.notes;

INSERT INTO notebook
SELECT * FROM old.notebooks;

INSERT INTO option
SELECT * FROM old.options;

INSERT INTO profit_log
SELECT * FROM old.profitLogs;

INSERT INTO saved_search
SELECT * FROM old.savedSearches;

INSERT INTO tag
SELECT * FROM old.tags;

INSERT INTO time_log
SELECT * FROM old.timeLogs;

UPDATE
    "attendance"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "constraint_result"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "linked_notebook"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "notebook"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "note"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "option"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "profit_log"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "saved_search"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "tag"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

UPDATE
    "time_log"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");

VACUUM;
