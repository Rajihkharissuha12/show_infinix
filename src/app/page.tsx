// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useSearchParams } from "next/navigation";
// import { io, Socket } from "socket.io-client";

// interface ScanData {
//   fruit: string;
//   point: number;
//   totalPoint: number;
//   timestamp?: number;
// }

// interface Item {
//   name: string;
//   quantity: number;
//   pointsPerItem: number;
//   totalPoints: number;
//   lastScanned: string;
// }

// interface SessionData {
//   sessionId: string;
//   totalItems: number;
//   totalPoints: number;
//   items: Record<string, Item>;
//   lastUpdate: number;
// }

// type FruitKey = "APEL" | "JERUK" | "PISANG" | "MANGGA" | "DEFAULT";

// // Lookup untuk tema per buah (hindari class dinamis interpolasi)
// const fruitTheme: Record<
//   FruitKey,
//   {
//     name: string;
//     emoji: string;
//     // warna utama
//     bgGradFrom: string;
//     bgGradTo: string;
//     accent: string;
//     ring: string;
//     pillBg: string;
//     pillText: string;
//     // nutrisi + manfaat
//     nutrition: Array<{ label: string; percent: number }>;
//     benefits: string[];
//     // gambar
//     imageUrl: string;
//   }
// > = {
//   APEL: {
//     name: "Apel",
//     emoji: "🍎",
//     bgGradFrom: "from-red-50",
//     bgGradTo: "to-white",
//     accent: "text-red-600",
//     ring: "ring-red-100 border-red-200",
//     pillBg: "bg-red-100",
//     pillText: "text-red-700",
//     nutrition: [
//       { label: "Vitamin C", percent: 70 },
//       { label: "Serat", percent: 65 },
//       { label: "Antioksidan", percent: 75 },
//       { label: "Kalium", percent: 55 },
//     ],
//     benefits: [
//       "Menjaga kesehatan jantung dan metabolisme",
//       "Mendukung pencernaan berkat serat pektin",
//       "Membantu kontrol nafsu makan",
//     ],
//     imageUrl:
//       "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=1000&q=80",
//   },
//   JERUK: {
//     name: "Jeruk",
//     emoji: "🍊",
//     bgGradFrom: "from-orange-50",
//     bgGradTo: "to-white",
//     accent: "text-orange-600",
//     ring: "ring-orange-100 border-orange-200",
//     pillBg: "bg-orange-100",
//     pillText: "text-orange-700",
//     nutrition: [
//       { label: "Vitamin C", percent: 90 },
//       { label: "Serat", percent: 60 },
//       { label: "Antioksidan", percent: 80 },
//       { label: "Kalium", percent: 50 },
//     ],
//     benefits: [
//       "Meningkatkan daya tahan tubuh",
//       "Mendukung kesehatan kulit",
//       "Membantu penyerapan zat besi",
//     ],
//     imageUrl:
//       "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=1000&q=80",
//   },
//   PISANG: {
//     name: "Pisang",
//     emoji: "🍌",
//     bgGradFrom: "from-yellow-50",
//     bgGradTo: "to-white",
//     accent: "text-yellow-600",
//     ring: "ring-yellow-100 border-yellow-200",
//     pillBg: "bg-yellow-100",
//     pillText: "text-yellow-700",
//     nutrition: [
//       { label: "Kalium", percent: 85 },
//       { label: "Serat", percent: 60 },
//       { label: "Vitamin B6", percent: 75 },
//       { label: "Karbohidrat", percent: 70 },
//     ],
//     benefits: [
//       "Mendukung energi dan stamina",
//       "Membantu keseimbangan elektrolit",
//       "Baik untuk pemulihan otot",
//     ],
//     imageUrl:
//       "https://images.unsplash.com/photo-1571772805064-207c8435df79?auto=format&fit=crop&w=1000&q=80",
//   },
//   MANGGA: {
//     name: "Mangga",
//     emoji: "🥭",
//     bgGradFrom: "from-amber-50",
//     bgGradTo: "to-white",
//     accent: "text-amber-600",
//     ring: "ring-amber-100 border-amber-200",
//     pillBg: "bg-amber-100",
//     pillText: "text-amber-700",
//     nutrition: [
//       { label: "Vitamin A", percent: 80 },
//       { label: "Vitamin C", percent: 75 },
//       { label: "Serat", percent: 55 },
//       { label: "Antioksidan", percent: 70 },
//     ],
//     benefits: [
//       "Menjaga kesehatan mata dan kulit",
//       "Mendukung imun dan antioksidan",
//       "Mendukung hidrasi dan pencernaan",
//     ],
//     imageUrl:
//       "https://images.unsplash.com/photo-1623064547602-7d5dffe4088b?auto=format&fit=crop&w=1000&q=80",
//   },
//   DEFAULT: {
//     name: "Buah",
//     emoji: "📦",
//     bgGradFrom: "from-gray-50",
//     bgGradTo: "to-white",
//     accent: "text-gray-700",
//     ring: "ring-gray-100 border-gray-200",
//     pillBg: "bg-gray-100",
//     pillText: "text-gray-700",
//     nutrition: [
//       { label: "Vitamin C", percent: 60 },
//       { label: "Serat", percent: 50 },
//       { label: "Antioksidan", percent: 60 },
//       { label: "Kalium", percent: 50 },
//     ],
//     benefits: [
//       "Sumber vitamin dan mineral",
//       "Mendukung hidrasi dan serat",
//       "Baik untuk camilan sehat",
//     ],
//     imageUrl:
//       "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80",
//   },
// };

