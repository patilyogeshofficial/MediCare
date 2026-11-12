/**
 * MediCare V2.0 - Secure Real-Time Server-Sent Events (SSE) Client
 * Uses native Fetch streaming with standard Authorization Bearer header.
 * Eliminates JWT token exposure in URLs, server access logs, and monitoring systems.
 */
export function createNotificationStream(
  path = "/notifications/stream",
  onNotification,
  onConnect,
  onError
) {
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
  ).replace(/\/+$/, "");

  const streamUrl = `${apiBaseUrl}${path}`;

  let abortController = null;
  let reconnectTimer = null;
  let isClosed = false;
  let reconnectDelay = 3000;

  const connect = async () => {
    if (isClosed) return;

    let token = "";
    try {
      const storedAuth = localStorage.getItem("medicare_auth");
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        token = parsed.token || "";
      }
    } catch (e) {
      console.error("Error reading token for SSE:", e);
    }

    if (!token) {
      return;
    }

    abortController = new AbortController();

    try {
      const response = await fetch(streamUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE HTTP error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by response body");
      }

      // Successful connection: reset backoff delay
      reconnectDelay = 3000;
      if (onConnect) onConnect("connected");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (!isClosed) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by double newlines (\n\n or \r\n\r\n)
        const parts = buffer.split(/\r?\n\r?\n/);
        // The last part is either empty or incomplete data still being received
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;

          let eventName = "message";
          const dataLines = [];

          const lines = part.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
            } else if (line.startsWith(":")) {
              // Comment / heartbeat ping from server
            }
          }

          const rawData = dataLines.join("\n");

          if (eventName === "NOTIFICATION" && rawData) {
            try {
              const parsed = JSON.parse(rawData);
              if (onNotification) onNotification(parsed);
            } catch (err) {
              console.error("Failed to parse SSE notification payload:", err);
            }
          } else if (eventName === "CONNECT") {
            if (onConnect) onConnect(rawData || "connected");
          } else if (eventName === "HEARTBEAT") {
            // Heartbeat received: keep-alive active
          }
        }
      }
    } catch (err) {
      if (isClosed || abortController?.signal?.aborted) {
        return;
      }
      if (onError) onError(err);
    } finally {
      if (!isClosed) {
        // Automatic reconnection with progressive backoff (up to 30s)
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
          connect();
        }, reconnectDelay);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (abortController) {
      abortController.abort();
    }
  };
}
