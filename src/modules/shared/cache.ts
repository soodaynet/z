/**
 * 极简 TTL 内存缓存工具
 *
 * 用于读多写少的非持久化数据（site config / public visit user / jwt-key / settings:all 等），
 * 不引入 KV / R2 / 其他持久化存储（符合 D1 唯一持久化约束）。
 *
 * 设计取舍：
 * - 基于模块级 Map，进程/Worker 实例内有效，重启即失。
 * - 过期判定惰性执行（get 时检查），不另起定时器，减少 Workers CPU 占用。
 * - 无大小上限，单实例仅缓存少量 key；若 key 数增长需加 LRU。
 */

// ponytail: 模块级 Map 无大小上限，当前仅 site-config / public-visit / jwt-key 几个 key，若 key 数增长需加 LRU
const store = new Map<string, { value: unknown; expiresAt: number }>()

interface Entry<T> {
  value: T
  expiresAt: number
}

/** 读取缓存值，未命中或已过期返回 undefined */
export function get<T>(key: string): T | undefined {
  const entry = store.get(key) as Entry<T> | undefined
  if (!entry) return undefined
  // 单调时钟过期判定
  if (Date.now() >= entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

/** 写入缓存值，ttlSeconds 为存活秒数 */
export function set<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

/** 主动失效单个 key */
export function invalidate(key: string): void {
  store.delete(key)
}

/** 按前缀批量失效 */
export function invalidateByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}

// ========== 自检：仅在 DEV / TEST 环境运行 ==========
// ponytail: assert 风格自检，无测试框架依赖，CI 不触发
const RUN_SELF_CHECK =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: Record<string, unknown> }).env?.DEV === true) ||
  typeof (globalThis as { __TEST__?: unknown }).__TEST__ !== 'undefined'

if (RUN_SELF_CHECK) {
  function assert(cond: unknown, msg: string): asserts cond {
    if (!cond) throw new Error(`cache self-check failed: ${msg}`)
  }

  // set/get 命中
  set('__selfcheck_hit__', { v: 42 }, 60)
  assert(get<{ v: number }>('__selfcheck_hit__')?.v === 42, 'set/get hit')

  // TTL 过期返回 undefined（人为写入已过期 entry）
  store.set('__selfcheck_exp__', { value: 1, expiresAt: Date.now() - 1 })
  assert(get<number>('__selfcheck_exp__') === undefined, 'ttl expiry returns undefined')

  // invalidateByPrefix 批量失效
  set('__selfcheck_pfx_a__', 1, 60)
  set('__selfcheck_pfx_b__', 2, 60)
  set('__other__', 3, 60)
  invalidateByPrefix('__selfcheck_pfx_')
  assert(get<number>('__selfcheck_pfx_a__') === undefined, 'invalidateByPrefix a')
  assert(get<number>('__selfcheck_pfx_b__') === undefined, 'invalidateByPrefix b')
  assert(get<number>('__other__') === 3, 'invalidateByPrefix keeps unrelated')

  // 清理自检 key
  invalidate('__other__')
}
