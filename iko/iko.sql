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

UPDATE
    "attendance"
SET
    "createdAt" = strftime('%Y-%m-%d %H:%M:%S', "createdAt"),
    "updatedAt" = strftime('%Y-%m-%d %H:%M:%S', "updatedAt");
