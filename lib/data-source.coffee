async = require 'async'
Evernote = require('evernote').Evernote

core = require './core'

class DataSource

  ###*
  # @public
  # @param {string} words
  # @param {function} callback
  ###
  findNotes: (words = null, callback) =>
    noteStore = core.client.getNoteStore()
    noteFilter = new Evernote.NoteFilter()
    if words then noteFilter.words = words
    resultSpec = new Evernote.NotesMetadataResultSpec()
    noteStore.findNotesMetadata noteFilter, 0, 100, resultSpec, (err, notesMeta) =>
      if err then return callback(err)
      async.eachSeries notesMeta.notes, (noteMeta, callback) =>
        noteStore = core.client.getNoteStore()
        noteStore.getNote noteMeta.guid, true, false, false, false, (err, note) =>
          if err then return callback(err)
          core.db.notes.insert note, (err, newDoc) =>
            if err then return callback(err)
            console.log "A note is loaded. guid=#{note.guid} title=#{note.title}"
            callback()
      , (err) =>
        if err then return callback(err)
        callback()

  ###*
  # @protected
  # @param {string} err
  ###
  _checkError: (err) =>
    if err
      console.error err
      return true
    else
      return false

  ###*
  # @protected
  ###
  _parseNoteContent: (content) =>
    profits = []
    logs = []
    content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>')
    for line in content.split('<>')
      clearLine = line.replace(/<[^>]*>/g, '')
      if matches = clearLine.match(/(.*)[@＠][\\￥](.+)/i)
        true

#            regExpLog.Pattern = "[@＠](\d{2,4}/\d{1,2}/\d{1,2})"
#            regExpDate.Pattern = "\d{2,4}/\d{1,2}/\d{1,2}"
#            regExpTime.Pattern = "\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}"
#            regExpSpentTime.Pattern = "\d+h\d+m|\d+m|\d+h|\d+\.\d+h"
#            regExpSpentTime.IgnoreCase = True
#
#            For Each line In Split(content, "<>")
#
#                    Set attributes = New Dictionary
#                    Set lineMatch = lineMatchs.Item(0)
#                    'コメントの取得
#                    If lineMatch.FirstIndex > 0 Then
#                        attributes.Add "comment", Trim(Left(clearLine, lineMatch.FirstIndex - 1))
#                    Else
#                        attributes.Add "comment", ""
#                    End If
#                    '利益額の取得
#                    profitText = Trim(Mid(clearLine, lineMatch.FirstIndex + lineMatch.Length + 1))
#                    attributes.Add "profit", Val(profitText)
#                    myProfits.Add attributes
#
#                'ログ文字列の解析
#                Set lineMatchs = regExpLog.Execute(clearLine)
#                If lineMatchs.count > 0 Then
#                    Set attributes = New Dictionary
#                    Set lineMatch = lineMatchs.Item(0)
#                    'コメントの取得
#                    If lineMatch.FirstIndex > 0 Then
#                        attributes.Add "comment", Trim(Left(clearLine, lineMatch.FirstIndex - 1))
#                    Else
#                        attributes.Add "comment", ""
#                    End If
#                    'コメント以外のテキスト取得
#                    attributesText = Trim(Mid(clearLine, lineMatch.FirstIndex + 1))
#                    '日付の取得
#                    Set logMatchs = regExpDate.Execute(attributesText)
#                    If logMatchs.count > 0 Then
#                        attributes.Add "date", logMatchs.Item(0)
#                    End If
#                    '時刻の取得
#                    Set logMatchs = regExpTime.Execute(attributesText)
#                    If logMatchs.count > 0 Then
#                        attributes.Add "time", logMatchs.Item(0)
#                    End If
#                    '担当者の取得
#                    Dim alias As Dictionary
#                    Dim p As Variant
#                    For Each p In myPersonAliases
#                        Set alias = p
#                        If InStr(attributesText, alias.Item("aliasName")) Then
#                            attributes.Add "personId", alias.Item("personId")
#                            attributes.Add "personAbbrName", alias.Item("abbrName")
#                            Exit For
#                        End If
#                    Next
#                    '作業時間の取得
#                    Set logMatchs = regExpSpentTime.Execute(attributesText)
#                    If logMatchs.count > 0 Then
#                        Dim sSpentTime As String
#                        Dim sSpentHour As String
#                        Dim sSpentMinute As String
#                        Dim nSpentMinute As Integer
#                        sSpentTime = LCase(logMatchs.Item(0))
#                        nSpentMinute = 0
#                        If InStr(sSpentTime, "h") > 0 Then
#                            sSpentHour = Left(sSpentTime, InStr(sSpentTime, "h") - 1)
#                            nSpentMinute = nSpentMinute + Round(sSpentHour * 60)
#                        End If
#                        If InStr(sSpentTime, "m") > 0 Then
#                            If InStr(sSpentTime, "h") > 0 Then
#                                sSpentMinute = Mid(sSpentTime, InStr(sSpentTime, "h") + 1)
#                                sSpentMinute = Left(sSpentMinute, Len(sSpentMinute) - 1)
#                            Else
#                                sSpentMinute = Left(sSpentTime, Len(sSpentTime) - 1)
#                            End If
#                            nSpentMinute = nSpentMinute + sSpentMinute
#                        End If
#                        sSpentTime = (nSpentMinute \ 60) & ":" & (nSpentMinute Mod 60)
#                        attributes.Add "spentTime", sSpentTime
#                    End If
#                    '日付と担当者が存在すればログと見做してデータ保持
#                    If attributes.Exists("date") And attributes.Exists("personId") Then
#                        myLogs.Add attributes
#                    End If
#                End If
#            Next
#        End Sub


module.exports = new DataSource()
