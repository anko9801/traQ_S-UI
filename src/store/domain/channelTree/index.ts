import { defineModule } from 'direct-vuex'
import { state } from './state'
import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'
import { defineEntityListeners, defineMeListeners } from './listeners'
import mitt from 'mitt'
import { ChannelId } from '/@/types/entity-ids'
import router, { rewriteChannelPath } from '/@/router'

export const channelTree = defineModule({
  namespaced: true,
  state,
  getters,
  mutations,
  actions
})
defineEntityListeners(store => store.domain.channelTree)
defineMeListeners(store => store.domain.channelTree)

type ChannelTreeEventMap = {
  created: { id: ChannelId; path: string }
  moved: { id: ChannelId; newPath: string; oldPath: string }
}

export const channelTreeMitt = mitt<ChannelTreeEventMap>()

// 循環参照を回避するためにこっちに書く
channelTreeMitt.on('moved', ({ oldPath, newPath }) => {
  const nowPath = router.currentRoute.value.path
  const rewrittenPath = rewriteChannelPath(nowPath, { oldPath, newPath })
  if (rewrittenPath === null) {
    return
  }

  router.replace({
    path: rewrittenPath
  })
})
