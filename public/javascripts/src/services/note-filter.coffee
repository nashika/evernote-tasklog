class NoteFilterService

  updated: 3
  notebooks: null
  stacks: null
  count: null

  constructor: (@$rootScope) ->

  query: =>
    result = {}
    if @updated
      merge result, {updated: {$gte: parseInt(moment().startOf('day').subtract(@updated, 'days').format('x'))}}
    notebooksHash = {}
    if @notebooks and @notebooks.length > 0
      for notebookGuid in @notebooks
        notebooksHash[notebookGuid] = true
    if @stacks and @stacks.length > 0
      for stack in @stacks
        for notebookGuid, notebook of @$rootScope.notebooks
          if stack is notebook.stack
            notebooksHash[notebook.guid] = true
    notebooksArray = Object.keys(notebooksHash)
    if notebooksArray.length > 0
      merge result, {notebookGuid: {$in: notebooksArray}}
    return result

app.service 'noteFilter', ['$rootScope', NoteFilterService]
module.exports = NoteFilterService
