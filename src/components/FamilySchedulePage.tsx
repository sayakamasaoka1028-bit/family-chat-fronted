type UserKey = "mama" | "taichi" | "ai" | "hina" | "papa";

type Schedule = {
  date: string;
  time: string;
  title: string;
};

type FamilySchedule = Schedule & {
  userKey: UserKey;
  name: string;
  emoji: string;
};

type FamilySchedulePageProps = {
  onBack: () => void;
};

const familyMembers: {
  userKey: UserKey;
  name: string;
  emoji: string;
}[] = [
  { userKey: "mama", name: "ママ", emoji: "👩" },
  { userKey: "taichi", name: "たいちゃん", emoji: "👦" },
  { userKey: "ai", name: "愛", emoji: "👩" },
  { userKey: "hina", name: "ひな", emoji: "👧" },
  { userKey: "papa", name: "パパ", emoji: "👨" },
];

function FamilySchedulePage({ onBack }: FamilySchedulePageProps) {
  const familySchedules: FamilySchedule[] = familyMembers
    .flatMap((member) => {
      const saved = localStorage.getItem(`schedules-${member.userKey}`);

      const schedules: Schedule[] = saved ? JSON.parse(saved) : [];

      return schedules.map((schedule) => ({
        ...schedule,
        userKey: member.userKey,
        name: member.name,
        emoji: member.emoji,
      }));
    })
    .sort((a, b) => {
      const dateA = `${a.date}T${a.time || "00:00"}`;
      const dateB = `${b.date}T${b.time || "00:00"}`;

      return dateA.localeCompare(dateB);
    });

  return (
    <div className="family-schedule-page">
      <header>
        <h1>👨‍👩‍👧‍👦 家族の予定</h1>
      </header>

      <main className="family-schedule-list">
        {familySchedules.length === 0 ? (
          <p>まだ予定はありません。</p>
        ) : (
          familySchedules.map((schedule, index) => (
            <div className="family-schedule-item" key={index}>
              <div>
                <strong>{schedule.date}</strong>

                {schedule.time && <span>　{schedule.time}</span>}
              </div>

              <div>
                {schedule.emoji} {schedule.name}
              </div>

              <div>{schedule.title}</div>
            </div>
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
