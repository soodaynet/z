<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { getHitokoto } from '@/modules'
import { usePanelState } from '@/store'

const panelState = usePanelState()

const hitokotoText = ref('')
const hitokotoFrom = ref('')
const loading = ref(false)

// 拉取一条随机一言：失败静默，保留上次成功内容
async function fetchHitokoto() {
  if (loading.value) return
  loading.value = true
  try {
    // getHitokoto 直连上游，返回裸 HitokotoData（不再有 code/msg/data 包装）
    const data = await getHitokoto({ apiUrl: panelState.panelConfig.hitokotoApiUrl })
    hitokotoText.value = data.hitokoto || ''
    // 出处优先 from_who，否则用 from；from 非空时加书名号
    const who = data.from_who?.trim()
    const from = data.from?.trim()
    if (who) hitokotoFrom.value = who
    else if (from) hitokotoFrom.value = `《${from}》`
    else hitokotoFrom.value = ''
  } catch {
    // 静默失败，保留上次内容
  } finally {
    loading.value = false
  }
}

onMounted(fetchHitokoto)
</script>

<template>
  <div
    class="hitokoto-bar mx-auto mb-4 max-w-3xl flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/90"
  >
    <div class="flex-1 min-w-0 truncate">
      <span v-if="hitokotoText">{{ hitokotoText }}</span>
      <span v-else class="text-white/50">加载中...</span>
      <span v-if="hitokotoFrom" class="ml-2 text-white/60 text-xs">—— {{ hitokotoFrom }}</span>
    </div>
    <button
      type="button"
      class="hitokoto-refresh flex-shrink-0 text-white/70 hover:text-white transition-colors"
      title="换一句"
      :disabled="loading"
      @click="fetchHitokoto"
    >
      <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />
    </button>
  </div>
</template>

<style scoped>
/* 毛玻璃质感：基于公告设置 --ann-blur / --ann-opacity，与 .glass-panel / .back-top-btn 风格一致 */
.hitokoto-bar {
  background-color: rgba(255, 255, 255, var(--ann-opacity, 0.15));
  backdrop-filter: blur(var(--ann-blur, 12px));
  -webkit-backdrop-filter: blur(var(--ann-blur, 12px));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}
.hitokoto-refresh {
  cursor: pointer;
}
.hitokoto-refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}
</style>
