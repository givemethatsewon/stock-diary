import { useEffect, useState } from "react"

export type InAppBrowserType = "kakaotalk"

export function useInAppBrowserDetection() {
  const [inAppBrowser, setInAppBrowser] = useState<InAppBrowserType | null>(null)

  useEffect(() => {
    if (typeof navigator === "undefined") return

    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes("kakaotalk")) {
      setInAppBrowser("kakaotalk")
      return
    }

  }, [])

  return {
    isInAppBrowser: inAppBrowser !== null,
    inAppBrowser,
  }
}


