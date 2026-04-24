import { headers } from "next/headers";

export async function getSignupDeviceContext() {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") ?? "";
  const platformHint = requestHeaders.get("sec-ch-ua-platform") ?? "";
  const isAndroid = /android/i.test(userAgent) || /android/i.test(platformHint);
  const isIos = /(iphone|ipad|ipod)/i.test(userAgent) || /ios/i.test(platformHint);

  return {
    isAndroid,
    isIos,
    showAppleOption: !isAndroid,
  };
}