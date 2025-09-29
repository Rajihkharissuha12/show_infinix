// app/ClientHome.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ScanData {
  fruit: string;
  point: number;
  totalPoint: number;
  timestamp?: number;
}

interface Item {
  name: string;
  quantity: number;
  pointsPerItem: number;
  totalPoints: number;
  lastScanned: string;
}

interface SessionData {
  sessionId: string;
  totalItems: number;
  totalPoints: number;
  items: Record<string, Item>;
  lastUpdate: number;
}

type FruitKey = "APEL" | "JERUK" | "PISANG" | "MANGGA" | "DEFAULT";

const fruitTheme: Record<
  FruitKey,
  {
    name: string;
    emoji: string;
    bgGradFrom: string;
    bgGradTo: string;
    accent: string;
    ring: string;
    pillBg: string;
    pillText: string;
    nutrition: Array<{ label: string; percent: number }>;
    benefits: string[];
    imageUrl: string;
  }
> = {
  APEL: {
    name: "Apel",
    emoji: "🍎",
    bgGradFrom: "from-red-50",
    bgGradTo: "to-white",
    accent: "text-red-600",
    ring: "ring-red-100 border-red-200",
    pillBg: "bg-red-100",
    pillText: "text-red-700",
    nutrition: [
      { label: "Vitamin C", percent: 70 },
      { label: "Serat", percent: 65 },
      { label: "Antioksidan", percent: 75 },
      { label: "Kalium", percent: 55 },
    ],
    benefits: [
      "Menjaga kesehatan jantung dan metabolisme",
      "Mendukung pencernaan berkat serat pektin",
      "Membantu kontrol nafsu makan",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=1000&q=80",
  },
  JERUK: {
    name: "Jeruk",
    emoji: "🍊",
    bgGradFrom: "from-orange-50",
    bgGradTo: "to-white",
    accent: "text-orange-600",
    ring: "ring-orange-100 border-orange-200",
    pillBg: "bg-orange-100",
    pillText: "text-orange-700",
    nutrition: [
      { label: "Vitamin C", percent: 90 },
      { label: "Serat", percent: 60 },
      { label: "Antioksidan", percent: 80 },
      { label: "Kalium", percent: 50 },
    ],
    benefits: [
      "Meningkatkan daya tahan tubuh",
      "Mendukung kesehatan kulit",
      "Membantu penyerapan zat besi",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=1000&q=80",
  },
  PISANG: {
    name: "Pisang",
    emoji: "🍌",
    bgGradFrom: "from-yellow-50",
    bgGradTo: "to-white",
    accent: "text-yellow-600",
    ring: "ring-yellow-100 border-yellow-200",
    pillBg: "bg-yellow-100",
    pillText: "text-yellow-700",
    nutrition: [
      { label: "Kalium", percent: 85 },
      { label: "Serat", percent: 60 },
      { label: "Vitamin B6", percent: 75 },
      { label: "Karbohidrat", percent: 70 },
    ],
    benefits: [
      "Mendukung energi dan stamina",
      "Membantu keseimbangan elektrolit",
      "Baik untuk pemulihan otot",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1571772805064-207c8435df79?auto=format&fit=crop&w=1000&q=80",
  },
  MANGGA: {
    name: "Mangga",
    emoji: "🥭",
    bgGradFrom: "from-amber-50",
    bgGradTo: "to-white",
    accent: "text-amber-600",
    ring: "ring-amber-100 border-amber-200",
    pillBg: "bg-amber-100",
    pillText: "text-amber-700",
    nutrition: [
      { label: "Vitamin A", percent: 80 },
      { label: "Vitamin C", percent: 75 },
      { label: "Serat", percent: 55 },
      { label: "Antioksidan", percent: 70 },
    ],
    benefits: [
      "Menjaga kesehatan mata dan kulit",
      "Mendukung imun dan antioksidan",
      "Mendukung hidrasi dan pencernaan",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1623064547602-7d5dffe4088b?auto=format&fit=crop&w=1000&q=80",
  },
  DEFAULT: {
    name: "Buah",
    emoji: "📦",
    bgGradFrom: "from-gray-50",
    bgGradTo: "to-white",
    accent: "text-gray-700",
    ring: "ring-gray-100 border-gray-200",
    pillBg: "bg-gray-100",
    pillText: "text-gray-700",
    nutrition: [
      { label: "Vitamin C", percent: 60 },
      { label: "Serat", percent: 50 },
      { label: "Antioksidan", percent: 60 },
      { label: "Kalium", percent: 50 },
    ],
    benefits: [
      "Sumber vitamin dan mineral",
      "Mendukung hidrasi dan serat",
      "Baik untuk camilan sehat",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80",
  },
};

export default function ClientHome({
  scan,
  point,
}: {
  scan?: string;
  point?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");
  const [liveUpdates, setLiveUpdates] = useState<boolean>(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [pulsingElements, setPulsingElements] = useState<Set<string>>(
    new Set()
  );
  const [floatingParticles, setFloatingParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >([]);
  const [activeFruitKey, setActiveFruitKey] = useState<FruitKey>("DEFAULT");
  const hideSuccessTimeoutRef = useRef<number | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const SOCKET_URL = useMemo(() => {
    if (typeof window === "undefined")
      return "https://api-show-nine.vercel.app/";
    return (
      process.env.NEXT_PUBLIC_SOCKET_URL || "https://api-show-nine.vercel.app/"
    );
  }, []);

  const safeClearTimeout = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  };

  // Particles
  useEffect(() => {
    const particles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5000,
    }));
    setFloatingParticles(particles);
  }, []);

  const triggerPulse = (elementId: string) => {
    setPulsingElements((prev) => new Set([...prev, elementId]));
    setTimeout(() => {
      setPulsingElements((prev) => {
        const ns = new Set(prev);
        ns.delete(elementId);
        return ns;
      });
    }, 1000);
  };

  useEffect(() => {
    const t = window.setTimeout(() => setIsLoaded(true), 800);
    return () => window.clearTimeout(t);
  }, []);

  const applyFruitTheme = (name: string | undefined) => {
    const key = (name || "").toUpperCase();
    if (
      key === "APEL" ||
      key === "JERUK" ||
      key === "PISANG" ||
      key === "MANGGA"
    ) {
      setActiveFruitKey(key as FruitKey);
      triggerPulse("theme-change");
    } else {
      setActiveFruitKey("DEFAULT");
    }
  };

  // Socket.IO init
  useEffect(() => {
    if (!liveUpdates) {
      setConnectionStatus("Paused");
      return;
    }

    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const onConnect = () => {
      setConnectionStatus("Connected");
      triggerPulse("connection");
      (socket.io?.engine as any)?.once?.("upgrade", () => {
        // upgraded
      });
    };

    const onDisconnect = (reason: string) => {
      setConnectionStatus("Disconnected");
    };

    const onReconnectAttempt = () => setConnectionStatus("Reconnecting...");
    const onReconnect = () => {
      setConnectionStatus("Connected");
      triggerPulse("reconnect");
    };
    const onReconnectFailed = () => setConnectionStatus("Connection Failed");
    const onConnectError = () => setConnectionStatus("Connection Error");

    const onScanUpdate = (data: {
      sessionId: string;
      item: Item;
      session: {
        totalItems: number;
        totalPoints: number;
        items: Record<string, Item>;
        lastUpdate: number;
      };
    }) => {
      if (!liveUpdates) return;
      if (
        activeSessionIdRef.current &&
        data.sessionId !== activeSessionIdRef.current
      )
        return;

      applyFruitTheme(data?.item?.name);
      triggerPulse("scan-update");

      setSessionData({
        sessionId: data.sessionId,
        totalItems: data.session.totalItems,
        totalPoints: data.session.totalPoints,
        items: data.session.items,
        lastUpdate: data.session.lastUpdate,
      });
      setLastUpdateTime(new Date().toLocaleTimeString("id-ID"));

      if (data.item) {
        setScanData({
          fruit: data.item.name.toLowerCase(),
          point: data.item.pointsPerItem,
          totalPoint: data.session.totalPoints,
        });
        setShowSuccess(true);
        safeClearTimeout(hideSuccessTimeoutRef);
        hideSuccessTimeoutRef.current = window.setTimeout(() => {
          setShowSuccess(false);
        }, 3000) as unknown as number;
      }
    };

    const onQuantityUpdated = (data: {
      sessionId: string;
      itemName: string;
      newQuantity: number;
      session: {
        totalItems: number;
        totalPoints: number;
        items: Record<string, Item>;
        lastUpdate: number;
      };
    }) => {
      if (!liveUpdates) return;
      if (
        activeSessionIdRef.current &&
        data.sessionId !== activeSessionIdRef.current
      )
        return;

      applyFruitTheme(data?.itemName);
      triggerPulse("quantity-update");

      setSessionData({
        sessionId: data.sessionId,
        totalItems: data.session.totalItems,
        totalPoints: data.session.totalPoints,
        items: data.session.items,
        lastUpdate: data.session.lastUpdate,
      });
      setLastUpdateTime(new Date().toLocaleTimeString("id-ID"));
    };

    const onSessionStarted = (payload: { sessionId: string }) => {
      activeSessionIdRef.current = payload.sessionId;
      setSessionData(null);
      setScanData({ fruit: "session", point: 0, totalPoint: 0 });
      setActiveFruitKey("DEFAULT");
      triggerPulse("session-start");
      setShowSuccess(true);
      safeClearTimeout(hideSuccessTimeoutRef);
      hideSuccessTimeoutRef.current = window.setTimeout(() => {
        setShowSuccess(false);
      }, 2000) as unknown as number;
    };

    const onSessionFinished = (data: {
      summary: {
        sessionId: string;
        totalItems: number;
        totalPoints: number;
        items: Record<string, Item>;
        finishedAt: number;
      };
    }) => {
      if (!liveUpdates) return;
      if (
        activeSessionIdRef.current &&
        data.summary.sessionId !== activeSessionIdRef.current
      )
        return;

      const lastItemName =
        Object.values(data.summary.items).sort((a, b) =>
          (b.lastScanned || "").localeCompare(a.lastScanned || "")
        )[0]?.name || undefined;
      applyFruitTheme(lastItemName);
      triggerPulse("session-finish");

      setSessionData({
        sessionId: data.summary.sessionId,
        totalItems: data.summary.totalItems,
        totalPoints: data.summary.totalPoints,
        items: data.summary.items,
        lastUpdate: data.summary.finishedAt,
      });
      setLastUpdateTime(new Date().toLocaleTimeString("id-ID"));
      setScanData({
        fruit: "finished",
        point: data.summary.totalItems,
        totalPoint: data.summary.totalPoints,
      });
      setShowSuccess(true);
      safeClearTimeout(hideSuccessTimeoutRef);
      hideSuccessTimeoutRef.current = window.setTimeout(() => {
        setShowSuccess(false);
      }, 5000) as unknown as number;

      activeSessionIdRef.current = null;
    };

    const onError = () => {};

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("scan:update", onScanUpdate);
    socket.on("quantity:updated", onQuantityUpdated);
    socket.on("session:started", onSessionStarted);
    socket.on("session:finished", onSessionFinished);
    socket.on("error", onError);

    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onReconnect);
    socket.io.on("reconnect_failed", onReconnectFailed);

    return () => {
      safeClearTimeout(hideSuccessTimeoutRef);

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("scan:update", onScanUpdate);
      socket.off("quantity:updated", onQuantityUpdated);
      socket.off("session:started", onSessionStarted);
      socket.off("session:finished", onSessionFinished);
      socket.off("error", onError);

      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect", onReconnect);
      socket.io.off("reconnect_failed", onReconnectFailed);

      socket.disconnect();
    };
  }, [SOCKET_URL, liveUpdates]);

  // Fallback URL params / sessionStorage — gunakan props scan/point
  useEffect(() => {
    const propScan = scan;
    const propPoint = point;

    const storedData =
      typeof window !== "undefined"
        ? sessionStorage.getItem("scanResult")
        : null;

    if (propScan && propPoint) {
      const key = propScan.toUpperCase();
      applyFruitTheme(key);
      const data: ScanData = {
        fruit: propScan.toLowerCase(),
        point: parseInt(propPoint),
        totalPoint: parseInt(propPoint),
      };
      setScanData(data);
      setShowSuccess(true);
      safeClearTimeout(hideSuccessTimeoutRef);
      hideSuccessTimeoutRef.current = window.setTimeout(() => {
        setShowSuccess(false);
      }, 5000) as unknown as number;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("scanResult");
      }
    } else if (storedData) {
      const data: ScanData = JSON.parse(storedData);
      applyFruitTheme(data?.fruit?.toUpperCase());
      setScanData(data);
      setShowSuccess(true);
      safeClearTimeout(hideSuccessTimeoutRef);
      hideSuccessTimeoutRef.current = window.setTimeout(() => {
        setShowSuccess(false);
      }, 5000) as unknown as number;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("scanResult");
      }
    }

    return () => {
      safeClearTimeout(hideSuccessTimeoutRef);
    };
  }, [scan, point]);

  // Derived UI state
  const getDisplayData = () => {
    if (sessionData && sessionData.totalPoints > 0) {
      return {
        fruit: "session",
        point: sessionData.totalItems,
        totalPoint: sessionData.totalPoints,
      };
    }
    if (scanData) return scanData;
    return { fruit: "empty", point: 0, totalPoint: 0 };
  };

  const displayData = getDisplayData();
  const hasActiveData = sessionData !== null || scanData !== null;
  const isEmpty = displayData.totalPoint === 0;

  const theme = fruitTheme[activeFruitKey] ?? fruitTheme.DEFAULT;

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden bg-white flex flex-col lg:flex-row relative transition-all duration-1000 ease-in-out`}
    >
      {/* Floating Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {floatingParticles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-2 h-2 ${theme.accent.replace(
              "text-",
              "bg-"
            )}/20 rounded-full animate-ping`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}ms`,
              animationDuration: "4s",
            }}
          />
        ))}
      </div>

      {/* Animated Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradFrom} ${theme.bgGradTo} transition-all duration-1000 ease-in-out opacity-60`}
      />

      {/* Left Section - Fruit Image and Live */}
      <div
        className={`w-full lg:w-1/2 relative px-4 lg:px-0 z-10 transition-all duration-1000 ease-in-out ${
          pulsingElements.has("theme-change") ? "animate-pulse" : ""
        }`}
      >
        {/* Success Notification with enhanced animation */}
        {showSuccess && (
          <div
            className={`absolute top-4 left-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl transform transition-all duration-500 ease-out ${
              showSuccess
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-full scale-95 opacity-0"
            }`}
            style={{
              animation: showSuccess
                ? "slideInBounce 0.6s ease-out"
                : "slideOutUp 0.4s ease-in",
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <svg
                  className="w-5 h-5 flex-shrink-0 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm animate-pulse">
                  {sessionData
                    ? "Live Update!"
                    : scanData?.fruit === "session"
                    ? "New Session Started!"
                    : scanData?.fruit === "finished"
                    ? "Session Finished!"
                    : "QR Code Berhasil!"}
                </p>
                <p className="text-xs opacity-90">
                  {sessionData
                    ? `Total ${sessionData.totalItems} items • ${sessionData.totalPoints} points`
                    : scanData?.fruit === "session"
                    ? "Menunggu scan pertama..."
                    : scanData?.fruit === "finished"
                    ? `Final: ${scanData.totalPoint} points`
                    : scanData
                    ? `+${
                        scanData.point
                      } poin dari ${scanData.fruit.toUpperCase()}`
                    : "Real-time update"}
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="ml-2 hover:bg-white/20 rounded-full p-1 flex-shrink-0 transition-all duration-200 hover:scale-110"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main visual */}
        <div className="h-full flex flex-col items-center justify-center lg:justify-center min-h-screen lg:min-h-0">
          {/* Animated image container */}
          <div
            className={`relative transition-all duration-1000 ease-out ${
              isLoaded
                ? "opacity-100 scale-100 translate-x-0"
                : "opacity-0 scale-75 -translate-x-8"
            }`}
          >
            {/* Rotating ring effect */}
            <div
              className={`absolute inset-0 rounded-full ${theme.accent.replace(
                "text-",
                "border-"
              )}/20 border-2 animate-spin`}
              style={{ animationDuration: "20s" }}
            ></div>
            <div
              className={`absolute inset-4 rounded-full ${theme.accent.replace(
                "text-",
                "border-"
              )}/10 border-2 animate-spin`}
              style={{
                animationDuration: "15s",
                animationDirection: "reverse",
              }}
            ></div>

            {/* Pulsing glow effect */}
            <div
              className={`absolute inset-0 rounded-full ${theme.accent.replace(
                "text-",
                "bg-"
              )}/10 animate-pulse`}
            ></div>

            <img
              ref={imageRef}
              src={theme.imageUrl}
              alt={`${theme.name}`}
              className={`relative z-10 w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-80 lg:h-80 object-cover rounded-full drop-shadow-2xl transition-all duration-700 ease-out mx-auto hover:scale-105 hover:rotate-2 ${
                pulsingElements.has("scan-update") ||
                pulsingElements.has("theme-change")
                  ? "animate-bounce"
                  : ""
              }`}
              style={{
                filter: "brightness(1.08) contrast(1.06) saturate(1.1)",
                animation: isLoaded ? "float 6s ease-in-out infinite" : "",
              }}
            />
          </div>

          {/* Points card with enhanced animation */}
          <div
            className={`mt-6 lg:mt-8 text-center transition-all duration-1000 delay-1200 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div
              className={`bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border transition-all duration-500 hover:shadow-xl hover:scale-105 ${
                hasActiveData && !isEmpty ? `${theme.ring}` : "border-gray-200"
              } ${
                pulsingElements.has("scan-update") ||
                pulsingElements.has("quantity-update")
                  ? "animate-pulse ring-4 ring-blue-300"
                  : ""
              }`}
            >
              <div
                className={`text-xl lg:text-2xl font-semibold ${theme.accent} mb-1 transition-all duration-300 hover:scale-110`}
              >
                {theme.emoji}
              </div>
              {sessionData && !isEmpty ? (
                <>
                  <div
                    className={`text-2xl lg:text-3xl font-bold mb-1 text-blue-600 transition-all duration-500 ${
                      pulsingElements.has("scan-update") ? "animate-bounce" : ""
                    }`}
                  >
                    {theme.name} {sessionData.totalItems} Items
                  </div>
                  <div className="text-lg lg:text-xl font-semibold text-gray-700">
                    Total Points:{" "}
                    <span
                      className={
                        pulsingElements.has("quantity-update")
                          ? "animate-pulse text-green-600"
                          : ""
                      }
                    >
                      {sessionData.totalPoints}
                    </span>
                  </div>
                  {lastUpdateTime && (
                    <div className="text-xs text-gray-500 mt-1 animate-fadeIn">
                      Updated: {lastUpdateTime}
                    </div>
                  )}
                </>
              ) : !isEmpty ? (
                <>
                  <div className="text-2xl lg:text-3xl font-bold mb-1 text-green-600 animate-countUp">
                    Point {displayData.point}
                  </div>
                  <div className="text-lg lg:text-xl font-semibold text-gray-700">
                    Total Point {displayData.totalPoint}
                  </div>
                  <div
                    className={`mt-2 text-sm font-medium ${theme.accent} animate-fadeIn`}
                  >
                    ✓ Hasil Scan QR Code
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl lg:text-3xl font-bold mb-1 text-gray-400">
                    0 Points
                  </div>
                  <div className="text-lg lg:text-xl font-semibold text-gray-500">
                    Menunggu Scan...
                  </div>
                  <div
                    className={`mt-2 text-sm text-gray-400 font-medium ${
                      pulsingElements.has("connection")
                        ? "animate-pulse text-green-500"
                        : ""
                    }`}
                  >
                    {connectionStatus === "Connected"
                      ? "📡 Ready for live updates"
                      : "🔌 Connecting..."}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Session items with stagger animation */}
          {sessionData && Object.keys(sessionData.items).length > 0 && (
            <div className="mt-4 w-full max-w-sm animate-slideInUp">
              <div
                className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border ${theme.ring} hover:shadow-xl transition-all duration-500`}
              >
                <h3 className="text-sm font-semibold text-gray-800 mb-2 text-center animate-fadeIn">
                  📦 Items
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.values(sessionData.items).map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="flex justify-between items-center text-sm transform transition-all duration-300 hover:scale-102 hover:bg-white/50 rounded-lg p-2"
                      style={{
                        animation: `slideInLeft 0.5s ease-out ${
                          idx * 0.1
                        }s both`,
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-base transition-all duration-300 hover:scale-125">
                          {item.name === "APEL"
                            ? "🍎"
                            : item.name === "JERUK"
                            ? "🍊"
                            : item.name === "PISANG"
                            ? "🍌"
                            : item.name === "MANGGA"
                            ? "🥭"
                            : "📦"}
                        </span>
                        <span className="font-medium text-gray-800">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-bold text-blue-600 ${
                            pulsingElements.has("quantity-update")
                              ? "animate-pulse"
                              : ""
                          }`}
                        >
                          {item.quantity}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.totalPoints}pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty connection notice with pulse animation */}
          {isEmpty &&
            connectionStatus !== "Connected" &&
            connectionStatus !== "Paused" && (
              <div className="mt-4 w-full max-w-sm animate-slideInUp">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center transition-all duration-500 hover:shadow-md">
                  <p
                    className={`text-sm text-yellow-800 font-medium ${
                      connectionStatus === "Reconnecting..."
                        ? "animate-pulse"
                        : ""
                    }`}
                  >
                    🔌 {connectionStatus}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {connectionStatus === "Connecting..."
                      ? "Menghubungkan ke scanner..."
                      : connectionStatus === "Reconnecting..."
                      ? "Mencoba menghubungkan kembali..."
                      : "Tidak dapat terhubung ke scanner"}
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Right Section - Nutrition and Benefits with enhanced animations */}
      <div className="w-full lg:w-1/2 min-h-screen lg:h-full flex flex-col justify-start lg:justify-center px-4 sm:px-6 md:px-8 lg:px-16 py-8 lg:py-12 space-y-6 lg:space-y-8 relative z-10">
        {/* Nutrisi dengan animasi progress bar yang smooth */}
        <div
          className={`transition-all duration-1000 delay-300 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2
            className={`text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 lg:mb-6 pb-2 w-fit border-b-4 ${theme.accent.replace(
              "text-",
              "border-"
            )} transition-all duration-500 hover:scale-105`}
          >
            Kandungan Nutrisi {theme.emoji}
          </h2>

          <div className="space-y-4">
            {theme.nutrition.map((n, idx) => (
              <div
                key={idx}
                className="w-full group"
                style={{
                  animation: `slideInRight 0.6s ease-out ${idx * 0.15}s both`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg sm:text-xl font-semibold text-gray-800 transition-all duration-300 group-hover:scale-105">
                    {n.label}
                  </span>
                  <span
                    className={`text-sm font-bold ${theme.accent} transition-all duration-300 group-hover:scale-110`}
                  >
                    {n.percent}%
                  </span>
                </div>

                {/* Enhanced progress bar with glow effect */}
                <div className="w-full bg-gray-200 rounded-full h-3 lg:h-4 overflow-hidden relative group-hover:shadow-lg transition-all duration-300">
                  {/* Background glow */}
                  <div
                    className={`absolute inset-0 ${
                      activeFruitKey === "APEL"
                        ? "bg-red-500"
                        : activeFruitKey === "JERUK"
                        ? "bg-orange-500"
                        : activeFruitKey === "PISANG"
                        ? "bg-yellow-400"
                        : activeFruitKey === "MANGGA"
                        ? "bg-amber-500"
                        : "bg-gray-500"
                    }/10 blur-sm`}
                  ></div>

                  {/* Main progress bar */}
                  <div
                    className={`relative h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out group-hover:shadow-lg ${
                      activeFruitKey === "APEL"
                        ? "bg-gradient-to-r from-red-400 to-red-600"
                        : activeFruitKey === "JERUK"
                        ? "bg-gradient-to-r from-orange-400 to-orange-600"
                        : activeFruitKey === "PISANG"
                        ? "bg-gradient-to-r from-yellow-300 to-yellow-500"
                        : activeFruitKey === "MANGGA"
                        ? "bg-gradient-to-r from-amber-400 to-amber-600"
                        : "bg-gradient-to-r from-gray-400 to-gray-600"
                    }`}
                    style={{
                      width: isLoaded ? `${n.percent}%` : "0%",
                      animation: `growWidth 1.5s ease-out ${idx * 0.2}s both`,
                    }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manfaat dengan card animation yang staggered */}
        <div
          className={`transition-all duration-1000 delay-500 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Header dengan animasi typing effect */}
          <div className="mb-6">
            <h2
              className={`text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 mb-2 transition-all duration-500 hover:scale-105`}
            >
              Manfaat Kesehatan {theme.emoji}
            </h2>
            <div
              className={`h-1 rounded-full ${theme.accent.replace(
                "text-",
                "bg-"
              )} transition-all duration-1000 hover:w-24`}
              style={{
                width: isLoaded ? "4rem" : "0",
                animation: "growWidth 1s ease-out 1s both",
              }}
            ></div>
          </div>

          {/* Enhanced benefit cards */}
          <div className="grid gap-4 sm:gap-5">
            {theme.benefits.map((benefit, i) => (
              <div
                key={i}
                className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/80 hover:shadow-xl hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:-translate-y-1"
                style={{
                  animation: `slideInUp 0.6s ease-out ${i * 0.2}s both`,
                }}
              >
                {/* Animated background pattern */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div
                    className={`absolute inset-0 ${theme.accent.replace(
                      "text-",
                      "bg-"
                    )}/5 rounded-2xl`}
                  ></div>
                </div>

                {/* Icon dan konten */}
                <div className="flex items-start space-x-4 relative z-10">
                  {/* Enhanced icon container */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl ${theme.accent.replace(
                      "text-",
                      "bg-"
                    )}/10 flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative overflow-hidden`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${theme.accent.replace(
                        "text-",
                        "bg-"
                      )} group-hover:animate-ping`}
                    ></div>

                    {/* Ripple effect */}
                    <div
                      className={`absolute inset-0 ${theme.accent.replace(
                        "text-",
                        "bg-"
                      )}/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-500`}
                    ></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-lg sm:text-xl font-medium text-gray-800 leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                      {benefit}
                    </p>

                    {/* Enhanced accent line with gradient */}
                    <div className="mt-3 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-30 group-hover:opacity-60 transition-all duration-500 overflow-hidden">
                      <div
                        className={`h-full ${theme.accent.replace(
                          "text-",
                          "bg-"
                        )} transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700`}
                        style={{ width: "3rem" }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 rounded-2xl ${theme.accent.replace(
                    "text-",
                    "bg-"
                  )}/5 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm`}
                ></div>
              </div>
            ))}
          </div>

          {/* Enhanced summary card with morphing animation */}
          <div
            className={`mt-6 bg-gradient-to-r ${theme.accent.replace(
              "text-",
              "from-"
            )}/5 to-white/50 rounded-2xl p-5 border border-white/60 hover:shadow-lg transition-all duration-500 hover:scale-105 group`}
            style={{
              animation: "slideInUp 0.6s ease-out 0.8s both",
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full ${theme.accent.replace(
                  "text-",
                  "bg-"
                )}/20 flex items-center justify-center group-hover:animate-spin transition-all duration-500`}
              >
                <span className="text-lg group-hover:scale-125 transition-transform duration-300">
                  {theme.emoji}
                </span>
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${theme.accent} group-hover:scale-105 transition-transform duration-300`}
                >
                  Kesimpulan
                </p>
                <p className="text-gray-700 text-sm group-hover:text-gray-900 transition-colors duration-300">
                  Konsumsi {theme.name.toLowerCase()} secara rutin memberikan
                  nutrisi optimal untuk tubuh yang lebih sehat.
                </p>
              </div>
            </div>

            {/* Animated border */}
            <div
              className={`absolute inset-0 rounded-2xl border-2 ${theme.accent.replace(
                "text-",
                "border-"
              )}/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            ></div>
          </div>
        </div>

        {/* Enhanced brand section with 3D effect */}
        <div
          className={`transition-all duration-1000 delay-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-700 hover:scale-105 relative overflow-hidden group">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-gradient-x"></div>
            </div>

            {/* Moving light streak */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-8 mb-4 lg:mb-6 relative z-10">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 lg:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-500">
                  <span
                    className={`${theme.accent.replace(
                      "text-",
                      "text-"
                    )} group-hover:animate-pulse`}
                  >
                    INFINIX
                  </span>{" "}
                  NOTE SERIES
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-500">
                  Infinix mendukung hidup sehat – energi{" "}
                  {theme.name.toLowerCase()}, energi Anda.
                </p>
              </div>
              <div className="flex-shrink-0 self-center sm:self-start">
                <div className="relative group-hover:scale-110 transition-transform duration-500">
                  <img
                    src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=387&q=80"
                    alt="Infinix Smartphone"
                    className="w-20 h-24 sm:w-22 sm:h-28 lg:w-24 lg:h-32 object-cover rounded-xl lg:rounded-2xl shadow-2xl transform hover:rotate-3 transition-all duration-500"
                    style={{ filter: "brightness(1.1) contrast(1.05)" }}
                  />
                  {/* Phone glow effect */}
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl lg:rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </div>

            <div className="mb-4 lg:mb-6 relative z-10">
              <h3
                className={`text-xl lg:text-2xl font-semibold mb-2 lg:mb-3 ${theme.accent} group-hover:animate-pulse`}
              >
                Spesifikasi Unggulan
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                {["Baterai", "Layar", "Performa"].map((spec, index) => (
                  <div
                    key={spec}
                    className="text-center group-hover:scale-105 transition-transform duration-300 hover:bg-white/10 rounded-lg p-2"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-base sm:text-lg font-semibold text-white group-hover:text-blue-300 transition-colors duration-300">
                      {spec}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      {spec === "Baterai"
                        ? "Tahan Lama"
                        : spec === "Layar"
                        ? "Besar & Jernih"
                        : "Tinggi"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Scanner Status
                </div>
                <div
                  className={`flex items-center space-x-2 text-sm transition-all duration-500 ${
                    connectionStatus === "Connected"
                      ? "text-green-400"
                      : connectionStatus === "Connecting..." ||
                        connectionStatus === "Reconnecting..."
                      ? "text-yellow-400"
                      : connectionStatus === "Paused"
                      ? "text-gray-300"
                      : "text-red-400"
                  } ${
                    pulsingElements.has("connection") ||
                    pulsingElements.has("reconnect")
                      ? "animate-pulse scale-110"
                      : ""
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      connectionStatus === "Connected"
                        ? "bg-green-400 animate-pulse shadow-lg shadow-green-400/50"
                        : connectionStatus === "Connecting..." ||
                          connectionStatus === "Reconnecting..."
                        ? "bg-yellow-400 animate-ping"
                        : connectionStatus === "Paused"
                        ? "bg-gray-300"
                        : "bg-red-400 animate-pulse"
                    }`}
                  ></div>
                  <span className="font-medium">{connectionStatus}</span>
                </div>
              </div>
              {sessionData && (
                <div
                  className={`mt-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300 ${
                    pulsingElements.has("scan-update")
                      ? "animate-pulse text-blue-400"
                      : ""
                  }`}
                >
                  Live Session: {sessionData.totalItems} items,{" "}
                  {sessionData.totalPoints} points
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(1deg);
          }
          66% {
            transform: translateY(-5px) rotate(-1deg);
          }
        }

        @keyframes slideInBounce {
          0% {
            transform: translateY(-100%) scale(0.9);
            opacity: 0;
          }
          50% {
            transform: translateY(10%) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(0%) scale(1);
            opacity: 1;
          }
        }

        @keyframes slideOutUp {
          0% {
            transform: translateY(0%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes slideInUp {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          0% {
            transform: translateX(-30px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          0% {
            transform: translateX(30px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes growWidth {
          0% {
            width: 0%;
          }
          100% {
            width: var(--target-width);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes countUp {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes gradient-x {
          0%,
          100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out both;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out both;
        }

        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out both;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-countUp {
          animation: countUp 0.8s ease-out both;
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out both;
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        .hover\\:shadow-3xl:hover {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
