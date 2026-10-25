import { prisma } from "@/lib/prisma";
import { Header, HeaderLogo } from "@/components/ui/header";
import { requireUser } from "@/lib/session";
import { AccountMenu } from "@/components/ui/account-menu";
import { todayInTokyo } from "@/lib/date";
import { eventPhase } from "@/lib/derive/eventPhase";
import { progress } from "@/lib/derive/progress";
import { Greeting } from "@/components/dashboard/greeting";
import { EventCard } from "@/components/dashboard/event-card";

export default async function Home() {
  const today = todayInTokyo();
  const user = await requireUser();
  const events = await prisma.event.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
          leftAt: null,
        },
      },
    },
    select: {
      id: true,
      title: true,
      place: true,
      startDate: true,
      endDate: true,
      status: true,
      members: {
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
        select: {
          user: {
            select: { id: true, displayName: true },
          },
        },
      },
      items: { select: { packedAt: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <>
      <Header>
        <HeaderLogo />
        <div className="flex-1" />
        <AccountMenu user={user} />
      </Header>

      <main className="mx-auto w-full max-w-page px-3 pt-4.5 pb-22 sm:px-6 sm:pt-7.5">
        <Greeting displayName={user.displayName} today={today} />
        <div className="flex flex-col gap-2.75">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              phase={eventPhase(event, today)}
              members={event.members.map((member) => member.user)}
              progress={progress(event.items)}
            />
          ))}
        </div>
      </main>
    </>
  );
}
