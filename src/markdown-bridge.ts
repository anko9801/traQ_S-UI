import store from '@/store'
import { UserId, UserGroupId } from '@/types/entity-ids'
import router from './router'

interface ExtendedWindow extends Window {
  /**
   * ユーザーモーダルを開く
   * markdown本文に埋め込まれるリンク(`@user`)から呼び出す
   * @param userId ユーザーID
   */
  openUserModal(userId: string): void

  /**
   * グループモーダルを開く
   * markdown本文に埋め込まれるリンク(`@group`)から呼び出す
   * @param userGroupId ユーザーグループID
   */
  openGroupModal(userGroupId: string): void

  /**
   * チャンネルを切り替える
   * markdown本文に埋め込まれるリンク(`#channel`)から呼び出す
   * @param channelPath チャンネルのパス(`#`は含まない、`/`区切り)
   */
  changeChannel(channelPath: string): void
}
declare const window: ExtendedWindow

export const setupGlobalFuncs = () => {
  window.openUserModal = (userId: UserId) => {
    store.dispatch.ui.modal.pushModal({
      type: 'user',
      id: userId
    })
  }

  window.openGroupModal = (userGroupId: UserGroupId) => {
    store.dispatch.ui.modal.pushModal({
      type: 'group',
      id: userGroupId
    })
  }

  window.changeChannel = (channelPath: string) => {
    // 同じ場所に移動しようとした際のエラーを消す
    router.push(`/channels/${channelPath}`).catch(() => {})
  }
}
