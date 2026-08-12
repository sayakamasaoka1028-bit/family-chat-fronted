import { useEffect, useState } from "react";

type UserKey = "mama" | "taichi" | "ai" | "hina" | "papa";

type ApiSchedule = {
  id: number;
  user_key: UserKey;
  date: string;
  time: string | null;
  title: string;
};

type FamilySchedule = ApiSchedule & {
  name: string;
  emoji: string;
};

type FamilySchedulePageProps = {
  onBack: () => void;
  userKey: UserKey;
};

const familyMembers = {
  mama: {
    name: "ママ",
    emoji: "👩",
  },
  taichi: {
    name: "たいちゃん",
    emoji: "👦",
  },
  ai: {
    name: "愛",
    emoji: "👩",
  },
  hina: {
    name: "ひな",
    emoji: "👧",
  },
  papa: {
    name: "パパ",
    emoji: "👨",
  },
};

function FamilySchedulePage({ onBack, userKey }: FamilySchedulePageProps) {
  const [familySchedules, setFamilySchedules] = useState<FamilySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFamilySchedules = async () => {
      try {
        const response = await fetch(
          "https://family.event-link.jp/api/schedules",
        );

        if (!response.ok) {
          throw new Error("家族の予定を取得できませんでした");
        }

        const data: ApiSchedule[] = await response.json();

        const schedules: FamilySchedule[] = data
          .map((schedule) => ({
            ...schedule,
            name: familyMembers[schedule.user_key].name,
            emoji: familyMembers[schedule.user_key].emoji,
          }))
          .sort((a, b) => {
            const dateA = `${a.date}T${a.time || "00:00"}`;
            const dateB = `${b.date}T${b.time || "00:00"}`;

            return dateA.localeCompare(dateB);
          });

        setFamilySchedules(schedules);
      } catch (error) {
        console.error("家族予定取得失敗", error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilySchedules();
  }, []);

  const deleteSchedule = async (scheduleId: number) => {
    const ok = window.confirm("この予定を削除しますか？");

    if (!ok) return;

    try {
      const response = await fetch(
        `https://family.event-link.jp/api/schedules/${scheduleId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("予定の削除に失敗しました");
      }

      setFamilySchedules((currentSchedules) =>
        currentSchedules.filter((schedule) => schedule.id !== scheduleId),
      );
    } catch (error) {
      console.error("予定削除失敗", error);
    }
  };

  if (loading) {
    return <div>予定を読み込み中...</div>;
  }

  return (
    <div className="family-schedule-page">
      <header>
        <h1>👨‍👩‍👧‍👦 家族の予定</h1>
      </header>

      <main className="family-schedule-list">
        {familySchedules.length === 0 ? (
          <p>まだ予定はありません。</p>
        ) : (
          Object.entries(
            familySchedules.reduce<Record<string, FamilySchedule[]>>(
              (groups, schedule) => {
                if (!groups[schedule.date]) {
                  groups[schedule.date] = [];
                }

                groups[schedule.date].push(schedule);

                return groups;
              },
              {},
            ),
          ).map(([date, schedules]) => (
            <section className="family-schedule-day" key={date}>
              <h2>📅 {date}</h2>

              {schedules.map((schedule) => (
                <div className="family-schedule-item" key={schedule.id}>
                  <div className="family-schedule-person">
                    <span>
                      {schedule.emoji} {schedule.name}
                    </span>

                    {schedule.time && (
                      <strong className="family-schedule-time">
                        {schedule.time}
                      </strong>
                    )}
                  </div>

                  <div className="family-schedule-title">{schedule.title}</div>

                  {schedule.user_key === userKey && (
                    <button
                      type="button"
                      className="family-schedule-delete"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      🗑️ 削除
                    </button>
                  )}
                </div>
              ))}
            </section>
          ))
        )}
      </main>

      <button type="button" onClick={onBack}>
        ← 私のページに戻る
      </button>
    </div>
  );
}

export default FamilySchedulePage;
