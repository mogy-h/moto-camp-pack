import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Tent } from "lucide-react";

export default async function Home() {
  await connection();
  const events = await prisma.event.findMany({
    include: { members: { include: { user: true } } },
  });

  return (
    <div>
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