// export default function FruitLandingPage() {
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [scanData, setScanData] = useState<ScanData | null>(null);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [sessionData, setSessionData] = useState<SessionData | null>(null);
//   const [connectionStatus, setConnectionStatus] =
//     useState<string>("Connecting...");
//   const [liveUpdates, setLiveUpdates] = useState<boolean>(true);
//   const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
//   const searchParams = useSearchParams();

//   // Tema aktif berdasarkan buah terakhir
//   const [activeFruitKey, setActiveFruitKey] = useState<FruitKey>("DEFAULT");

//   // timeout ref untuk notifikasi
//   const hideSuccessTimeoutRef = useRef<number | null>(null);
//   // optional: filter sesi
//   const activeSessionIdRef = useRef<string | null>(null);

//   const SOCKET_URL = useMemo(() => {
//     if (typeof window === "undefined") return "http://localhost:4000";
//     return process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
//   }, []);

//   const safeClearTimeout = (ref: React.MutableRefObject<number | null>) => {
//     if (ref.current) {
//       window.clearTimeout(ref.current);
//       ref.current = null;
//     }
//   };

//   useEffect(() => {
//     const timer = window.setTimeout(() => setIsLoaded(true), 500);
//     return () => window.clearTimeout(timer);
//   }, []);

//   // Helper untuk set tema dari nama item
//   const applyFruitTheme = (name: string | undefined) => {
//     const key = (name || "").toUpperCase();
//     if (
//       key === "APEL" ||
//       key === "JERUK" ||
//       key === "PISANG" ||
//       key === "MANGGA"
//     ) {
//       setActiveFruitKey(key as FruitKey);
//     } else {
//       setActiveFruitKey("DEFAULT");
//     }
//   };

//   // Socket.IO init
//   useEffect(() => {
//     if (!liveUpdates) {
//       setConnectionStatus("Paused");
//       return;
//     }

//     const socket: Socket = io(SOCKET_URL, {
//       transports: ["websocket", "polling"],
//       timeout: 20000,
//       reconnection: true,
//       reconnectionAttempts: 10,
//       reconnectionDelay: 1000,
//     });

//     const onConnect = () => {
//       setConnectionStatus("Connected");
//       const t = (socket.io?.engine as any)?.transport?.name;
//       // eslint-disable-next-line no-console
//       console.log("✅ Home connected via", t || "unknown");
//       (socket.io?.engine as any)?.once?.("upgrade", () => {
//         const ut = (socket.io?.engine as any)?.transport?.name;
//         // eslint-disable-next-line no-console
//         console.log("🔼 transport upgraded to", ut);
//       });
//     };

//     const onDisconnect = (reason: string) => {
//       // eslint-disable-next-line no-console
//       console.log("🔌 Home disconnected:", reason);
//       setConnectionStatus("Disconnected");
//     };

//     const onReconnectAttempt = (n: number) => {
//       // eslint-disable-next-line no-console
//       console.log("🔄 Home reconnect attempt:", n);
//       setConnectionStatus("Reconnecting...");
//     };

//     const onReconnect = (n: number) => {
//       // eslint-disable-next-line no-console
//       console.log("🔄 Home reconnected after", n, "attempts");
//       setConnectionStatus("Connected");
//     };

//     const onReconnectFailed = () => {
//       // eslint-disable-next-line no-console
//       console.log("❌ Home reconnect failed");
//       setConnectionStatus("Connection Failed");
//     };

//     const onConnectError = (err: Error) => {
//       // eslint-disable-next-line no-console
//       console.error("❌ Home connect_error:", err);
//       setConnectionStatus("Connection Error");
//     };

//     const onScanUpdate = (data: {
//       sessionId: string;
//       item: Item;
//       session: {
//         totalItems: number;
//         totalPoints: number;
//         items: Record<string, Item>;
//         lastUpdate: number;
//       };
//     }) => {
//       if (!liveUpdates) return;
//       if (
//         activeSessionIdRef.current &&
//         data.sessionId !== activeSessionIdRef.current
//       )
//         return;

