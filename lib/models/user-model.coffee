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
  # @param {string} username
  # @param {function} callback
  ###
  s_loadRemote: (username, callback) =>
    userStore = core.users[username].client.getUserStore()
    userStore.getUser callback

module.exports = UserModel
