app.factory 'viewUtil', ->
  viewUtil =

    getDate: (datetime) ->
      date = new Date(datetime)
      date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate()

    getTime: (datetime) ->
      date = new Date(datetime)
      date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()

  return viewUtil
