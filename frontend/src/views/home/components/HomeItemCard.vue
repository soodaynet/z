<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  item: Panel.ItemInfo
  editable: boolean
  isEditMode: boolean
  /** 是否在首屏可见，预加载图标 */
  eagerLoad?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', item: Panel.ItemInfo): void
  (e: 'edit', item: Panel.ItemInfo): void
  (e: 'delete', item: Panel.ItemInfo): void
}>()

const errored = ref(false)

const realIconSrc = computed(() => props.item.icon?.src || '')
</script>

<template>
  <div
    class="group-item w-20 h-20 sm:w-[88px] sm:h-[88px] md:w-24 md:h-24 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all hover:scale-105 relative glass-hover"
    style="contain: layout style"
    @click="emit('click', item)"
  >
    <div class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg overflow-hidden flex items-center justify-center mb-1">
      <img
        v-if="item.icon?.src"
        v-show="!errored"
        :src="realIconSrc"
        class="w-full h-full object-cover rounded-lg"
        :alt="item.title"
        width="40"
        height="40"
        :loading="eagerLoad ? 'eager' : 'lazy'"
        decoding="async"
        :fetchpriority="eagerLoad ? 'high' : 'auto'"
        referrerpolicy="no-referrer"
        style="image-rendering: auto;"
        @error="errored = true"
      />
      <div
        v-if="!item.icon?.src || errored"
        class="w-full h-full rounded-lg flex items-center justify-center text-white font-bold text-lg"
        :style="{ backgroundColor: item.icon?.backgroundColor || '#4a90d9' }"
      >
        {{ item.icon?.text || item.title?.charAt(0) || '?' }}
      </div>
    </div>
    <span class="text-white text-[11px] sm:text-xs text-center line-clamp-2 px-1">{{ item.title }}</span>

    <!-- 编辑模式下显示编辑/删除按钮 -->
    <div v-if="editable && isEditMode" class="absolute top-1 right-1 flex gap-1">
      <Button
        size="icon"
        variant="secondary"
        title="编辑"
        class="h-6 w-6"
        @click.stop="emit('edit', item)"
      >✎</Button>
      <Button
        size="icon"
        variant="destructive"
        title="删除"
        class="h-6 w-6"
        @click.stop="emit('delete', item)"
      >✕</Button>
    </div>
  </div>
</template>
