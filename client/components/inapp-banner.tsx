"use client"

import { InAppBrowserType } from "@/hooks/use-inapp-browser"

type Props = {
  kind: InAppBrowserType
}

const messageByKind: Record<InAppBrowserType, string> = {
  kakaotalk:
    "⚠️ 원활한 로그인을 위해 카카오톡 우측 하단 메뉴(⋯) → '다른 브라우저로 열기'를 선택해주세요."
}

export function InAppBrowserBanner({ kind }: Props) {
  return (
    <div className="mb-4 rounded-md border border-yellow-300/50 bg-yellow-100/20 p-3 text-yellow-200">
      <p className="text-sm leading-relaxed">{messageByKind[kind]}</p>
    </div>
  )
}


