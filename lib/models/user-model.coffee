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
  # @param {function} callback
  ###
  loadRemote: (callback) =>
    userStore = core.users[@_username].client.getUserStore()
    userStore.getUser callback

module.exports = UserModel
