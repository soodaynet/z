<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { getHitokoto } from '@/modules'
import { usePanelState } from '@/store'

const panelState = usePanelState()

// 文本与出处
const hitokotoText = ref('')
const hitokotoFrom = ref('')
const loading = ref(false)

// 切换过渡：'show' 展示内容，'fading' 旧内容淡出中
const phase = ref<'show' | 'fading'>('show')

// 打字机状态：已显示字符数
const displayedCount = ref(0)
let typewriterTimer: ReturnType<typeof setTimeout> | null = null

// 自动轮播计时器
let autoSwitchTimer: ReturnType<typeof setInterval> | null = null

// 切换过渡计时器
let transitionTimer: ReturnType<typeof setTimeout> | null = null

// 配置项（带默认值）
const align = computed(() => panelState.panelConfig.hitokotoAlign || 'center')
const typewriterEnabled = computed(() => !!panelState.panelConfig.hitokotoTypewriter)
const typewriterSpeed = computed(() => panelState.panelConfig.hitokotoTypewriterSpeed || 10)
const typewriterCursor = computed(
  () => panelState.panelConfig.hitokotoTypewriterCursor || 'blink',
)
const typewriterAnimation = computed(
  () => panelState.panelConfig.hitokotoTypewriterAnimation || 'type',
)
const autoSwitchEnabled = computed(() => !!panelState.panelConfig.hitokotoAutoSwitch)
const autoSwitchInterval = computed(
  () => panelState.panelConfig.hitokotoAutoSwitchInterval ?? 30,
)
const transitionDuration = computed(
  () => panelState.panelConfig.hitokotoTransitionDuration ?? 0.3,
)

// 用 Array.from 处理代理对，逐字拆分
const chars = computed(() => Array.from(hitokotoText.value))

// 打字机已显示的字符子串
const displayedText = computed(() => chars.value.slice(0, displayedCount.value).join(''))

// 是否处于打字机渲染中
const isTyping = computed(
  () => typewriterEnabled.value && displayedCount.value < chars.value.length,
)

// 拉取一条随机一言：失败静默，保留上次成功内容
async function fetchHitokoto() {
  if (loading.value) return
  loading.value = true
  try {
    const data = await getHitokoto({
      apiUrl: panelState.panelConfig.hitokotoApiUrl,
      categories: panelState.panelConfig.hitokotoCategory
        ? [panelState.panelConfig.hitokotoCategory]
        : [],
    })
    const newText = data.hitokoto || ''
    const who = data.from_who?.trim()
    const from = data.from?.trim()
    let newFrom = ''
    if (who) newFrom = who
    else if (from) newFrom = `《${from}》`

    // fetch 成功后：先淡出旧内容，过渡结束后再渲染新内容并启动打字机
    phase.value = 'fading'
    // 停止打字机计时（保留已显示字符，淡出时视觉不消失）
    if (typewriterTimer) {
      clearTimeout(typewriterTimer)
      typewriterTimer = null
    }
    if (transitionTimer) clearTimeout(transitionTimer)
    transitionTimer = setTimeout(() => {
      hitokotoText.value = newText
      hitokotoFrom.value = newFrom
      phase.value = 'show'
      startTypewriter()
    }, transitionDuration.value * 1000)
  } catch {
    // 静默失败，保留上次内容（phase 保持 'show'）
  } finally {
    loading.value = false
  }
}

// 启动打字机：typewriter 关闭时直接显示全部文本
function startTypewriter() {
  if (typewriterTimer) {
    clearTimeout(typewriterTimer)
    typewriterTimer = null
  }
  displayedCount.value = 0
  if (!typewriterEnabled.value) {
    displayedCount.value = chars.value.length
    return
  }
  const total = chars.value.length
  if (total === 0) return
  const delay = Math.max(1, 1000 / Math.max(1, typewriterSpeed.value))
  function tick() {
    if (displayedCount.value < total) {
      displayedCount.value += 1
      typewriterTimer = setTimeout(tick, delay)
    } else {
      typewriterTimer = null
    }
  }
  typewriterTimer = setTimeout(tick, delay)
}