//       // update tema berdasar item terakhir
//       applyFruitTheme(data?.item?.name);

//       setSessionData({
//         sessionId: data.sessionId,
//         totalItems: data.session.totalItems,
//         totalPoints: data.session.totalPoints,
//         items: data.session.items,
//         lastUpdate: data.session.lastUpdate,
//       });
//       setLastUpdateTime(new Date().toLocaleTimeString("id-ID"));

//       if (data.item) {
//         setScanData({
//           fruit: data.item.name.toLowerCase(),
//           point: data.item.pointsPerItem,
//           totalPoint: data.session.totalPoints,
//         });
//         setShowSuccess(true);
//         safeClearTimeout(hideSuccessTimeoutRef);
//         hideSuccessTimeoutRef.current = window.setTimeout(() => {
//           setShowSuccess(false);
//         }, 3000) as unknown as number;
//       }
//     };

//     const onQuantityUpdated = (data: {
//       sessionId: string;
//       itemName: string;
//       newQuantity: number;
//       session: {
//         totalItems: number;
//         totalPoints: number;
//         items: Record<string, Item>;
//         lastUpdate: number;
//       };
//     }) => {
//       if (!liveUpdates) return;
//       if (
//         activeSessionIdRef.current &&
//         data.sessionId !== activeSessionIdRef.current
//       )
//         return;

//       // tetap sesuaikan tema dengan itemName yang terakhir diubah
//       applyFruitTheme(data?.itemName);

//       setSessionData({
//         sessionId: data.sessionId,
//         totalItems: data.session.totalItems,
//         totalPoints: data.session.totalPoints,
//         items: data.session.items,
//         lastUpdate: data.session.lastUpdate,
//       });
//       setLastUpdateTime(new Date().toLocaleTimeString("id-ID"));
//     };

//     const onSessionStarted = (payload: { sessionId: string }) => {
//       activeSessionIdRef.current = payload.sessionId;
//       setSessionData(null);
//       setScanData({
//         fruit: "session",
//         point: 0,
//         totalPoint: 0,
//       });
//       // reset tema ke default ketika sesi baru
//       setActiveFruitKey("DEFAULT");
//       setShowSuccess(true);
//       safeClearTimeout(hideSuccessTimeoutRef);
//       hideSuccessTimeoutRef.current = window.setTimeout(() => {
//         setShowSuccess(false);
//       }, 2000) as unknown as number;
//     };

//     const onSessionFinished = (data: {
//       summary: {
//         sessionId: string;
//         totalItems: number;
//         totalPoints: number;
//         items: Record<string, Item>;
//         finishedAt: number;
//       };
//     }) => {
//       if (!liveUpdates) return;
//       if (
//         activeSessionIdRef.current &&
//         data.summary.sessionId !== activeSessionIdRef.current
//       )
//         return;

//       // pilih tema dari item dominan (opsional): pakai item terakhir di summary bila ada
//       const lastItemName =
//         Object.values(data.summary.items).sort((a, b) =>
//           (b.lastScanned || "").localeCompare(a.lastScanned || "")
//         )[0]?.name || undefined;
//       applyFruitTheme(lastItemName);

//       setSessionData({
//         sessionId: data.summary.sessionId,
//         totalItems: data.summary.totalItems,
//         totalPoints: data.summary.totalPoints,
//         items: data.summary.items,
//         lastUpdate: data.summary.finishedAt,
//       });
//       setLastUpdateTime(new Date().toLocaleTimeString("id-ID"));
//       setScanData({
//         fruit: "finished",
//         point: data.summary.totalItems,
//         totalPoint: data.summary.totalPoints,
//       });
//       setShowSuccess(true);
//       safeClearTimeout(hideSuccessTimeoutRef);
//       hideSuccessTimeoutRef.current = window.setTimeout(() => {
//         setShowSuccess(false);
//       }, 5000) as unknown as number;

//       activeSessionIdRef.current = null;
//     };

//     const onError = (error: any) => {
//       // eslint-disable-next-line no-console
//       console.error("❌ Home socket error:", error);
//     };

//     // socket listeners
//     socket.on("connect", onConnect);
//     socket.on("disconnect", onDisconnect);
//     socket.on("connect_error", onConnectError);
//     socket.on("scan:update", onScanUpdate);
//     socket.on("quantity:updated", onQuantityUpdated);
//     socket.on("session:started", onSessionStarted);
//     socket.on("session:finished", onSessionFinished);
//     socket.on("error", onError);

//     // manager listeners
//     socket.io.on("reconnect_attempt", onReconnectAttempt);
//     socket.io.on("reconnect", onReconnect);
//     socket.io.on("reconnect_failed", onReconnectFailed);

