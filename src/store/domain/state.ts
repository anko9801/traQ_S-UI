import { ChannelId, MessageId } from '@/types/entity-ids'
import { ChannelState } from './index'

export interface S {
  channelActivity: ChannelId[]
  messageActivity: MessageId[]
  channelStateMap: Record<ChannelId, ChannelState>
}

export const state: S = {
  channelActivity: [],
  messageActivity: [],
  channelStateMap: {}
}
