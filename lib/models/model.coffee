Datastore = require 'nedb'
inflection = require 'inflection'

class Model

  ###*
  # @const
  # @type {string}
  ###
  PLURAL_NAME: ''

  ###*
  # @const
  # @type {string}
  ###
  TITLE_FIELD: 'name'

  ###*
  # @const
  # @type {boolean}
  ###
  REQUIRE_USER: true

  ###*
  # @protected
  # @type {string}
  ###
  _username: null

  ###*
  # @protected
  # @type {Datastore}
  ###
  _datastore: null

  ###*
  # @constructor
  # @param {string} username
  ###
  constructor: (username = null) ->
    if @REQUIRE_USER and not username
      return throw new Error("#{@constructor.name} need username.")
    dbPath = __dirname + '/../../db/' + if username then username + '/' else ''
    @_username = username
    @_datastore = new Datastore({filename: dbPath + inflection.transform(@PLURAL_NAME, ['underscore', 'dasherize']) + '.db', autoload: true})

module.exports = Model