//     return () => {
//       // eslint-disable-next-line no-console
//       console.log("🏠 Home: cleanup socket", SOCKET_URL);
//       safeClearTimeout(hideSuccessTimeoutRef);

//       socket.off("connect", onConnect);
//       socket.off("disconnect", onDisconnect);
//       socket.off("connect_error", onConnectError);
//       socket.off("scan:update", onScanUpdate);
//       socket.off("quantity:updated", onQuantityUpdated);
//       socket.off("session:started", onSessionStarted);
//       socket.off("session:finished", onSessionFinished);
//       socket.off("error", onError);

//       socket.io.off("reconnect_attempt", onReconnectAttempt);
//       socket.io.off("reconnect", onReconnect);
//       socket.io.off("reconnect_failed", onReconnectFailed);

//       socket.disconnect();
//     };
//   }, [SOCKET_URL, liveUpdates]);

//   // Fallback URL params / sessionStorage
//   useEffect(() => {
//     const scan = searchParams.get("scan");
//     const point = searchParams.get("point");

//     const storedData =
//       typeof window !== "undefined"
//         ? sessionStorage.getItem("scanResult")
//         : null;

//     if (scan && point) {
//       const key = scan.toUpperCase();
//       applyFruitTheme(key);
//       const data: ScanData = {
//         fruit: scan.toLowerCase(),
//         point: parseInt(point),
//         totalPoint: parseInt(point),
//       };
//       setScanData(data);
//       setShowSuccess(true);
//       safeClearTimeout(hideSuccessTimeoutRef);
//       hideSuccessTimeoutRef.current = window.setTimeout(() => {
//         setShowSuccess(false);
//       }, 5000) as unknown as number;
//       if (typeof window !== "undefined") {
//         sessionStorage.removeItem("scanResult");
//       }
//     } else if (storedData) {
//       const data: ScanData = JSON.parse(storedData);
//       applyFruitTheme(data?.fruit?.toUpperCase());
//       setScanData(data);
//       setShowSuccess(true);
//       safeClearTimeout(hideSuccessTimeoutRef);
//       hideSuccessTimeoutRef.current = window.setTimeout(() => {
//         setShowSuccess(false);
//       }, 5000) as unknown as number;
//       if (typeof window !== "undefined") {
//         sessionStorage.removeItem("scanResult");
//       }
//     }

//     return () => {
//       safeClearTimeout(hideSuccessTimeoutRef);
//     };
//   }, [searchParams]);

//   // Derived UI state
//   const getDisplayData = () => {
//     if (sessionData && sessionData.totalPoints > 0) {
//       return {
//         fruit: "session",
//         point: sessionData.totalItems,
//         totalPoint: sessionData.totalPoints,
//       };
//     }
//     if (scanData) return scanData;
//     return { fruit: "empty", point: 0, totalPoint: 0 };
//   };

//   const displayData = getDisplayData();
//   const hasActiveData = sessionData !== null || scanData !== null;
//   const isEmpty = displayData.totalPoint === 0;

//   // Ambil tema aktif
//   const theme = fruitTheme[activeFruitKey] ?? fruitTheme.DEFAULT;

//   return (
//     <div
//       className={`min-h-screen w-full overflow-x-hidden bg-white flex flex-col lg:flex-row`}
//     >
//       {/* Left Section - Fruit Image and Live */}
//       <div
//         className={`w-full lg:w-1/2 relative px-4 lg:px-0 bg-gradient-to-br ${theme.bgGradFrom} ${theme.bgGradTo}`}
//       >
//         {/* Success Notification */}
//         {showSuccess && (
//           <div
//             className={`absolute top-4 left-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-2xl shadow-2xl animate-bounce`}
//           >
//             <div className="flex items-center space-x-3">
//               <svg
//                 className="w-5 h-5 flex-shrink-0"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               <div className="flex-1">
//                 <p className="font-semibold text-sm">
//                   {sessionData
//                     ? "Live Update!"
//                     : scanData?.fruit === "session"
//                     ? "New Session Started!"
//                     : scanData?.fruit === "finished"
//                     ? "Session Finished!"
//                     : "QR Code Berhasil!"}
//                 </p>
//                 <p className="text-xs">
//                   {sessionData
//                     ? `Total ${sessionData.totalItems} items • ${sessionData.totalPoints} points`
//                     : scanData?.fruit === "session"
//                     ? "Menunggu scan pertama..."
//                     : scanData?.fruit === "finished"
//                     ? `Final: ${scanData.totalPoint} points`
//                     : scanData
//                     ? `+${
//                         scanData.point
//                       } poin dari ${scanData.fruit.toUpperCase()}`
//                     : "Real-time update"}
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowSuccess(false)}
//                 className="ml-2 hover:bg-green-600 rounded-full p-1 flex-shrink-0"
//               >
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Live Toggle */}
//         {/* <div className="absolute top-4 right-4 z-40">
//           <button
//             onClick={() => setLiveUpdates((v) => !v)}
//             className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
//               liveUpdates
//                 ? `${theme.pillBg} ${theme.pillText} shadow-lg`
//                 : "bg-gray-200 text-gray-600"
//             }`}
//           >
//             <div className="flex items-center space-x-2">
//               <div
//                 className={`w-2 h-2 rounded-full ${
//                   liveUpdates && connectionStatus === "Connected"
//                     ? "bg-white animate-pulse"
//                     : "bg-gray-400"
//                 }`}
//               ></div>
//               <span>Live</span>
//             </div>
//           </button>
//         </div> */}

