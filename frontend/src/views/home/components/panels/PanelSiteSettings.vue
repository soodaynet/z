<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { saveSiteSettings } from '@/modules'

const props = defineProps<{
  siteConfig: Panel.SiteConfig
}>()

const emit = defineEmits<{
  (e: 'update:siteConfig', config: Panel.SiteConfig): void
}>()

const localSiteConfig = ref<Panel.SiteConfig>({})

function syncSiteConfig() {
  localSiteConfig.value = { ...props.siteConfig }
}

watch(
  () => props.siteConfig,
  () => syncSiteConfig(),
  { immediate: true, deep: true },
)

async function handleSave() {
  try {
    const res = await saveSiteSettings({
      site_title: localSiteConfig.value.site_title || '',
      login_bg_image: localSiteConfig.value.login_bg_image || '',
      login_blur: String(localSiteConfig.value.login_blur ?? 12),
      login_mask_opacity: String(localSiteConfig.value.login_mask_opacity ?? 0.15),
      favicon_url: localSiteConfig.value.favicon_url || '',
    })
    if (res.code === 0) {
      emit('update:siteConfig', { ...localSiteConfig.value })
      toast.success('站点设置已保存')
    } else toast.error(res.msg || '保存失败')
  } catch {
    toast.error('保存失败')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <CardHeader>
        <CardTitle>站点信息</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label>站点标题 (浏览器标签页)</Label>
          <Input v-model="localSiteConfig.site_title" placeholder="站点标题" />
        </div>
        <div class="flex flex-col gap-2">
          <Label>网站图标 URL (favicon)</Label>
          <Input v-model="localSiteConfig.favicon_url" placeholder="输入图标URL，显示在浏览器标签页上" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>登录页设置</CardTitle>
        <CardDescription>控制登录页卡片背景的模糊和透明度效果</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label>登录页背景图片</Label>
          <Input v-model="localSiteConfig.login_bg_image" placeholder="输入图片URL" />
        </div>
        <div class="flex flex-col gap-2">
          <Label>登录卡片背景模糊度: {{ localSiteConfig.login_blur ?? 12 }}</Label>
          <Slider
            :model-value="[localSiteConfig.login_blur ?? 12]"
            @update:model-value="(v: number[] | undefined) => (localSiteConfig.login_blur = v?.[0] ?? 12)"
            :min="0"
            :max="40"
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label>登录卡片遮罩不透明度: {{ localSiteConfig.login_mask_opacity ?? 0.15 }}</Label>
          <Slider
            :model-value="[localSiteConfig.login_mask_opacity ?? 0.15]"
            @update:model-value="(v: number[] | undefined) => (localSiteConfig.login_mask_opacity = v?.[0] ?? 0.15)"
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
