ALTER TABLE "archiveNotes" RENAME TO "archive_note";
ALTER TABLE "attendances" RENAME TO "attendance";
ALTER TABLE "constraintResults" RENAME TO "constraint_result";
ALTER TABLE "linkedNotebooks" RENAME TO "linked_notebook";
ALTER TABLE "notebooks" RENAME TO "notebook";
ALTER TABLE "notes" RENAME TO "note";
ALTER TABLE "options" RENAME TO "option";
ALTER TABLE "profitLogs" RENAME TO "profit_log";
ALTER TABLE "savedSearches" RENAME TO "saved_search";
ALTER TABLE "tags" RENAME TO "tag";
ALTER TABLE "timeLogs" RENAME TO "time_log";

DROP TABLE "SequelizeMeta";

DELETE FROM "archive_note";

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
