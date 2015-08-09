###*
# @type {Object}
###
core = {
  app: null
  server: null
  www: null
  loggers:
    system: null
    access: null
    error: null
  users: {}
}

user = {
  client: null
  user: null
  db:
    users: null
    syncStates: null
    notes: null
    notebooks: null
    tags: null
    searches: null
    linkedNotebooks: null
    timeLogs: null
    profitLogs: null
}

module.exports = core
