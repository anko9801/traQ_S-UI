import useMessageFetcher from '/@/components/Main/MainView/MessagesScroller/composables/useMessagesFetcher'
import { MessageId, ClipFolderId } from '/@/types/entity-ids'
import {
  reactive,
  Ref,
  watch,
  onMounted,
  onActivated,
  onBeforeUnmount
} from 'vue'
import useFetchLimit from '/@/components/Main/MainView/MessagesScroller/composables/useFetchLimit'
import { wsListener } from '/@/lib/websocket'
import {
  ClipFolderMessageAddedEvent,
  ClipFolderMessageDeletedEvent
} from '/@/lib/websocket/events'
import { useMessagesView } from '/@/store/domain/messagesView'
import { useMessagesStore } from '/@/store/entities/messages'

/** 一つのメッセージの最低の高さ (CSSに依存) */
const MESSAGE_HEIGHT = 80

const useClipsFetcher = (
  scrollerEle: Ref<{ $el: HTMLDivElement } | undefined>,
  props: {
    clipFolderId: ClipFolderId
    entryMessageId?: MessageId
  }
) => {
  const { fetchMessagesInClipFolder, syncViewState } = useMessagesView()
  const { fetchMessage } = useMessagesStore()
  const { fetchLimit, waitHeightResolved } = useFetchLimit(
    scrollerEle,
    MESSAGE_HEIGHT
  )
  const state = reactive({
    nextLoadOffset: 0
  })

  const reset = () => {
    messagesFetcher.reset()
    state.nextLoadOffset = 0
  }
  const init = () => {
    messagesFetcher.init()
  }

  const fetchFormerMessages = async (isReachedEnd: Ref<boolean>) => {
    await waitHeightResolved
    const { clips, hasMore } = await fetchMessagesInClipFolder({
      folderId: props.clipFolderId,
      limit: fetchLimit.value,
      offset: state.nextLoadOffset
    })

    if (!hasMore) {
      isReachedEnd.value = true
    } else {
      state.nextLoadOffset += fetchLimit.value
    }

    return clips.map(clip => clip.message.id)
  }

  const messagesFetcher = useMessageFetcher(
    {},
    fetchFormerMessages,
    undefined,
    undefined,
    undefined
  )

  onMounted(() => {
    reset()
    init()

    syncViewState()
  })
  watch(
    () => props.clipFolderId,
    (newVal, oldVal) => {
      if (newVal === oldVal) {
        return
      }
      reset()
      init()
    }
  )

  onActivated(() => {
    // 一応送りなおす
    syncViewState()
  })

  // クリップフォルダは、wsの再接続時にうまく取得ができないので、
  // 自動で再取得するのはあきらめる
  const onAdded = async ({
    folder_id,
    message_id
  }: ClipFolderMessageAddedEvent) => {
    if (props.clipFolderId !== folder_id) return

    await fetchMessage({
      messageId: message_id
    })
    messagesFetcher.addNewMessage(message_id)
  }
  const onDeleted = ({
    folder_id,
    message_id
  }: ClipFolderMessageDeletedEvent) => {
    if (props.clipFolderId !== folder_id) return

    const index = messagesFetcher.messageIds.value.indexOf(message_id)
    if (index === -1) return
    messagesFetcher.messageIds.value.splice(index, 1)
  }
  onMounted(() => {
    wsListener.on('CLIP_FOLDER_MESSAGE_ADDED', onAdded)
    wsListener.on('CLIP_FOLDER_MESSAGE_DELETED', onDeleted)
  })
  onBeforeUnmount(() => {
    wsListener.off('CLIP_FOLDER_MESSAGE_ADDED', onAdded)
    wsListener.off('CLIP_FOLDER_MESSAGE_DELETED', onDeleted)
  })

  return messagesFetcher
}

export default useClipsFetcher