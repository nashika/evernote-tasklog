class TimelineController

  timeLogs: {}
  timelineDatas: []

  constructor: (@$scope, @$http) ->
    container = document.getElementById('timeline')
    @timelineDatas = [
      {id: 1, content: 'item 1', start: '2013-04-20'},
      {id: 2, content: 'item 2', start: '2013-04-14'},
      {id: 3, content: 'item 3', start: '2013-04-18'},
      {id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19'},
      {id: 5, content: 'item 5', start: '2013-04-25'},
      {id: 6, content: 'item 6', start: '2013-04-27'}
    ]
    @$http
      method : 'GET',
      url : '/time-logs'
    .success (datas, status) =>
      for timeLog in datas
        @timeLogs[timeLog.noteGuid] ?= {}
        @timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
      data = []
      for noteGuid, noteTimeLogs of @timeLogs
        for _id, timeLog of noteTimeLogs
          data.push
            id: _id
            content: timeLog.comment
            start: timeLog.date
    .error (data, status) =>
      console.error status
    options = {}
    timeline = new vis.Timeline(container, @timelineDatas, options)

app.controller 'TimelineController', ['$scope', '$http', TimelineController]
module.exports = TimelineController
