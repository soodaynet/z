<script setup lang="ts">
import { toRef } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfigEditor } from '../../composables/useConfigEditor'

const props = defineProps<{
  panelConfig: Panel.panelConfig
  onSaved: () => void
}>()

const emit = defineEmits<{
  (e: 'save', config: Panel.panelConfig): void
}>()

const { localConfig, handleSave } = useConfigEditor({
  config: toRef(props, 'panelConfig'),
  onSaved: props.onSaved,
  onSave: (config) => emit('save', config),
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <CardHeader>
        <CardTitle>公告设置</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label>公告内容</Label>
          <Textarea
            v-model="localConfig.announcement"
            rows="3"
            placeholder="公告文字，留空不显示"
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label>公告停留时间 (秒，0为不自动消失)</Label>
          <Input
            v-model="localConfig.announcementDuration"
            type="number"
            min="0"
            max="999"
          />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Logo 设置</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label>Logo 文字</Label>
          <Input v-model="localConfig.logoText" placeholder="输入 Logo 文字" />
        </div>
        <div class="flex flex-col gap-2">
          <Label>Logo 图片 URL</Label>
          <Input v-model="localConfig.logoImageSrc" placeholder="输入图片URL" />
        </div>
        <div class="flex flex-col gap-2">
          <Label>Logo 距顶部 (px)</Label>
          <Input v-model="localConfig.logoPositionTop" type="number" />
        </div>
        <div class="flex flex-col gap-2">
          <Label>Logo 距左侧 (px)</Label>
          <Input v-model="localConfig.logoPositionLeft" type="number" />
        </div>
        <div class="flex flex-col gap-2">
          <Label>Logo 图片高度 (px)</Label>
          <Input v-model="localConfig.logoSize" type="number" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>毛玻璃效果</CardTitle>
        <CardDescription>控制侧边栏、公告弹窗、Logo 的模糊和透明度效果</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label>背景模糊度: {{ localConfig.announcementBlur ?? 12 }}</Label>
          <Slider
            :model-value="[localConfig.announcementBlur ?? 12]"
            @update:model-value="(v: number[] | undefined) => (localConfig.announcementBlur = v?.[0] ?? 12)"
            :min="0"
            :max="40"
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label>遮罩不透明度: {{ localConfig.announcementMaskOpacity ?? 0.15 }}</Label>
          <Slider
            :model-value="[localConfig.announcementMaskOpacity ?? 0.15]"
            @update:model-value="(v: number[] | undefined) => (localConfig.announcementMaskOpacity = v?.[0] ?? 0.15)"
            :min="0"
            :max="1"
            :step="0.05"
          />
        </div>
      </CardContent>
    </Card>
    <div class="flex justify-end gap-2">
      <Button @click="handleSave">保存</Button>
    </div>
  </div>
</template>
