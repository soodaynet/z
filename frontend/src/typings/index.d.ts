declare namespace User {
  interface Info {
    id: number
    username: string
    name: string
    headImage: string
    status: number
    role: number
    mail: string
    created_at: string
  }
}

declare namespace Panel {
  interface ItemInfo {
    id?: number
    icon: ItemIcon | null
    title: string
    url: string
    sort?: number
    description?: string
    openMethod: number
    itemIconGroupId?: number
    userId?: number
    createTime?: string
    updateTime?: string
  }

  interface ItemIconGroup {
    id?: number
    icon?: string
    title: string
    description?: string
    sort?: number
    publicVisible?: number
    userId?: number
    createTime?: string
    updateTime?: string
  }

  interface ItemIcon {
    itemType: number
    src?: string
    text?: string
    backgroundColor?: string
  }

  interface panelConfig {
    backgroundImageSrc?: string
    backgroundBlur?: number
    backgroundMaskNumber?: number
    iconStyle?: PanelPanelConfigStyleEnum
    iconTextColor?: string
    iconTextInfoHideDescription?: boolean
    iconTextIconHideTitle?: boolean
    logoText?: string
    logoImageSrc?: string
    logoPositionTop?: number
    logoPositionLeft?: number
    logoSize?: number
    clockShowSecond?: boolean
    clockColor?: string
    searchBoxShow?: boolean
    searchBoxSearchIcon?: boolean
    marginTop?: number
    marginBottom?: number
    maxWidth?: number
    maxWidthUnit?: string
    marginX?: number
    footerHtml?: string
    announcement?: string
    announcementDuration?: number
    announcementBlur?: number
    announcementMaskOpacity?: number
    systemMonitorShow?: boolean
    systemMonitorShowTitle?: boolean
    systemMonitorPublicVisitModeShow?: boolean
    // ====== 随机一言 ======
    /** 一言开关（默认 false） */
    hitokotoShow?: boolean
    /** 一言 API 地址（默认 'https://v1.hitokoto.cn/'，可自建部署） */
    hitokotoApiUrl?: string
    // ====== 音乐播放 ======
    /** 音乐播放器开关（默认 false） */
    musicShow?: boolean
    /** 数据源（默认 'netease'） */
    musicServer?: 'netease' | 'tencent' | 'kugou' | 'baidu' | 'kuwo'
    /** 资源类型：单曲或歌单（默认 'playlist'） */
    musicType?: 'song' | 'playlist'
    /** 单曲/歌单 ID（默认 ''） */
    musicId?: string
    /** Meting API 地址（默认 'https://api.moeyao.cn/meting/'） */
    musicApiUrl?: string
    /** 自动播放（默认 false，受浏览器策略限制可能无效） */
    musicAutoplay?: boolean
    /** 默认音量 0-1（默认 0.7） */
    musicVolume?: number
    /** 循环模式（默认 'all'） */
    musicLoop?: 'all' | 'one' | 'none'
    /** 播放顺序（默认 'list'） */
    musicOrder?: 'list' | 'random'
  }

  type PanelPanelConfigStyleEnum = 'text' | 'image' | 'detail'

  interface SiteConfig {
    site_title?: string
    login_bg_image?: string
    login_blur?: number
    login_mask_opacity?: number
    footer_html?: string
    logo_text?: string
    logo_image_src?: string
    favicon_url?: string
  }
}
