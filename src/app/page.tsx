import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Tent } from "lucide-react";
import { signOut } from "@/actions/auth";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  await connection();
  const user = await getCurrentUser();
  const events = await prisma.event.findMany({
    include: { members: { include: { user: true } } },
  });

  return (
    <div>
      <p>ログイン中: {user?.displayName}</p>
      <form action={signOut}>
        <Button type="submit" variant="secondary">
          ログアウト
        </Button>
      </form>
      {events.map((event) => (
        <div key={event.id} className="bg-surface rounded-lg p-4 shadow-md">
          <h1 className="font-display text-2xl">MotoCamp Pack</h1>
          <h2 className="font-medium text-xl">{event.title}</h2>
          <p>{event.startDate.toISOString().slice(0, 10)}</p>

          <ul>
            {event.members.map((member) => (
              <li key={member.id}>{member.user.displayName}</li>
            ))}
          </ul>
          <Button>ボタン</Button>
          <Button>Button</Button>
          <Tent strokeWidth={2.75} />
        </div>
      ))}
    </div>
  );
}