//         {/* Connection Status */}
//         {/* <div className="absolute bottom-4 right-4 z-40">
//           <div
//             className={`px-3 py-1 rounded-full text-xs font-medium ${
//               connectionStatus === "Connected"
//                 ? "bg-green-100 text-green-700"
//                 : connectionStatus === "Connecting..." ||
//                   connectionStatus === "Reconnecting..."
//                 ? "bg-yellow-100 text-yellow-700"
//                 : connectionStatus === "Paused"
//                 ? "bg-gray-100 text-gray-700"
//                 : "bg-red-100 text-red-700"
//             }`}
//           >
//             {connectionStatus}
//           </div>
//         </div> */}

//         {/* Main visual */}
//         <div className="h-full flex flex-col items-center justify-center lg:justify-center min-h-screen lg:min-h-0">
//           <div
//             className={`transition-all duration-1000 ease-out ${
//               isLoaded
//                 ? "opacity-100 scale-100 translate-x-0"
//                 : "opacity-0 scale-75 -translate-x-8"
//             }`}
//           >
//             <img
//               src={theme.imageUrl}
//               alt={`${theme.name}`}
//               className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-80 lg:h-80 object-cover rounded-full drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out mx-auto"
//               style={{
//                 filter: "brightness(1.08) contrast(1.06) saturate(1.1)",
//               }}
//             />
//           </div>

//           {/* Points card */}
//           <div
//             className={`mt-6 lg:mt-8 text-center transition-all duration-1000 delay-1200 ease-out ${
//               isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
//             }`}
//           >
//             <div
//               className={`bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border ${
//                 hasActiveData && !isEmpty ? `${theme.ring}` : "border-gray-200"
//               }`}
//             >
//               <div
//                 className={`text-xl lg:text-2xl font-semibold ${theme.accent} mb-1`}
//               >
//                 {theme.emoji}
//               </div>
//               {sessionData && !isEmpty ? (
//                 <>
//                   <div className="text-2xl lg:text-3xl font-bold mb-1 text-blue-600">
//                     {theme.name} {sessionData.totalItems} Items
//                   </div>
//                   <div className="text-lg lg:text-xl font-semibold text-gray-700">
//                     Total Points: {sessionData.totalPoints}
//                   </div>
//                   {/* <div className="mt-2 text-sm text-blue-600 font-medium">
//                     🔄 Live Session Data
//                   </div> */}
//                   {lastUpdateTime && (
//                     <div className="text-xs text-gray-500 mt-1">
//                       Updated: {lastUpdateTime}
//                     </div>
//                   )}
//                 </>
//               ) : !isEmpty ? (
//                 <>
//                   <div className="text-2xl lg:text-3xl font-bold mb-1 text-green-600">
//                     Point {displayData.point}
//                   </div>
//                   <div className="text-lg lg:text-xl font-semibold text-gray-700">
//                     Total Point {displayData.totalPoint}
//                   </div>
//                   <div className={`mt-2 text-sm font-medium ${theme.accent}`}>
//                     ✓ Hasil Scan QR Code
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <div className="text-2xl lg:text-3xl font-bold mb-1 text-gray-400">
//                     0 Points
//                   </div>
//                   <div className="text-lg lg:text-xl font-semibold text-gray-500">
//                     Menunggu Scan...
//                   </div>
//                   <div className="mt-2 text-sm text-gray-400 font-medium">
//                     {connectionStatus === "Connected"
//                       ? "📡 Ready for live updates"
//                       : "🔌 Connecting..."}
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>

