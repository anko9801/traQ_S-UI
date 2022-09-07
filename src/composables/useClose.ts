import {
  constructChannelPath,
  constructClipFoldersPath,
  constructUserPath
} from '/@/router'
import { useRouter } from 'vue-router'
import { useBrowserSettings } from '/@/store/app/browserSettings'
import useChannelPath from '/@/composables/useChannelPath'
import { useMainViewStore } from '/@/store/ui/mainView'

const useClose = () => {
  const router = useRouter()

  const { primaryView } = useMainViewStore()
  const { lastOpenChannelName } = useBrowserSettings()
  const { channelIdToPathString } = useChannelPath()

  const close = () => {
    switch (primaryView.value.type) {
      case 'channel':
        router.push(
          constructChannelPath(
            channelIdToPathString(primaryView.value.channelId)
          )
        )
        break
      case 'clips':
        router.push(constructClipFoldersPath(primaryView.value.clipFolderId))
        break
      case 'dm':
        router.push(constructUserPath(primaryView.value.userName))
        break
      case 'qall':
        // TODO(sapphi-red): PrimaryViewにqallが来ることは想定していないが、とりあえず書く
        router.push(constructChannelPath(lastOpenChannelName.value))
        break
      default: {
        const check: never = primaryView.value
        throw new Error(`Unknown view type:${check}`)
      }
    }
  }
  return { close }
}
export default useClose
