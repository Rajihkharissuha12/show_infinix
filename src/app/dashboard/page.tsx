"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import { io, Socket } from "socket.io-client";

export default function QRScannerDashboard() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [scanCount, setScanCount] = useState<number>(0);

  // Session management
  const [scanSession, setScanSession] = useState<any>({});
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [totalPoints, setTotalPoints] = useState<number>(0);

  // Socket.IO
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  // Camera states
  const [cameraPermission, setCameraPermission] = useState<string>("checking");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const devices = useDevices();

  // Anti-spam control
  const [canScan, setCanScan] = useState<boolean>(true);

  // Refs
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const SCAN_DELAY_DURATION = 2000;
  const MIN_SCAN_INTERVAL = 500;
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Initialize Socket.IO with better error handling
  // useEffect(() => {
  //   console.log("🔄 Initializing Socket.IO connection...");

  //   // ganti inisialisasi socketInstance di scanner
  //   const SOCKET_URL =
  //     typeof window !== "undefined"
  //       ? process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
  //       : "http://localhost:4000";

  //   const socketInstance = io(SOCKET_URL, {
  //     transports: ["polling", "websocket"],
  //     timeout: 20000,
  //     forceNew: true,
  //     reconnection: true,
  //     reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  //     reconnectionDelay: 1000,
  //   });

  //   // debug transport
  //   socketInstance.on("connect", () => {
  //     const t = socketInstance.io.engine.transport.name;
  //     console.log("✅ connected to", SOCKET_URL, "via", t);
  //     socketInstance.io.engine.on("upgrade", () => {
  //       console.log("🔼 upgraded to:", socketInstance.io.engine.transport.name);
  //     });
  //   });

  //   socketInstance.on("welcome", (data) => {
  //     console.log("👋 Welcome message:", data);
  //   });

  //   socketInstance.on("disconnect", (reason) => {
  //     console.log("🔌 Socket.IO disconnected:", reason);
  //     setConnectionStatus("Disconnected");
  //   });

  //   socketInstance.on("reconnect", (attemptNumber) => {
  //     console.log("🔄 Socket.IO reconnected after", attemptNumber, "attempts");
  //     setConnectionStatus("Connected");
  //     setReconnectAttempts(0);
  //   });

  //   socketInstance.on("reconnect_attempt", (attemptNumber) => {
  //     console.log("🔄 Reconnect attempt:", attemptNumber);
  //     setConnectionStatus("Reconnecting...");
  //     setReconnectAttempts(attemptNumber);
  //   });

  //   socketInstance.on("reconnect_failed", () => {
  //     console.error("❌ Socket.IO reconnection failed");
  //     setConnectionStatus("Failed");
  //   });

  //   // Session events
  //   socketInstance.on("session:confirmed", (data) => {
  //     console.log("✅ Session confirmed:", data);
  //   });

  //   socketInstance.on("scan:confirmed", (data) => {
  //     console.log("✅ Scan confirmed:", data);
  //   });

  //   // Optional: ikut sinkron dengan broadcast untuk menampilkan hasil realtime yang diproses server
  //   const onInventoryUpdate = (payload: {
  //     sessionId: string;
  //     itemName: string;
  //     quantity: number;
  //     lastUpdate?: number;
  //   }) => {
  //     const key = String(payload.itemName || "").toUpperCase();
  //     setScanSession((prev: any) => {
  //       const next = { ...prev };
  //       if (!next[key]) {
  //         // default points lokal agar UI konsisten
  //         const ITEM_POINTS = {
  //           APEL: 20,
  //           JERUK: 15,
  //           PISANG: 10,
  //           MANGGA: 25,
  //         } as const;
  //         const pointsPerItem =
  //           ITEM_POINTS[key as keyof typeof ITEM_POINTS] ?? 10;
  //         next[key] = {
  //           name: key,
  //           quantity: payload.quantity,
  //           pointsPerItem,
  //           totalPoints: payload.quantity * pointsPerItem,
  //           lastScanned: new Date().toLocaleTimeString("id-ID"),
  //         };
  //       } else {
  //         const item = next[key];
  //         item.quantity = payload.quantity;
  //         item.totalPoints = item.quantity * item.pointsPerItem;
  //         item.lastScanned = new Date().toLocaleTimeString("id-ID");
  //       }
  //       const total = Object.values(next).reduce(
  //         (sum: number, it: any) => sum + it.totalPoints,
  //         0
  //       );
  //       setTotalPoints(total);
  //       return next;
  //     });
  //   };

  //   const onInventoryReset = (_payload: { sessionId: string }) => {
  //     // bersihkan state lokal
  //     setScanSession({});
  //     setTotalPoints(0);
  //     setScanCount(0);
  //   };

  //   socketInstance.on("inventory:update", onInventoryUpdate);
  //   socketInstance.on("inventory:reset", onInventoryReset);

  //   // Error handling
  //   socketInstance.on("error", (error: any) => {
  //     console.error("❌ Socket.IO error:", error);
  //     setError(`Socket error: ${error.message || "Connection failed"}`);
  //   });

  //   socketInstance.on("connect_error", (error: any) => {
  //     console.error("❌ Socket.IO connection error:", error);
  //     setConnectionStatus("Connection Error");
  //   });

  //   return () => {
  //     console.log("🔄 Cleaning up Socket.IO connection...");
  //     socketInstance.off("inventory:update", onInventoryUpdate);
  //     socketInstance.off("inventory:reset", onInventoryReset);
  //     if (reconnectTimeoutRef.current) {
  //       clearTimeout(reconnectTimeoutRef.current);
  //     }
  //     socketInstance.disconnect();
  //   };
  // }, []);
  useEffect(() => {
    const SOCKET_URL =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_SOCKET_URL ||
          "https://986d3bd6f6ce.ngrok-free.app"
        : "https://986d3bd6f6ce.ngrok-free.app";

    // Satu koneksi per mount
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // utamakan websocket
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      // auth: { token }, // bila perlu
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setConnectionStatus("Connected");
    });

    socketInstance.on("disconnect", (reason) => {
      setConnectionStatus("Disconnected");
    });

    // Global ringkasan (opsional)
    const onInventoryUpdate = (payload: {
      sessionId: string;
      itemName: string;
      quantity: number;
      lastUpdate?: number;
    }) => {
      if (payload.sessionId !== sessionId) return; // filter agar tidak campur sesi
      // ...update state ringkas seperti existing code
    };

    // Detail per-room
    const onScanUpdate = (payload: {
      sessionId: string;
      item: {
        name: string;
        quantity: number;
        pointsPerItem: number;
        totalPoints: number;
        lastScanned?: string;
      };
      session: {
        totalItems: number;
        totalPoints: number;
        items: Record<string, any>;
        lastUpdate: number;
      };
    }) => {
      if (payload.sessionId !== sessionId) return;
      setScanSession(payload.session.items);
      setTotalPoints(payload.session.totalPoints);
    };

    const onQuantityUpdated = (payload: {
      sessionId: string;
      itemName: string;
      newQuantity: number;
      session: {
        totalItems: number;
        totalPoints: number;
        items: Record<string, any>;
        lastUpdate: number;
      };
    }) => {
      if (payload.sessionId !== sessionId) return;
      setScanSession(payload.session.items);
      setTotalPoints(payload.session.totalPoints);
    };

    socketInstance.on("inventory:update", onInventoryUpdate);
    socketInstance.on("scan:update", onScanUpdate);
    socketInstance.on("quantity:updated", onQuantityUpdated);

    socketInstance.on("error", (error: any) => {
      setError(`Socket error: ${error.message || "Connection failed"}`);
    });

    socketInstance.on("connect_error", () => {
      setConnectionStatus("Connection Error");
    });

    return () => {
      socketInstance.off("inventory:update", onInventoryUpdate);
      socketInstance.off("scan:update", onScanUpdate);
      socketInstance.off("quantity:updated", onQuantityUpdated);
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [sessionId]);

  // Camera permission check
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setCameraPermission("granted");
        stream.getTracks().forEach((track) => track.stop());
        console.log("✅ Camera permission granted");
      } catch (err) {
        console.error("❌ Camera permission denied:", err);
        setCameraPermission("denied");
      }
    };
    checkCamera();
  }, []);

  // Clear timeouts
  const clearAllTimeouts = useCallback(() => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
  }, []);

  // Update session item (lokal dan emit ke server)
  const updateSessionItem = useCallback(
    (itemName: string) => {
      const now = new Date().toLocaleTimeString("id-ID");
      const itemKey = String(itemName).toUpperCase();

      const ITEM_POINTS = {
        APEL: 20,
        JERUK: 15,
        PISANG: 10,
        MANGGA: 25,
      } as const;

      const pointsPerItem =
        ITEM_POINTS[itemKey as keyof typeof ITEM_POINTS] ?? 10;

      setScanSession((prev: any) => {
        const newSession = { ...prev };

        if (newSession[itemKey]) {
          newSession[itemKey] = {
            ...newSession[itemKey],
            quantity: newSession[itemKey].quantity + 1,
            totalPoints: (newSession[itemKey].quantity + 1) * pointsPerItem,
            lastScanned: now,
          };
        } else {
          newSession[itemKey] = {
            name: itemKey,
            quantity: 1,
            pointsPerItem: pointsPerItem,
            totalPoints: pointsPerItem,
            lastScanned: now,
          };
        }

        const total = Object.values(newSession).reduce(
          (sum: number, item: any) => sum + item.totalPoints,
          0
        );
        setTotalPoints(total);

        return newSession;
      });

      // Emit to server if connected
      if (socket?.connected && sessionId) {
        socket.emit("scan:result", {
          sessionId,
          itemName: itemKey,
          quantity: 1,
          timestamp: Date.now(),
        });
        console.log("📡 Sent scan result to server");
      } else {
        console.warn("⚠️ Socket not connected, scan saved locally only");
      }
    },
    [socket, sessionId]
  );

  // Handle scan
  const handleScan = useCallback(
    (detectedCodes: any[]) => {
      const currentTime = Date.now();
      const data = detectedCodes[0]?.rawValue;

      if (!data || !canScan) return;
      if (currentTime - lastScanTimestampRef.current < MIN_SCAN_INTERVAL)
        return;

      lastScanTimestampRef.current = currentTime;
      setCanScan(false);

      console.log("✅ QR Code scanned:", data);

      clearAllTimeouts();
      setScanCount((prev) => prev + 1);
      updateSessionItem(data);

      setScannedResult(String(data).toUpperCase());
      setShowSuccess(true);

      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
        setScannedResult("");
      }, 1500);

      delayTimeoutRef.current = setTimeout(() => {
        setCanScan(true);
      }, SCAN_DELAY_DURATION);
    },
    [canScan, updateSessionItem, clearAllTimeouts]
  );

  // Handle errors
  const handleError = useCallback((error: any) => {
    console.error("Scanner error:", error);
    setError(`Scanner error: ${error.message || "Unknown error"}`);
  }, []);

  // Start session
  const startScanning = () => {
    console.log("🚀 Starting new session...");

    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    setSessionId(newSessionId);
    setIsScanning(true);
    setSessionActive(true);
    setScanCount(0);
    setScanSession({});
    setTotalPoints(0);
    setCanScan(true);
    setError("");
    clearAllTimeouts();

    // Emit to server if connected
    if (socket?.connected) {
      socket.emit("session:start", {
        sessionId: newSessionId,
        timestamp: Date.now(),
      });
      console.log("📡 Session start sent to server");
    } else {
      console.warn("⚠️ Starting session in offline mode");
    }
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    clearAllTimeouts();
  };

  // const finishSession = async () => {
  //   setIsScanning(false);
  //   setSessionActive(false);
  //   setShowSummaryModal(true);

  //   if (socket?.connected && sessionId) {
  //     socket.emit("session:finish", {
  //       sessionId,
  //       summary: {
  //         totalItems: getTotalItems(),
  //         totalPoints: totalPoints,
  //         items: scanSession,
  //       },
  //     });
  //   }

  //   if (typeof window !== "undefined") {
  //     // 1) Normalisasi aman
  //     const items = Array.isArray(scanSession)
  //       ? scanSession
  //       : scanSession && typeof scanSession === "object"
  //       ? Object.values(scanSession as any)
  //       : [];

  //     // 2) Generate PDF hanya jika items valid
  //     const pm = await import("pdfmake/build/pdfmake");
  //     const vfsFonts = await import("pdfmake/build/vfs_fonts");
  //     const pdfMake: any = (pm as any).default || pm;
  //     pdfMake.vfs = (vfsFonts as any).vfs;

  //     const body = [
  //       ["#", "Item", "Points"],
  //       ...(items.length
  //         ? items.map((it: any, i: number) => [
  //             i + 1,
  //             it?.name || it?.code || "-",
  //             it?.points ?? 0,
  //           ])
  //         : [["-", "Tidak ada data", "-"]]),
  //     ];

  //     const dd = {
  //       content: [
  //         { text: "Scan Summary", style: "header" },
  //         { text: `Session ID: ${sessionId || "-"}` },
  //         { text: `Total Items: ${getTotalItems()}` },
  //         { text: `Total Points: ${totalPoints}` },
  //         { table: { widths: ["auto", "*", "auto"], body } },
  //       ],
  //       styles: { header: { fontSize: 16, bold: true } },
  //       pageMargins: [24, 24, 24, 24],
  //     };

  //     // Preview tab baru (atau ganti ke .print())
  //     pdfMake.createPdf(dd).print();
  //   }
  // };

  // helper agregasi buah per nama

  // function groupFruits(items: any[]) {
  //   const map = new Map<
  //     string,
  //     { name: string; qty: number; ppu: number; total: number }
  //   >();
  //   for (const it of items) {
  //     const name = it?.name || it?.fruit || it?.code || "-";
  //     const ppu = Number(it?.points ?? it?.point ?? 0);
  //     const key = String(name).toLowerCase();
  //     const prev = map.get(key);
  //     if (prev) {
  //       prev.qty += 1;
  //       prev.total += ppu;
  //     } else {
  //       map.set(key, { name, qty: 1, ppu, total: ppu });
  //     }
  //   }
  //   return Array.from(map.values());
  // }

  // const finishSession = async () => {
  //   setIsScanning(false);
  //   setSessionActive(false);
  //   setShowSummaryModal(true);

  //   if (socket?.connected && sessionId) {
  //     socket.emit("session:finish", {
  //       sessionId,
  //       summary: {
  //         totalItems: getTotalItems(),
  //         totalPoints: totalPoints,
  //         items: scanSession,
  //       },
  //     });
  //   }

  //   if (typeof window !== "undefined") {
  //     // normalisasi input
  //     const rawItems = Array.isArray(scanSession)
  //       ? scanSession
  //       : scanSession && typeof scanSession === "object"
  //       ? Object.values(scanSession as any)
  //       : [];

  //     const fruits = groupFruits(rawItems);

  //     const pm = await import("pdfmake/build/pdfmake");
  //     const vfsFonts = await import("pdfmake/build/vfs_fonts");
  //     const pdfMake: any = (pm as any).default || pm;
  //     pdfMake.vfs = (vfsFonts as any).vfs;

  //     // konversi mm -> pt: 1mm ≈ 2.83465pt; 58mm ≈ 164pt; 80mm ≈ 226pt
  //     const RECEIPT_WIDTH_PT = 164; // 58mm; ganti ke 226 untuk 80mm

  //     const tableBody = [
  //       [
  //         { text: "Buah", bold: true },
  //         { text: "Poin/Sat", alignment: "right", bold: true },
  //         { text: "Qty", alignment: "right", bold: true },
  //         { text: "Total", alignment: "right", bold: true },
  //       ],
  //       ...(fruits.length
  //         ? fruits.map((f) => [
  //             { text: f.name, noWrap: true },
  //             { text: String(f.ppu), alignment: "right" },
  //             { text: String(f.qty), alignment: "right" },
  //             { text: String(f.total), alignment: "right" },
  //           ])
  //         : [
  //             [
  //               { text: "Tidak ada data", colSpan: 4, alignment: "center" },
  //               {},
  //               {},
  //               {},
  //             ],
  //           ]),
  //     ];

  //     const dd = {
  //       pageSize: { width: RECEIPT_WIDTH_PT, height: "auto" },
  //       pageMargins: [8, 8, 8, 8], // margin kecil untuk thermal
  //       content: [
  //         { text: "Total Points", style: "h" },
  //         { text: String(totalPoints ?? 0), style: "tp" },
  //         {
  //           canvas: [
  //             {
  //               type: "line",
  //               x1: 0,
  //               y1: 2,
  //               x2: RECEIPT_WIDTH_PT - 16,
  //               y2: 2,
  //               lineWidth: 0.5,
  //             },
  //           ],
  //         },
  //         { text: "Daftar Buah", style: "sub", margin: [0, 6, 0, 4] },
  //         {
  //           table: {
  //             headerRows: 1,
  //             widths: ["*", "auto", "auto", "auto"],
  //             body: tableBody,
  //           },
  //           layout: {
  //             hLineWidth: (i: number, node: any) =>
  //               i === 0 || i === node.table.body.length ? 0.5 : 0.25,
  //             vLineWidth: () => 0,
  //             hLineColor: () => "#cccccc",
  //             paddingLeft: () => 2,
  //             paddingRight: () => 2,
  //             paddingTop: () => 2,
  //             paddingBottom: () => 2,
  //           },
  //         },
  //         {
  //           text: `Session: ${sessionId || "-"}`,
  //           style: "meta",
  //           margin: [0, 6, 0, 0],
  //         },
  //       ],
  //       styles: {
  //         h: { fontSize: 10, bold: true, alignment: "center" },
  //         tp: {
  //           fontSize: 16,
  //           bold: true,
  //           alignment: "center",
  //           margin: [0, 2, 0, 6],
  //         },
  //         sub: { fontSize: 9, bold: true },
  //         meta: { fontSize: 7, color: "#666" },
  //       },
  //       defaultStyle: { fontSize: 8, lineHeight: 1.1 },
  //     };

  //     // langsung print; jika ingin preview tab baru dulu gunakan .open()
  //     pdfMake.createPdf(dd).print();
  //   }
  // };

  // KONVERSI: 58mm ≈ 164pt; 80mm ≈ 226pt
  const MM_TO_PT = 2.83465;
  const WIDTH_58MM = Math.round(58 * MM_TO_PT); // 164
  const WIDTH_80MM = Math.round(80 * MM_TO_PT); // 227

  const finishSession = async () => {
    setIsScanning(false);
    setSessionActive(false);
    setShowSummaryModal(true);

    if (socket?.connected && sessionId) {
      socket.emit("session:finish", {
        sessionId,
        summary: {
          totalItems: getTotalItems(),
          totalPoints: totalPoints,
          items: scanSession,
        },
      });
    }

    if (typeof window !== "undefined") {
      // Normalisasi dari objek keyed menjadi array
      const itemsArr =
        scanSession && typeof scanSession === "object"
          ? Object.values(scanSession as Record<string, any>)
          : [];

      // Import pdfmake client-side
      const pm = await import("pdfmake/build/pdfmake");
      const vfsFonts = await import("pdfmake/build/vfs_fonts");
      const pdfMake: any = (pm as any).default || pm;
      pdfMake.vfs = (vfsFonts as any).vfs;

      // Pilih lebar kertas: ganti ke WIDTH_80MM bila pakai 80mm
      const RECEIPT_WIDTH_PT = WIDTH_58MM;

      // Tabel daftar buah: name, pointsPerItem, quantity, totalPoints
      const tableBody = [
        [
          { text: "Buah", bold: true },
          { text: "Poin/Sat", alignment: "right", bold: true },
          { text: "Qty", alignment: "right", bold: true },
          { text: "Total", alignment: "right", bold: true },
        ],
        ...(itemsArr.length
          ? itemsArr.map((it: any) => [
              { text: String(it?.name ?? "-"), noWrap: true },
              { text: String(it?.pointsPerItem ?? 0), alignment: "right" },
              { text: String(it?.quantity ?? 0), alignment: "right" },
              { text: String(it?.totalPoints ?? 0), alignment: "right" },
            ])
          : [
              [
                { text: "Tidak ada data", colSpan: 4, alignment: "center" },
                {},
                {},
                {},
              ],
            ]),
      ];

      const dd = {
        pageSize: { width: RECEIPT_WIDTH_PT, height: "auto" },
        pageMargins: [8, 8, 8, 8],
        defaultStyle: { fontSize: 8, lineHeight: 1.1 },
        content: [
          { text: "Total Points", style: "h" },
          { text: String(totalPoints ?? 0), style: "tp" },
          {
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 2,
                x2: RECEIPT_WIDTH_PT - 16,
                y2: 2,
                lineWidth: 0.5,
              },
            ],
          },
          { text: "Daftar Buah", style: "sub", margin: [0, 6, 0, 4] },
          {
            table: {
              headerRows: 1,
              widths: ["*", "auto", "auto", "auto"],
              body: tableBody,
            },
            layout: {
              hLineWidth: (i: number, node: any) =>
                i === 0 || i === node.table.body.length ? 0.5 : 0.25,
              vLineWidth: () => 0,
              hLineColor: () => "#cccccc",
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: () => 2,
              paddingBottom: () => 2,
            },
          },
          // {
          //   text: `Session: ${sessionId || "-"}`,
          //   style: "meta",
          //   margin: [0, 6, 0, 0],
          // },
        ],
        styles: {
          h: { fontSize: 10, bold: true, alignment: "center" },
          tp: {
            fontSize: 16,
            bold: true,
            alignment: "center",
            margin: [0, 2, 0, 6],
          },
          sub: { fontSize: 9, bold: true },
          meta: { fontSize: 7, color: "#666" },
        },
      };

      // Cetak langsung
      pdfMake.createPdf(dd).open();
      // pdfMake.createPdf(dd).getBlob(function (blob: any) {
      //   const url = URL.createObjectURL(blob);
      //   const iframe = document.createElement("iframe");
      //   iframe.style.display = "none";
      //   iframe.src = url;
      //   document.body.appendChild(iframe);
      //   iframe.onload = function () {
      //     if (iframe.contentWindow) {
      //       iframe.contentWindow.print();
      //     }
      //   };
      // });
    }
  };

  // Manual quantity adjustment
  const adjustQuantity = (itemName: string, delta: number) => {
    const key = String(itemName).toUpperCase();

    setScanSession((prev: any) => {
      const newSession = { ...prev };

      if (newSession[key]) {
        const newQuantity = Math.max(0, newSession[key].quantity + delta);

        if (newQuantity === 0) {
          delete newSession[key];
        } else {
          newSession[key] = {
            ...newSession[key],
            quantity: newQuantity,
            totalPoints: newQuantity * newSession[key].pointsPerItem,
            lastScanned: new Date().toLocaleTimeString("id-ID"),
          };
        }

        const total = Object.values(newSession).reduce(
          (sum: number, item: any) => sum + item.totalPoints,
          0
        );
        setTotalPoints(total);
      }

      return newSession;
    });

    // Emit to server if connected
    if (socket?.connected && sessionId) {
      socket.emit("quantity:adjust", {
        sessionId,
        itemName: key,
        delta,
        timestamp: Date.now(),
      });
    }
  };

  const getTotalItems = () => {
    return Object.values(scanSession).reduce(
      (total: number, item: any) => total + item.quantity,
      0
    );
  };

  const closeSummary = () => {
    setShowSummaryModal(false);
    setScanSession({});
    setScanCount(0);
    setTotalPoints(0);
    setSessionId("");
  };

  // Cleanup
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            QR Scanner Dashboard
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Socket.IO Real-time Scanner
          </p>
          <div className="flex justify-center items-center space-x-2 mt-3 flex-wrap gap-y-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                sessionActive
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {sessionActive ? "Session Active" : "No Session"}
            </span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                getTotalItems() > 0
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Items: {getTotalItems()}
            </span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                totalPoints > 0
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Points: {totalPoints}
            </span>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                connectionStatus === "Connected"
                  ? "bg-green-100 text-green-700"
                  : connectionStatus === "Connecting..." ||
                    connectionStatus === "Reconnecting..."
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {connectionStatus}
              {reconnectAttempts > 0 && ` (${reconnectAttempts})`}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Connection Status */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              📡 Connection Status
            </h3>
            <div
              className={`flex items-center space-x-2 p-3 rounded-xl ${
                connectionStatus === "Connected"
                  ? "bg-green-50"
                  : connectionStatus.includes("Reconnecting") ||
                    connectionStatus === "Connecting..."
                  ? "bg-yellow-50"
                  : "bg-red-50"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === "Connected"
                    ? "bg-green-500"
                    : connectionStatus.includes("Reconnecting") ||
                      connectionStatus === "Connecting..."
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
                }`}
              ></div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    connectionStatus === "Connected"
                      ? "text-green-800"
                      : connectionStatus.includes("Reconnecting") ||
                        connectionStatus === "Connecting..."
                      ? "text-yellow-800"
                      : "text-red-800"
                  }`}
                >
                  {connectionStatus === "Connected"
                    ? "✅ Socket.IO Connected"
                    : connectionStatus.includes("Reconnecting")
                    ? "🔄 Reconnecting..."
                    : connectionStatus === "Connecting..."
                    ? "⏳ Connecting..."
                    : "❌ Connection Failed"}
                </p>
                <p className="text-xs text-gray-600">
                  Camera:{" "}
                  {cameraPermission === "granted" ? "Ready" : "Not Available"}
                  {reconnectAttempts > 0 &&
                    ` • Attempts: ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`}
                </p>
              </div>
            </div>
          </div>

          {/* Session Items Display */}
          {sessionActive && Object.keys(scanSession).length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                📦 Session Items (Total: {totalPoints} points)
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {Object.values(scanSession).map((item: any, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                        {item.name === "APEL" && (
                          <span className="ml-1">🍎</span>
                        )}
                        {item.name === "JERUK" && (
                          <span className="ml-1">🍊</span>
                        )}
                        {item.name === "PISANG" && (
                          <span className="ml-1">🍌</span>
                        )}
                        {item.name === "MANGGA" && (
                          <span className="ml-1">🥭</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.pointsPerItem} pts/item • {item.lastScanned}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adjustQuantity(item.name, -1)}
                        className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors"
                      >
                        -
                      </button>

                      <div className="text-center min-w-[3rem]">
                        <div className="font-bold text-lg">{item.quantity}</div>
                        <div className="text-xs text-green-600 font-medium">
                          {item.totalPoints} pts
                        </div>
                      </div>

                      <button
                        onClick={() => adjustQuantity(item.name, 1)}
                        className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold hover:bg-green-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scanner Container */}
          {isScanning ? (
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Success Overlay */}
              {showSuccess && (
                <div className="absolute top-4 left-4 right-4 z-20 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg animate-bounce">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
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
                    <div>
                      <p className="font-bold text-sm">
                        {scannedResult === "APEL"
                          ? "🍎 APEL +20pts!"
                          : `${scannedResult} Added!`}
                      </p>
                      <p className="text-xs opacity-90">
                        Total: {totalPoints} pts
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanner */}
              {cameraPermission === "granted" && (
                <Scanner
                  formats={["qr_code", "micro_qr_code", "aztec", "data_matrix"]}
                  constraints={{
                    deviceId: selectedDevice || undefined,
                    facingMode: "environment",
                  }}
                  onScan={handleScan}
                  onError={handleError}
                  styles={{
                    container: {
                      height: "300px",
                      width: "100%",
                      borderRadius: "16px",
                    },
                  }}
                  components={{
                    onOff: false,
                    torch: true,
                    zoom: false,
                    finder: true,
                  }}
                  allowMultiple={false}
                  scanDelay={100}
                  paused={!canScan}
                />
              )}

              {/* Camera Error Overlay */}
              {cameraPermission !== "granted" && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center text-white p-6">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01"
                      />
                    </svg>
                    <p className="text-lg font-bold mb-2">
                      Camera Access Required
                    </p>
                    <p className="text-sm opacity-90 mb-4">
                      Please allow camera access
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              )}

              {/* Status Bar */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black bg-opacity-60 px-3 py-1 rounded-full inline-block">
                  🎯 Scan QR Code • Total: {totalPoints} pts
                </p>
              </div>

              {/* Ready Indicator */}
              {canScan && cameraPermission === "granted" && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Ready</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Placeholder
            <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.99c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H12m0 0V8.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5V12m0 0v.01"
                  />
                </svg>
                <p className="text-sm">
                  {sessionActive
                    ? "Session paused - tap Resume to continue"
                    : "Start session to begin scanning"}
                </p>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="space-y-3">
            {!sessionActive ? (
              <button
                onClick={startScanning}
                className="w-full py-4 px-6 rounded-2xl font-semibold text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center space-x-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>🚀 Start New Session</span>
                </div>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={
                    isScanning ? stopScanning : () => setIsScanning(true)
                  }
                  className={`py-3 px-4 rounded-2xl font-semibold text-sm shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isScanning
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {isScanning ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      )}
                    </svg>
                    <span>{isScanning ? "Pause" : "Resume"}</span>
                  </div>
                </button>

                <button
                  onClick={finishSession}
                  className="py-3 px-4 rounded-2xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>✅ Finish</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start space-x-2 text-red-800">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium">Error</p>
                  <p className="text-xs mt-1">{error}</p>
                  <button
                    onClick={() => setError("")}
                    className="text-xs mt-2 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Features Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-3">✨ Features:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-green-600 min-w-[1.5rem]">
                  🍎
                </span>
                <span>
                  APEL: 20pts • Jeruk: 15pts • Pisang: 10pts • Mangga: 25pts
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-blue-600 min-w-[1.5rem]">
                  🔄
                </span>
                <span>Real-time sync - Works offline if needed</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-purple-600 min-w-[1.5rem]">
                  📊
                </span>
                <span>Auto reconnect - Persistent connection</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Session Complete!
              </h2>
              <p className="text-gray-600 mt-2">
                Scan session finished successfully
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  📋 Session Summary
                </h3>

                {Object.keys(scanSession).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No items scanned
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.values(scanSession).map((item: any, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-white rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
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
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.pointsPerItem} pts/item
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {item.totalPoints}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} qty
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xl font-bold text-blue-600">
                    {Object.keys(scanSession).length}
                  </p>
                  <p className="text-xs text-blue-800">Types</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xl font-bold text-green-600">
                    {getTotalItems()}
                  </p>
                  <p className="text-xs text-green-800">Items</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xl font-bold text-purple-600">
                    {totalPoints}
                  </p>
                  <p className="text-xs text-purple-800">Points</p>
                </div>
              </div>

              <button
                onClick={closeSummary}
                className="w-full py-3 px-6 rounded-2xl font-semibold text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Close & Start New Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
