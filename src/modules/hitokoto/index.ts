import type { ModuleDefinition } from '../types'
import { router } from './routes'

export const hitokotoModule: ModuleDefinition = {
  name: 'hitokoto',
  mountPath: '/panel/hitokoto',
  router,
}