// 设置自动轮播计时器
function setupAutoSwitch() {
  if (autoSwitchTimer) {
    clearInterval(autoSwitchTimer)
    autoSwitchTimer = null
  }
  if (autoSwitchEnabled.value && autoSwitchInterval.value > 0) {
    autoSwitchTimer = setInterval(fetchHitokoto, autoSwitchInterval.value * 1000)
  }
}

// 手动刷新：拉取新内容并重置自动轮播计时器
function handleRefresh() {
  fetchHitokoto()
  setupAutoSwitch()
}

// 监听自动轮播配置变化，重新设置计时器
watch([autoSwitchEnabled, autoSwitchInterval], () => {
  setupAutoSwitch()
})

onMounted(() => {
  fetchHitokoto()
  setupAutoSwitch()
})

onBeforeUnmount(() => {
  if (typewriterTimer) clearTimeout(typewriterTimer)
  if (transitionTimer) clearTimeout(transitionTimer)
  if (autoSwitchTimer) clearInterval(autoSwitchTimer)
})
</script>

<template>
  <div
    class="hitokoto-bar mx-auto mb-4 max-w-3xl flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/90"
    :class="{ 'is-fading': phase === 'fading' }"
    :style="{ '--hitokoto-transition': transitionDuration + 's' }"
  >
    <div
      class="flex-1 min-w-0 truncate"
      :class="align === 'center' ? 'text-center' : 'text-left'"
    >
      <template v-if="typewriterEnabled">
        <!-- type：直接渲染已显示子串 + 光标 -->
        <span v-if="typewriterAnimation === 'type'" class="tw-text">{{ displayedText }}</span>
        <!-- fade / slide：逐字渲染，每字带过渡 -->
        <span v-else class="tw-chars">
          <span
            v-for="(ch, i) in chars"
            :key="i"
            class="tw-char"
            :class="[
              typewriterAnimation === 'fade' ? 'tw-char--fade' : 'tw-char--slide',
              i < displayedCount ? 'is-shown' : '',
            ]"
          >{{ ch }}</span>
        </span>
        <!-- 光标：仅 type 动画且正在打字时显示 -->
        <span
          v-if="typewriterAnimation === 'type' && typewriterCursor !== 'none' && isTyping"
          class="tw-cursor"
          :class="{ 'tw-cursor--blink': typewriterCursor === 'blink' }"
        >▍</span>
      </template>
      <template v-else>
        <span v-if="hitokotoText">{{ hitokotoText }}</span>
        <span v-else class="text-white/50">加载中...</span>
      </template>
      <span
        v-if="hitokotoFrom && !isTyping"
        class="ml-2 text-white/60 text-xs"
      >—— {{ hitokotoFrom }}</span>
    </div>
    <button
      type="button"
      class="hitokoto-refresh flex-shrink-0 text-white/70 hover:text-white transition-colors"
      title="换一句"
      :disabled="loading"
      @click="handleRefresh"
    >
      <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />
    </button>
  </div>
</template>

<style scoped>
/* 切换过渡：opacity 由 phase 控制，时长由 --hitokoto-transition 决定 */
.hitokoto-bar {
  transition: opacity var(--hitokoto-transition, 0.3s) ease;
}
.hitokoto-bar.is-fading {
  opacity: 0;
}
.hitokoto-refresh {
  cursor: pointer;
}
.hitokoto-refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}
/* 打字机光标（仅 type 动画）：block 为实心块，blink 为闪烁 */
.tw-cursor {
  display: inline-block;
  margin-left: 1px;
  color: rgba(255, 255, 255, 0.95);
}
.tw-cursor--blink {
  animation: tw-blink 1s steps(2, start) infinite;
}
@keyframes tw-blink {
  to {
    opacity: 0;
  }
}
/* fade / slide 逐字过渡 */
.tw-char {
  opacity: 0;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.tw-char.is-shown {
  opacity: 1;
}
.tw-char--slide {
  transform: translateY(8px);
}
.tw-char--slide.is-shown {
  transform: translateY(0);
}
</style>
