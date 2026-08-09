import { useEffect, useState } from "react";
import "./App.css";

import mama from "./assets/mama.jpg";
import taichi from "./assets/taichi.jpg";

const MESSAGES_API = "https://family.event-link.jp/api/messages";
const DEVICES_API = "https://family.event-link.jp/api/devices";

type UserKey = "mama" | "taichi";

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

  // この端末専用のIDを取得。なければ新しく作る
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
    if (message.sender === "mama" || message.sender === "taichi") {
      return message.sender;
    }

    if (message.name === "ママ" || message.name === "さやか") {
      return "mama";
    }

    if (message.name === "たいちゃん") {
      return "taichi";
    }

    return message.sender;
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
          icon: sender === "mama" ? mama : taichi,
        };
      });

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

  // この端末をママ・たいちゃんのどちらかとしてLaravelへ登録
  const registerDevice = async (
    userKey: UserKey,
    name: string
  ) => {
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

  if (loading) {
    return <div>読み込み中...</div>;
  }

  // Laravelに未登録の端末だけ、この画面を表示
  if (!device) {
    return (
      <div className="user-select">
        <h1>💚 ファミリーチャット</h1>
        <h2>この端末は誰が使いますか？</h2>

        <button onClick={() => registerDevice("mama", "ママ")}>
          👩 ママ
        </button>

        <button onClick={() => registerDevice("taichi", "たいちゃん")}>
          👦 たいちゃん
        </button>
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
              <img
                src={message.icon}
                alt={message.name}
                className="avatar"
              />
              <span>{message.name}</span>
            </div>

            <div className="bubble">{message.text}</div>
            <div className="time">{message.time}</div>
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

        <button onClick={sendMessage}>送信</button>
      </footer>
    </div>
  );
}

export default App;
