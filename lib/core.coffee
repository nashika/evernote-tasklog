###*
# @type {Object}
###
core =
  app: null
  server: null
  www: null
  settings: {}
  loggers:
    system: null
    access: null
    error: null
  models:
    settings: null
  users: {}

user =
  client: null
  user: null
  settings: {}
  models:
    linkedNotebooks: null
    notes: null
    notebooks: null
    profitLogs: null
    searches: null
    settings: null
    syncStates: null
    tags: null
    timeLogs: null
    users: null

module.exports = core