//           {/* Session items */}
//           {sessionData && Object.keys(sessionData.items).length > 0 && (
//             <div className="mt-4 w-full max-w-sm">
//               <div
//                 className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border ${theme.ring}`}
//               >
//                 <h3 className="text-sm font-semibold text-gray-800 mb-2 text-center">
//                   📦 Items
//                 </h3>
//                 <div className="space-y-2 max-h-32 overflow-y-auto">
//                   {Object.values(sessionData.items).map((item, idx) => (
//                     <div
//                       key={`${item.name}-${idx}`}
//                       className="flex justify-between items-center text-sm"
//                     >
//                       <div className="flex items-center space-x-2">
//                         <span className="text-base">
//                           {item.name === "APEL"
//                             ? "🍎"
//                             : item.name === "JERUK"
//                             ? "🍊"
//                             : item.name === "PISANG"
//                             ? "🍌"
//                             : item.name === "MANGGA"
//                             ? "🥭"
//                             : "📦"}
//                         </span>
//                         <span className="font-medium text-gray-800">
//                           {item.name}
//                         </span>
//                       </div>
//                       <div className="text-right">
//                         <div className="font-bold text-blue-600">
//                           {item.quantity}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {item.totalPoints}pts
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Empty connection notice */}
//           {isEmpty &&
//             connectionStatus !== "Connected" &&
//             connectionStatus !== "Paused" && (
//               <div className="mt-4 w-full max-w-sm">
//                 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
//                   <p className="text-sm text-yellow-800 font-medium">
//                     🔌 {connectionStatus}
//                   </p>
//                   <p className="text-xs text-yellow-600 mt-1">
//                     {connectionStatus === "Connecting..."
//                       ? "Menghubungkan ke scanner..."
//                       : connectionStatus === "Reconnecting..."
//                       ? "Mencoba menghubungkan kembali..."
//                       : "Tidak dapat terhubung ke scanner"}
//                   </p>
//                 </div>
//               </div>
//             )}
//         </div>
//       </div>

//       {/* Right Section - Nutrition and Benefits berubah sesuai tema */}
//       <div className="w-full lg:w-1/2 min-h-screen lg:h-full flex flex-col justify-start lg:justify-center px-4 sm:px-6 md:px-8 lg:px-16 py-8 lg:py-12 space-y-6 lg:space-y-8">
//         {/* Nutrisi */}
//         <div
//           className={`transition-all duration-1000 delay-300 ease-out ${
//             isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
//           }`}
//         >
//           <h2
//             className={`text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 lg:mb-6 pb-2 w-fit border-b-4 ${theme.accent.replace(
//               "text-",
//               "border-"
//             )}`}
//           >
//             Kandungan Nutrisi {theme.emoji}
//           </h2>

//           <div className="space-y-4">
//             {theme.nutrition.map((n, idx) => (
//               <div key={idx} className="w-full">
//                 <div className="flex items-center justify-between mb-1">
//                   <span className="text-lg sm:text-xl font-semibold text-gray-800">
//                     {n.label}
//                   </span>
//                   <span className={`text-sm font-bold ${theme.accent}`}>
//                     {n.percent}%
//                   </span>
//                 </div>

//                 {/* Wrapper bar */}
//                 <div className="w-full bg-gray-200 rounded-full h-3 lg:h-4 overflow-hidden">
//                   {/* Fill bar: gunakan inline width + transition */}
//                   <div
//                     className={`h-3 lg:h-4 rounded-full transition-all duration-700 ease-out ${
//                       // pilih kelas bg statis sesuai tema
//                       activeFruitKey === "APEL"
//                         ? "bg-red-500"
//                         : activeFruitKey === "JERUK"
//                         ? "bg-orange-500"
//                         : activeFruitKey === "PISANG"
//                         ? "bg-yellow-400"
//                         : activeFruitKey === "MANGGA"
//                         ? "bg-amber-500"
//                         : "bg-gray-500"
//                     }`}
//                     style={{ width: isLoaded ? `${n.percent}%` : "0%" }}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Manfaat */}
//         <div
//           className={`transition-all duration-1000 delay-500 ease-out ${
//             isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
//           }`}
//         >
//           {/* Header dengan garis aksen */}
//           <div className="mb-6">
//             <h2
//               className={`text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 mb-2`}
//             >
//               Manfaat Kesehatan {theme.emoji}
//             </h2>
//             <div
//               className={`w-16 h-1 rounded-full ${theme.accent.replace(
//                 "text-",
//                 "bg-"
//               )}`}
//             ></div>
//           </div>

//           {/* Grid cards untuk manfaat */}
//           <div className="grid gap-4 sm:gap-5">
//             {theme.benefits.map((benefit, i) => (
//               <div
//                 key={i}
//                 className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/80 hover:shadow-md transition-all duration-300"
//               >
//                 {/* Icon dan konten */}
//                 <div className="flex items-start space-x-4">
//                   {/* Icon container */}
//                   <div
//                     className={`flex-shrink-0 w-10 h-10 rounded-xl ${theme.accent.replace(
//                       "text-",
//                       "bg-"
//                     )}/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
//                   >
//                     <div
//                       className={`w-4 h-4 rounded-full ${theme.accent.replace(
//                         "text-",
//                         "bg-"
//                       )}`}
//                     ></div>
//                   </div>

