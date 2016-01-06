merge = require 'merge'

class NoteQueryService

  ###*
  # @public
  # @type {number}
  ###
  updated: 3

  ###*
  # @public
  # @type {Array}
  ###
  notebooks: null

  ###*
  # @public
  # @type {Array}
  ###
  stacks: null

  ###*
  # @public
  # @type {number}
  ###
  count: null

  ###*
  # @constructor
  # @param {SyncDataService} syncData
  ###
  constructor: (@dataStore) ->

  ###*
  # @public
  # @return {Object}
  ###
  query: =>
    result = {}
    # set updated query
    if @updated
      merge result, {updated: {$gte: parseInt(moment().startOf('day').subtract(@updated, 'days').format('x'))}}
    notebooksHash = {}
    # check notebooks
    if @notebooks and @notebooks.length > 0
      for notebookGuid in @notebooks
        notebooksHash[notebookGuid] = true
    # check stacks
    if @stacks and @stacks.length > 0
      for stack in @stacks
        for notebookGuid, notebook of @dataStore.notebooks
          if stack is notebook.stack
            notebooksHash[notebook.guid] = true
    notebooksArray = Object.keys(notebooksHash)
    # set notebooks query checked before
    if notebooksArray.length > 0
      merge result, {notebookGuid: {$in: notebooksArray}}
    return result

app.service 'noteQuery', ['dataStore', NoteQueryService]
module.exports = NoteQueryService
