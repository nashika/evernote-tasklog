class NoteFilterService

  updated: 3
  notebooks: null
  count: null

  constructor: ->

  query: =>
    result = {}
    if @updated
      merge result, {updated: {$gte: parseInt(moment().startOf('day').subtract(@updated, 'days').format('x'))}}
    if @notebooks and @notebooks.length > 0
      merge result, {notebookGuid: {$in: @notebooks}}
    return result

app.service 'noteFilter', [NoteFilterService]
module.exports = NoteFilterService
