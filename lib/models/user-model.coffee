core = require '../core'
SingleModel = require './single-model'

class UserModel extends SingleModel

  ###*
  # @override
  ###
  PLURAL_NAME: 'users'

  ###*
  # @override
  ###
  DEFAULT_DOC: {}

  ###*
  # @public
  # @static
  # @param {function} callback
  ###
  s_loadRemote: (callback) =>
    userStore = core.client.getUserStore()
    userStore.getUser callback

module.exports = UserModel
