<script setup lang="ts">
import { toRef } from 'vue'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useConfigEditor } from '../../composables/useConfigEditor'

const props = defineProps<{
  panelConfig: Panel.panelConfig
  onSaved: () => void
}>()

const emit = defineEmits<{
  (e: 'save', config: Panel.panelConfig): void
  (e: 'reset'): void
}>()

const { localConfig, handleSave, panelState } = useConfigEditor({
  config: toRef(props, 'panelConfig'),
  onSaved: props.onSaved,
  onSave: (config) => emit('save', config),
})

function handleReset() {
  panelState.setPanelConfig({})
  toast.success('已重置')
  emit('reset')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 一言设置 -->
    <Card>
      <CardHeader>
        <CardTitle>一言设置</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <Label>启用一言</Label>
          <Switch
            :model-value="localConfig.hitokotoShow ?? false"
            @update:model-value="(v: boolean) => (localConfig.hitokotoShow = v)"
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label>一言 API 地址</Label>
          <Input
            v-model="localConfig.hitokotoApiUrl"
            placeholder="https://v1.hitokoto.cn/"
          />
          <p class="text-sm text-muted-foreground">
            默认 <code>https://v1.hitokoto.cn/</code>，可自建部署
          </p>
        </div>

        <!-- 一言分类 -->
        <div class="flex flex-col gap-2">
          <Label>一言分类</Label>
          <Select
            :model-value="localConfig.hitokotoCategory ?? ''"
            @update:model-value="(v) => (localConfig.hitokotoCategory = v as string)"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">不限</SelectItem>
              <SelectItem value="a">动画</SelectItem>
              <SelectItem value="b">小说</SelectItem>
              <SelectItem value="c">游戏</SelectItem>
              <SelectItem value="d">动漫</SelectItem>
              <SelectItem value="e">其他</SelectItem>
              <SelectItem value="f">影视</SelectItem>
              <SelectItem value="g">诗词</SelectItem>
              <SelectItem value="h">网易云</SelectItem>
              <SelectItem value="i">哲学</SelectItem>
              <SelectItem value="j">抖机灵</SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">对应 hitokoto.cn 的 c 参数</p>
        </div>

        <!-- 文字对齐 -->
        <div class="flex flex-col gap-2">
          <Label>文字对齐</Label>
          <Select
            :model-value="localConfig.hitokotoAlign ?? 'center'"
            @update:model-value="
              (v) => (localConfig.hitokotoAlign = v as Panel.panelConfig['hitokotoAlign'])
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择对齐方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="center">居中</SelectItem>
              <SelectItem value="left">左对齐</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 打字机效果开关 -->
        <div class="flex items-center justify-between">
          <Label>打字机效果</Label>
          <Switch
            :model-value="localConfig.hitokotoTypewriter ?? false"
            @update:model-value="(v: boolean) => (localConfig.hitokotoTypewriter = v)"
          />
        </div>

        <!-- 打字速度 -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label>打字速度</Label>
            <span class="text-sm text-muted-foreground">
              {{ localConfig.hitokotoTypewriterSpeed ?? 10 }} 字/秒
            </span>
          </div>
          <Slider
            :model-value="[localConfig.hitokotoTypewriterSpeed ?? 10]"
            @update:model-value="
              (v: number[] | undefined) =>
                (localConfig.hitokotoTypewriterSpeed = v?.[0] ?? 10)
            "
            :min="1"
            :max="50"
            :step="1"
          />
        </div>

        <!-- 光标样式 -->
        <div class="flex flex-col gap-2">
          <Label>光标样式</Label>
          <Select
            :model-value="localConfig.hitokotoTypewriterCursor ?? 'blink'"
            @update:model-value="
              (v) =>
                (localConfig.hitokotoTypewriterCursor = v as Panel.panelConfig['hitokotoTypewriterCursor'])
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择光标样式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无</SelectItem>
              <SelectItem value="block">块状</SelectItem>
              <SelectItem value="blink">闪烁</SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">仅"逐字"动画下生效</p>
        </div>

        <!-- 动画方式 -->
        <div class="flex flex-col gap-2">
          <Label>动画方式</Label>
          <Select
            :model-value="localConfig.hitokotoTypewriterAnimation ?? 'type'"
            @update:model-value="
              (v) =>
                (localConfig.hitokotoTypewriterAnimation = v as Panel.panelConfig['hitokotoTypewriterAnimation'])
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择动画方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">逐字</SelectItem>
              <SelectItem value="fade">淡入</SelectItem>
              <SelectItem value="slide">滑入</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 自动轮播开关 -->
        <div class="flex items-center justify-between">
          <Label>自动轮播</Label>
          <Switch
            :model-value="localConfig.hitokotoAutoSwitch ?? false"
            @update:model-value="(v: boolean) => (localConfig.hitokotoAutoSwitch = v)"
          />
        </div>

        <!-- 轮播间隔 -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label>轮播间隔</Label>
            <span class="text-sm text-muted-foreground">
              {{ localConfig.hitokotoAutoSwitchInterval ?? 30 }} 秒
            </span>
          </div>
          <Slider
            :model-value="[localConfig.hitokotoAutoSwitchInterval ?? 30]"
            @update:model-value="
              (v: number[] | undefined) =>
                (localConfig.hitokotoAutoSwitchInterval = v?.[0] ?? 30)
            "
            :min="5"
            :max="300"
            :step="5"
          />
        </div>

        <!-- 切换过渡时长 -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label>切换过渡时长</Label>
            <span class="text-sm text-muted-foreground">
              {{ localConfig.hitokotoTransitionDuration ?? 0.3 }} 秒
            </span>
          </div>
          <Slider
            :model-value="[localConfig.hitokotoTransitionDuration ?? 0.3]"
            @update:model-value="
              (v: number[] | undefined) =>
                (localConfig.hitokotoTransitionDuration = v?.[0] ?? 0.3)
            "
            :min="0"
            :max="2"
            :step="0.1"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 音乐播放器设置 -->
    <Card>
      <CardHeader>
        <CardTitle>音乐播放器设置</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <Label>启用音乐播放器</Label>
          <Switch
            :model-value="localConfig.musicShow ?? false"
            @update:model-value="(v: boolean) => (localConfig.musicShow = v)"
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label>音乐数据源</Label>
          <Select
            :model-value="localConfig.musicServer"
            @update:model-value="
              (v) => (localConfig.musicServer = v as Panel.panelConfig['musicServer'])
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择数据源" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="netease">网易云</SelectItem>
              <SelectItem value="tencent">QQ 音乐</SelectItem>
              <SelectItem value="kugou">酷狗</SelectItem>
              <SelectItem value="baidu">百度</SelectItem>
              <SelectItem value="kuwo">酷我</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-2">
          <Label>资源类型</Label>
          <Select
            :model-value="localConfig.musicType"
            @update:model-value="
              (v) => (localConfig.musicType = v as Panel.panelConfig['musicType'])
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择资源类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="song">单曲</SelectItem>
              <SelectItem value="playlist">歌单</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-2">
          <Label>单曲/歌单 ID</Label>
          <Input v-model="localConfig.musicId" placeholder="输入单曲或歌单 ID" />
        </div>

        <div class="flex flex-col gap-2">
          <Label>Meting API 地址</Label>
          <Input
            v-model="localConfig.musicApiUrl"
            placeholder="https://api.moeyao.cn/meting/"
          />
          <p class="text-sm text-muted-foreground">
            默认 <code>https://api.moeyao.cn/meting/</code>，可自建部署（参考 metowolf/Meting）
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label>自动播放</Label>
            <Switch
              :model-value="localConfig.musicAutoplay ?? false"
              @update:model-value="(v: boolean) => (localConfig.musicAutoplay = v)"
            />
          </div>
          <p class="text-sm text-muted-foreground">受浏览器策略限制可能无效</p>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label>默认音量</Label>
            <span class="text-sm text-muted-foreground">
              {{ localConfig.musicVolume ?? 0.7 }}
            </span>
          </div>
          <Slider
            :model-value="[localConfig.musicVolume ?? 0.7]"
            @update:model-value="
              (v: number[] | undefined) => (localConfig.musicVolume = v?.[0] ?? 0.7)
            "
            :min="0"
            :max="1"
            :step="0.1"
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label>循环模式</Label>
          <Select
            :model-value="localConfig.musicLoop"
            @update:model-value="
              (v) => (localConfig.musicLoop = v as Panel.panelConfig['musicLoop'])
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择循环模式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">列表循环</SelectItem>
              <SelectItem value="one">单曲循环</SelectItem>
              <SelectItem value="none">不循环</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-2">
          <Label>播放顺序</Label>
          <Select
            :model-value="localConfig.musicOrder"
            @update:model-value="
              (v) => (localConfig.musicOrder = v as Panel.panelConfig['musicOrder'])
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择播放顺序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">顺序播放</SelectItem>
              <SelectItem value="random">随机播放</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <div class="flex justify-end gap-2">
      <Button variant="outline" @click="handleReset">重置</Button>
      <Button @click="handleSave">保存</Button>
    </div>
  </div>
</template>
