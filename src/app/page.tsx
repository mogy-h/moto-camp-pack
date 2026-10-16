import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  await connection();
  const events = await prisma.event.findMany({
    include: { members: { include: { user: true } } },
  });

  return (
    <div>
      {events.map((event) => (
        <div key={event.id}>
          <h2>{event.title}</h2>
          <p>{event.startDate.toISOString().slice(0, 10)}</p>
          <ul>
            {event.members.map((member) => (
              <li key={member.id}>{member.user.displayName}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
