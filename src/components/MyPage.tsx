import { useEffect, useState } from "react";
import "./MyPage.css";

import mama from "../assets/mama.jpg";
import taichi from "../assets/taichi.jpg";
import ai from "../assets/ai.jpg";
import hina from "../assets/hina.jpg";
import papa from "../assets/papa.jpg";

type UserKey = "mama" | "taichi" | "ai" | "hina" | "papa";

type MyPageProps = {
  userKey: UserKey;
  onBackToChat: () => void;
  onOpenFamilySchedule: () => void;
};

const profiles = {
  mama: {
    name: "ママ",
    image: mama,
  },
  taichi: {
    name: "たいちゃん",
    image: taichi,
  },
  ai: {
    name: "愛",
    image: ai,
  },
  hina: {
    name: "ひな",
    image: hina,
  },
  papa: {
    name: "パパ",
    image: papa,
  },
};

function MyPage({ userKey, onBackToChat, onOpenFamilySchedule }: MyPageProps) {
  const profile = profiles[userKey];
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");

  const [schedules, setSchedules] = useState<
    { date: string; time: string; title: string }[]
  >(() => {
    const savedSchedules = localStorage.getItem(`schedules-${userKey}`);

    return savedSchedules ? JSON.parse(savedSchedules) : [];
  });

  useEffect(() => {
    localStorage.setItem(`schedules-${userKey}`, JSON.stringify(schedules));
  }, [schedules, userKey]);
  const addSchedule = () => {
    if (!scheduleDate || !scheduleTitle.trim()) {
      return;
    }

    setSchedules([
      ...schedules,
      {
        date: scheduleDate,
        time: scheduleTime,
        title: scheduleTitle,
      },
    ]);

    setScheduleTime("");
    setScheduleTitle("");
  };

  const deleteSchedule = (index: number) => {
    const ok = window.confirm("この予定を削除しますか？");

    if (!ok) return;

    setSchedules(
      schedules.filter((_, scheduleIndex) => scheduleIndex !== index),
    );
  };

  return (
    <div className="mypage">
      <header className="mypage-header">
        <h1>私のページ</h1>
      </header>

      <section className="mypage-welcome">
        <img src={profile.image} alt={profile.name} className="profile-image" />

        <h2>ようこそ、{profile.name}👋</h2>
      </section>
      {/* 📅 予定入力 */}

      <section className="schedule-section">
        <h3>📅 今日の予定</h3>

        <div className="schedule-form">
          <input
            type="date"
            className="schedule-date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
          />

          <input
            type="time"
            className="schedule-time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
          />

          <input
            type="text"
            placeholder="予定を入力"
            className="schedule-title"
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
          />

          <button type="button" onClick={addSchedule}>
            ＋ 予定を追加
          </button>
        </div>

        <div className="schedule-list">
          {schedules.map((schedule, index) => (
            <div className="schedule-item" key={index}>
              <strong>{schedule.date}</strong>

              {schedule.time && <span>　{schedule.time}</span>}

              <div>{schedule.title}</div>

              <button type="button" onClick={() => deleteSchedule(index)}>
                🗑️ 削除
              </button>
            </div>
          ))}
        </div>
      </section>
      <button
        type="button"
        className="family-schedule-button"
        onClick={onOpenFamilySchedule}
      >
        <span>👨‍👩‍👧‍👦 家族の予定を見る</span>
        <span>›</span>
      </button>
      <div className="mypage-menu">
        <button onClick={onBackToChat}>
          <span>💬 家族チャット</span>
          <span>›</span>
        </button>

        <button>
          <span>📷 Instagram</span>
          <span>›</span>
        </button>

        <button>
          <span>🎵 TikTok</span>
          <span>›</span>
        </button>

        <button>
          <span>▶️ YouTube</span>
          <span>›</span>
        </button>

        <button>
          <span>💚 LINE</span>
          <span>›</span>
        </button>
      </div>
    </div>
  );
}

export default MyPage;
