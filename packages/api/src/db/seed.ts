import { getDb } from "./client.js";
import { announcements } from "./schema.js";

async function main() {
  const db = await getDb();

  await db.delete(announcements);

  await db.insert(announcements).values([
    {
      title: "サービス開始のお知らせ",
      body: "本日より本サービスの提供を開始いたしました。今後ともよろしくお願いいたします。",
      published: true,
      createdBy: "admin",
    },
    {
      title: "メンテナンスのお知らせ",
      body: "2026年4月10日 02:00〜05:00 の間、システムメンテナンスを実施いたします。ご不便をおかけしますが、ご了承ください。",
      published: true,
      createdBy: "admin",
    },
    {
      title: "新機能追加のお知らせ（下書き）",
      body: "ダッシュボード機能を追加しました。詳細は追ってご案内いたします。",
      published: false,
      createdBy: "admin",
    },
  ]);

  console.log("Seed completed.");
  process.exit(0);
}

main();
