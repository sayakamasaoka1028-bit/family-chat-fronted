import { useEffect, useRef, useState } from "react";
import "./App.css";

import mama from "./assets/mama.jpg";
import taichi from "./assets/taichi.jpg";
import ai from "./assets/ai.jpg";
import hina from "./assets/hina.jpg";
import papa from "./assets/papa.jpg";

const MESSAGES_API = "https://family.event-link.jp/api/messages";
const DEVICES_API = "https://family.event-link.jp/api/devices";

type UserKey = "mama" | "taichi" | "ai" | "hina" | "papa";

type Device = {
  id: number;
  device_token: string;
  user_key: UserKey;
  name: string;
};

type Message = {
  id: number;
  text: string;
  sender: string;
  time: string;
  name: string;
  icon: string;
};

type ApiMessage = {
  id: number;
  text: string;
  sender: string;
  name: string;
  created_at: string;
  updated_at: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const lastMessageIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playNotificationSound = async () => {
    const audioContext = audioContextRef.current;

    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    oscillator.type = "sine";

    gain.gain.setValueAtTime(0.2, audioContext.currentTime);

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.25,
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);
  };

  const enableNotificationSound = async () => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext;

      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    setSoundEnabled(true);

    // 通知ON確認音
    await playNotificationSound();
  };
  const subscribePushNotification = async () => {
    console.log("Pushボタン押された！");
    try {
      const permission = await Notification.requestPermission();
      console.log("通知許可:", permission);
      if (permission !== "granted") {
        alert("通知が許可されませんでした");
        return;
      }

      console.log("Service Worker待機中");

      const registration = await navigator.serviceWorker.ready;

      console.log("Service Worker取得成功", registration);

      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

        const base64 = (base64String + padding)
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        const rawData = window.atob(base64);

        return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
      };

      const vapidPublicKey = urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY,
      );
      console.log("VAPID文字列:", import.meta.env.VITE_VAPID_PUBLIC_KEY);
      console.log("VAPID長さ:", vapidPublicKey.length);
      console.log("Push購読開始");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      console.log("Push購読成功", subscription);

      const subscriptionJson = subscription.toJSON();

      if (!subscriptionJson.endpoint || !subscriptionJson.keys || !device) {
        throw new Error("Push購読情報を取得できませんでした");
      }

      const response = await fetch(
        "https://family.event-link.jp/api/push-subscriptions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_token: device.device_token,
            endpoint: subscriptionJson.endpoint,
            keys: {
              p256dh: subscriptionJson.keys.p256dh,
              auth: subscriptionJson.keys.auth,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Push購読の登録に失敗しました");
      }

      alert("🔔 Push通知をONにしました");
    } catch (error) {
      console.error("Push通知登録失敗", error);
    }
  };

  const getDeviceToken = () => {
    let token = localStorage.getItem("deviceToken");

    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("deviceToken", token);
    }

    return token;
  };
  // 古いデータも正しく表示するための補正
  const resolveSender = (message: ApiMessage): UserKey | string => {
    if (
      message.sender === "mama" ||
      message.sender === "taichi" ||
      message.sender === "ai" ||
      message.sender === "hina" ||
      message.sender === "papa"
    ) {
      return message.sender;
    }

    if (message.name === "ママ" || message.name === "さやか") {
      return "mama";
    }

    if (message.name === "たいちゃん") {
      return "taichi";
    }

    if (message.name === "愛") {
      return "ai";
    }
    if (message.name === "ひな") {
      return "hina";
    }

    if (message.name === "パパ") {
      return "papa";
    }

    return message.sender;
  };

  const icons: Record<UserKey, string> = {
    mama,
    taichi,
    ai,
    hina,
    papa,
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(MESSAGES_API);
      const data: ApiMessage[] = await response.json();

      const newMessages = data.map((message) => {
        const sender = resolveSender(message);

        return {
          id: message.id,
          text: message.text,
          sender,
          name: message.name,
          time: new Date(message.created_at).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          icon: icons[sender as UserKey] ?? mama,
        };
      });
      // 新着メッセージがあるか確認
      if (data.length > 0) {
        const newestMessage = data.reduce((latest, message) =>
          message.id > latest.id ? message : latest,
        );
        // 初回読み込みでは音を鳴らさない
        if (lastMessageIdRef.current === null) {
          lastMessageIdRef.current = newestMessage.id;
        } else if (newestMessage.id !== lastMessageIdRef.current) {
          // 自分以外から届いたメッセージだけ音を鳴らす
          if (
            soundEnabled &&
            device &&
            resolveSender(newestMessage) !== device.user_key
          ) {
            playNotificationSound();
          }

          lastMessageIdRef.current = newestMessage.id;
        }
      }

      setMessages(newMessages);
    } catch (error) {
      console.error("メッセージ取得失敗", error);
    }
  };

  // Laravelに「この端末は誰？」と問い合わせる
  const loadDevice = async () => {
    const token = getDeviceToken();

    try {
      const response = await fetch(`${DEVICES_API}/${token}`);

      if (response.status === 404) {
        setDevice(null);
        return;
      }

      if (!response.ok) {
        throw new Error("端末情報の取得に失敗しました");
      }

      const data: Device = await response.json();
      setDevice(data);
    } catch (error) {
      console.error("端末情報取得失敗", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevice();
    loadMessages();
  }, []);

  useEffect(() => {
    if (!device) return;

    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [device, soundEnabled]);

  // この端末をママ・たいちゃんのどちらかとしてLaravelへ登録
  const registerDevice = async (userKey: UserKey, name: string) => {
    const token = getDeviceToken();

    try {
      const response = await fetch(DEVICES_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_token: token,
          user_key: userKey,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error("端末登録に失敗しました");
      }

      const data: Device = await response.json();
      setDevice(data);
    } catch (error) {
      console.error("端末登録失敗", error);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !device) return;

    try {
      const response = await fetch(MESSAGES_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": device.device_token,
        },
        body: JSON.stringify({
          text,
        }),
      });

      if (!response.ok) {
        throw new Error("メッセージ送信に失敗しました");
      }

      setText("");
      await loadMessages();
    } catch (error) {
      console.error("送信失敗", error);
    }
  };
  const deleteMessage = async (messageId: number) => {
    if (!device) return;

    const ok = window.confirm("このメッセージを削除しますか？");

    if (!ok) return;

    try {
      const response = await fetch(`${MESSAGES_API}/${messageId}`, {
        method: "DELETE",
        headers: {
          "X-Device-Token": device.device_token,
        },
      });

      if (!response.ok) {
        throw new Error("メッセージ削除に失敗しました");
      }

      await loadMessages();
    } catch (error) {
      console.error("削除失敗", error);
    }
  };
  if (loading) {
    return <div>読み込み中...</div>;
  }

  // Laravelに未登録の端末だけ、この画面を表示
  if (!device) {
    return (
      <div className="user-select">
        <h1>💚 ファミリーチャット</h1>
        <h2>この端末は誰が使いますか？</h2>

        <button onClick={() => registerDevice("mama", "ママ")}>👩 ママ</button>

        <button onClick={() => registerDevice("taichi", "たいちゃん")}>
          👦 たいちゃん
        </button>
        <button onClick={() => registerDevice("ai", "愛")}>👩 愛</button>

        <button onClick={() => registerDevice("hina", "ひな")}>👧 ひな</button>

        <button onClick={() => registerDevice("papa", "パパ")}>👨 パパ</button>
      </div>
    );
  }

  return (
    <div>
      <h1>💚 ファミリーチャット</h1>

      <main className="chat-area">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.sender === device.user_key
                ? "message right"
                : "message left"
            }
          >
            <div className="name">
              <img src={message.icon} alt={message.name} className="avatar" />
              <span>{message.name}</span>
            </div>

            <div className="bubble">{message.text}</div>

            <div className="time">{message.time}</div>

            {message.sender === device.user_key && (
              <button
                className="delete-button"
                onClick={() => deleteMessage(message.id)}
              >
                削除
              </button>
            )}
          </div>
        ))}
      </main>

      <footer className="footer">
        <input
          type="text"
          placeholder="メッセージを入力"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <button onClick={enableNotificationSound}>
          {soundEnabled ? "🔔 通知ON" : "🔕 通知をONにする"}
        </button>

        <button onClick={subscribePushNotification}>📱 Push通知をON</button>

        <button onClick={sendMessage}>送信</button>
      </footer>
    </div>
  );
}

export default App;
