import { useEffect, useRef, useState, useCallback } from "react";
import { notificationService, type Notification as AppNotification } from "../services/index";

/**
 * Affiche une notification BUREAU native (comme WhatsApp) au coin de l'écran
 * dès qu'une nouvelle notification arrive côté serveur.
 *
 * - Demande la permission au navigateur (API Web Notifications).
 * - Interroge le backend toutes les `intervalMs` millisecondes.
 * - À la première lecture, mémorise l'ID le plus récent (baseline) pour ne PAS
 *   ré-afficher les anciennes notifications.
 * - Ensuite, chaque notification d'ID supérieur déclenche un popup bureau.
 *
 * Renvoie { permission, requestPermission, unread } pour l'UI (badge, bouton).
 */
const ICON = "/armoiries-maroc.png";
const POLL_MS = 25000; // 25s

type Perm = "default" | "granted" | "denied" | "unsupported";

export function useDesktopNotifications(enabled: boolean, intervalMs: number = POLL_MS) {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState<Perm>(
    supported ? (Notification.permission as Perm) : "unsupported"
  );
  const [unread, setUnread] = useState(0);
  const lastSeenId = useRef<number | null>(null);

  const requestPermission = useCallback(async () => {
    if (!supported) return "unsupported" as Perm;
    try {
      const res = await Notification.requestPermission();
      setPermission(res as Perm);
      return res as Perm;
    } catch {
      return permission;
    }
  }, [supported, permission]);

  // Demande la permission une fois (best effort) quand l'utilisateur est connecté
  useEffect(() => {
    if (enabled && supported && Notification.permission === "default") {
      // certains navigateurs exigent un geste utilisateur ; on tente quand même
      requestPermission();
    }
  }, [enabled, supported, requestPermission]);

  // Affiche un popup bureau
  const popup = useCallback((n: AppNotification) => {
    if (!supported || Notification.permission !== "granted") return;
    try {
      const notif = new Notification(n.title || "ميزان", {
        body: n.message || "",
        icon: ICON,
        badge: ICON,
        tag: `mizan-notif-${n.id}`,   // évite les doublons
      });
      notif.onclick = () => {
        window.focus();
        try { window.location.assign("/notifications"); } catch {}
        notif.close();
      };
    } catch {
      /* ignore */
    }
  }, [supported]);

  // Polling
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const data = await notificationService.list(1);
        if (!alive) return;
        const items: AppNotification[] = (data as any)?.items ?? [];
        setUnread(items.filter((i) => !i.is_read).length);
        if (items.length === 0) return;

        const maxId = Math.max(...items.map((i) => i.id));
        // Première lecture : on fixe la baseline sans afficher de popup
        if (lastSeenId.current === null) {
          lastSeenId.current = maxId;
          return;
        }
        // Nouvelles notifications (ID > baseline) → popups, de la plus ancienne à la plus récente
        const fresh = items
          .filter((i) => i.id > (lastSeenId.current as number) && !i.is_read)
          .sort((a, b) => a.id - b.id);
        fresh.forEach(popup);
        if (maxId > (lastSeenId.current as number)) lastSeenId.current = maxId;
      } catch {
        /* hors-ligne ou non connecté : on réessaiera */
      }
    };

    poll();                          // immédiat
    timer = setInterval(poll, intervalMs);
    // re-poll quand l'onglet redevient visible
    const onVis = () => { if (document.visibilityState === "visible") poll(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, intervalMs, popup]);

  return { supported, permission, requestPermission, unread };
}

export default useDesktopNotifications;