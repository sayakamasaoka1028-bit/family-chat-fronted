import mama from "./assets/mama.jpg";
import taichi from "./assets/taichi.jpg";
import { useEffect, useState } from "react";
import "./App.css";

type Message = {
  text: string;
  sender: "me" | "husband";
  time: string;
  name: string;
  icon: string;
};
type ApiMessage = {
  id: number;
  text: string;
  sender: "me" | "husband";
  name: string;
  created_at: string;
  updated_at: string;
};
function App() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [text, setText] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch("http://127.0.0.1:8000/api/messages");
      const data = await response.json();

      const newMessages = data.map((message: ApiMessage) => ({
        text: message.text,
        sender: message.sender,
        name: message.name,
        time: new Date(message.created_at).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        icon: message.sender === "me" ? mama : taichi,
      }));

      setMessages(newMessages);
    };

    fetchMessages();
  }, []);
  const sendMessage = async () => {
    if (text.trim() === "") return;

    await fetch("http://127.0.0.1:8000/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: "me",
        name: "ママ",
        text: text,
      }),
    });
    const response = await fetch("http://127.0.0.1:8000/api/messages");
    const data = await response.json();

    const newMessages = data.map((message: ApiMessage) => ({
      text: message.text,
      sender: message.sender,
      name: message.name,
      time: new Date(message.created_at).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: message.sender === "me" ? mama : taichi,
    }));

    setMessages(newMessages);

    setText("");
  };

  return (
    <div className="app">
      <header className="header">💚 Family Chat</header>

      <main className="chat-area">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.sender === "me" ? "message right" : "message left"
            }
          >
            <div className="name">
              <img src={message.icon} alt={message.name} className="avatar" />
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
