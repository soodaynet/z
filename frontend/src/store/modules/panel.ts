import { defineStore } from 'pinia'
import type { PanelConfig, PanelConfigStyleEnum } from '@/modules/panel/types'

export interface PanelState {
  panelConfig: PanelConfig
}

const defaultPanelConfig: PanelConfig = {
  backgroundImageSrc: '',
  backgroundBlur: 0,
  backgroundMaskNumber: 0.3,
  iconStyle: 'text' as PanelConfigStyleEnum,
  iconTextColor: '#ffffff',
  iconTextInfoHideDescription: false,
  iconTextIconHideTitle: false,
  logoText: '',
  logoImageSrc: '',
  logoPositionTop: 16,
  logoPositionLeft: 16,
  logoSize: 48,
  clockShowSecond: true,
  clockColor: '#ffffff',
  searchBoxShow: true,
  searchBoxSearchIcon: true,
  marginTop: 40,
  marginBottom: 40,
  maxWidth: 1200,
  maxWidthUnit: 'px',
  marginX: 20,
  footerHtml: '',
  announcement: '',
  announcementDuration: 5,
  announcementBlur: 12,
  announcementMaskOpacity: 0.15,
  systemMonitorShow: false,
  systemMonitorShowTitle: true,
  systemMonitorPublicVisitModeShow: false,
}

export const usePanelState = defineStore('panel', {
  state: (): PanelState => ({
    panelConfig: { ...defaultPanelConfig },
  }),

  actions: {
    setPanelConfig(config: PanelConfig) {
      this.panelConfig = { ...defaultPanelConfig, ...config }
    },
  },
})