//                   {/* Content */}
//                   <div className="flex-1">
//                     <p className="text-lg sm:text-xl font-medium text-gray-800 leading-relaxed">
//                       {benefit}
//                     </p>

//                     {/* Subtle accent line */}
//                     <div
//                       className={`mt-3 w-12 h-0.5 ${theme.accent.replace(
//                         "text-",
//                         "bg-"
//                       )}/30 group-hover:w-20 transition-all duration-300`}
//                     ></div>
//                   </div>
//                 </div>

//                 {/* Subtle pattern background */}
//                 <div className="absolute top-0 right-0 w-16 h-16 opacity-5 overflow-hidden rounded-br-2xl">
//                   <div
//                     className={`w-full h-full ${theme.accent.replace(
//                       "text-",
//                       "bg-"
//                     )} transform rotate-45 translate-x-8 -translate-y-8`}
//                   ></div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Summary card */}
//           <div
//             className={`mt-6 bg-gradient-to-r ${theme.accent.replace(
//               "text-",
//               "from-"
//             )}/5 to-white/50 rounded-2xl p-5 border border-white/60`}
//           >
//             <div className="flex items-center space-x-3">
//               <div
//                 className={`w-8 h-8 rounded-full ${theme.accent.replace(
//                   "text-",
//                   "bg-"
//                 )}/20 flex items-center justify-center`}
//               >
//                 <span className="text-lg">{theme.emoji}</span>
//               </div>
//               <div>
//                 <p className={`text-sm font-semibold ${theme.accent}`}>
//                   Kesimpulan
//                 </p>
//                 <p className="text-gray-700 text-sm">
//                   Konsumsi {theme.name.toLowerCase()} secara rutin memberikan
//                   nutrisi optimal untuk tubuh yang lebih sehat.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Info Brand/Status tetap, memakai aksen tema */}
//         <div
//           className={`transition-all duration-1000 delay-700 ease-out ${
//             isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
//           }`}
//         >
//           <div className="bg-gray-900 rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-8 mb-4 lg:mb-6">
//               <div className="flex-1">
//                 <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 lg:mb-3">
//                   <span className={theme.accent.replace("text-", "text-")}>
//                     INFINIX
//                   </span>{" "}
//                   NOTE SERIES
//                 </h2>
//                 <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed">
//                   Infinix mendukung hidup sehat – energi{" "}
//                   {theme.name.toLowerCase()}, energi Anda.
//                 </p>
//               </div>
//               <div className="flex-shrink-0 self-center sm:self-start">
//                 <img
//                   src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=387&q=80"
//                   alt="Infinix Smartphone"
//                   className="w-20 h-24 sm:w-22 sm:h-28 lg:w-24 lg:h-32 object-cover rounded-xl lg:rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
//                   style={{ filter: "brightness(1.1) contrast(1.05)" }}
//                 />
//               </div>
//             </div>

//             <div className="mb-4 lg:mb-6">
//               <h3
//                 className={`text-xl lg:text-2xl font-semibold mb-2 lg:mb-3 ${theme.accent}`}
//               >
//                 Spesifikasi Unggulan
//               </h3>
//               <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
//                 <div className="text-center">
//                   <div className="text-base sm:text-lg font-semibold text-white">
//                     Baterai
//                   </div>
//                   <div className="text-xs sm:text-sm text-gray-400">
//                     Tahan Lama
//                   </div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-base sm:text-lg font-semibold text-white">
//                     Layar
//                   </div>
//                   <div className="text-xs sm:text-sm text-gray-400">
//                     Besar & Jernih
//                   </div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-base sm:text-lg font-semibold text-white">
//                     Performa
//                   </div>
//                   <div className="text-xs sm:text-sm text-gray-400">Tinggi</div>
//                 </div>
//               </div>
//             </div>

//             <div className="border-t border-gray-700 pt-4">
//               <div className="flex items-center justify-between">
//                 <div className="text-sm text-gray-400">Scanner Status</div>
//                 <div
//                   className={`flex items-center space-x-2 text-sm ${
//                     connectionStatus === "Connected"
//                       ? "text-green-400"
//                       : connectionStatus === "Connecting..." ||
//                         connectionStatus === "Reconnecting..."
//                       ? "text-yellow-400"
//                       : connectionStatus === "Paused"
//                       ? "text-gray-300"
//                       : "text-red-400"
//                   }`}
//                 >
//                   <div
//                     className={`w-2 h-2 rounded-full ${
//                       connectionStatus === "Connected"
//                         ? "bg-green-400 animate-pulse"
//                         : connectionStatus === "Connecting..." ||
//                           connectionStatus === "Reconnecting..."
//                         ? "bg-yellow-400 animate-pulse"
//                         : connectionStatus === "Paused"
//                         ? "bg-gray-300"
//                         : "bg-red-400"
//                     }`}
//                   ></div>
//                   <span>{connectionStatus}</span>
//                 </div>
//               </div>
//               {sessionData && (
//                 <div className="mt-2 text-xs text-gray-400">
//                   Live Session: {sessionData.totalItems} items,{" "}
//                   {sessionData.totalPoints} points
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

