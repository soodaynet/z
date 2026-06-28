import type { ModuleDefinition } from '../types'
import { router } from './routes'

export const musicModule: ModuleDefinition = {
  name: 'music',
  mountPath: '/panel/music',
  router,
}
