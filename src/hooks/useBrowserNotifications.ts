"use client";

import { useCallback, useEffect, useState } from "react";

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!("Notification" in window)) return;
      if (permission !== "granted") return;
      if (document.visibilityState === "visible") return; // Only notify when tab is not active

      const notification = new Notification(title, {
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    },
    [permission]
  );

  const notifyBuildComplete = useCallback(
    (appName: string) => {
      sendNotification("Build Complete! 🎉", {
        body: `${appName} is ready for download`,
        tag: "build-complete",
      });
    },
    [sendNotification]
  );

  const notifyBuildFailed = useCallback(
    (appName: string, error?: string) => {
      sendNotification("Build Failed", {
        body: error || `${appName} build encountered an error`,
        tag: "build-failed",
      });
    },
    [sendNotification]
  );

  return {
    permission,
    isSupported: "Notification" in window,
    requestPermission,
    sendNotification,
    notifyBuildComplete,
    notifyBuildFailed,
  };
};