// Lookup untuk tema per buah (hindari class dinamis interpolasi)
const fruitTheme: Record<
  FruitKey,
  {
    name: string;
    emoji: string;
    // warna utama
    bgGradFrom: string;
    bgGradTo: string;
    accent: string;
    ring: string;
    pillBg: string;
    pillText: string;
    // nutrisi + manfaat
    nutrition: Array<{ label: string; percent: number }>;
    benefits: string[];
    // gambar
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

export default function FruitLandingPage() {
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
  const searchParams = useSearchParams();

  // Tema aktif berdasarkan buah terakhir
  const [activeFruitKey, setActiveFruitKey] = useState<FruitKey>("DEFAULT");

  // timeout ref untuk notifikasi
  const hideSuccessTimeoutRef = useRef<number | null>(null);
  // optional: filter sesi
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

  // Create floating particles effect
  useEffect(() => {
    const particles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5000,
    }));
    setFloatingParticles(particles);
  }, []);

  // Trigger pulse animation for new data
  const triggerPulse = (elementId: string) => {
    setPulsingElements((prev) => new Set([...prev, elementId]));
    setTimeout(() => {
      setPulsingElements((prev) => {
        const newSet = new Set(prev);
        newSet.delete(elementId);
        return newSet;
      });
    }, 1000);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoaded(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  // Helper untuk set tema dari nama item
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
      const t = (socket.io?.engine as any)?.transport?.name;
      // eslint-disable-next-line no-console
      console.log("✅ Home connected via", t || "unknown");
      (socket.io?.engine as any)?.once?.("upgrade", () => {
        const ut = (socket.io?.engine as any)?.transport?.name;
        // eslint-disable-next-line no-console
        console.log("🔼 transport upgraded to", ut);
      });
    };

    const onDisconnect = (reason: string) => {
      // eslint-disable-next-line no-console
      console.log("🔌 Home disconnected:", reason);
      setConnectionStatus("Disconnected");
    };

    const onReconnectAttempt = (n: number) => {
      // eslint-disable-next-line no-console
      console.log("🔄 Home reconnect attempt:", n);
      setConnectionStatus("Reconnecting...");
    };

    const onReconnect = (n: number) => {
      // eslint-disable-next-line no-console
      console.log("🔄 Home reconnected after", n, "attempts");
      setConnectionStatus("Connected");
      triggerPulse("reconnect");
    };

    const onReconnectFailed = () => {
      // eslint-disable-next-line no-console
      console.log("❌ Home reconnect failed");
      setConnectionStatus("Connection Failed");
    };

    const onConnectError = (err: Error) => {
      // eslint-disable-next-line no-console
      console.error("❌ Home connect_error:", err);
      setConnectionStatus("Connection Error");
    };

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

      // update tema berdasar item terakhir
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

      // tetap sesuaikan tema dengan itemName yang terakhir diubah
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
      setScanData({
        fruit: "session",
        point: 0,
        totalPoint: 0,
      });
      // reset tema ke default ketika sesi baru
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

      // pilih tema dari item dominan (opsional): pakai item terakhir di summary bila ada
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

    const onError = (error: any) => {
      // eslint-disable-next-line no-console
      console.error("❌ Home socket error:", error);
    };

    // socket listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("scan:update", onScanUpdate);
    socket.on("quantity:updated", onQuantityUpdated);
    socket.on("session:started", onSessionStarted);
    socket.on("session:finished", onSessionFinished);
    socket.on("error", onError);

    // manager listeners
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onReconnect);
    socket.io.on("reconnect_failed", onReconnectFailed);

    return () => {
      // eslint-disable-next-line no-console
      console.log("🏠 Home: cleanup socket", SOCKET_URL);
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

  // Fallback URL params / sessionStorage
  useEffect(() => {
    const scan = searchParams.get("scan");
    const point = searchParams.get("point");

    const storedData =
      typeof window !== "undefined"
        ? sessionStorage.getItem("scanResult")
        : null;

    if (scan && point) {
      const key = scan.toUpperCase();
      applyFruitTheme(key);
      const data: ScanData = {
        fruit: scan.toLowerCase(),
        point: parseInt(point),
        totalPoint: parseInt(point),
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
  }, [searchParams]);

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

  // Ambil tema aktif
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
