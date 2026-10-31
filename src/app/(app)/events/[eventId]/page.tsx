import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMember, requireUser } from "@/lib/session";
import { Header, HeaderLogo } from "@/components/ui/header";
import { todayInTokyo } from "@/lib/date";
import { eventPhase } from "@/lib/derive/eventPhase";
import { progress } from "@/lib/derive/progress";
import { itemStatus } from "@/lib/derive/itemStatus";
import { effectiveGearMemo } from "@/lib/derive/effectiveGearMemo";
import { PackProgress } from "@/components/events/pack-progress";
import { EventHeading } from "@/components/events/event-heading";
import { AttentionAlert } from "@/components/events/attention-alert";
import { EventBoard } from "@/components/events/event-board";

export default async function EventPage(props: PageProps<"/events/[eventId]">) {
  const { eventId } = await props.params;

  await requireUser();

  const me = await getMember(eventId);
  if (me === null) notFound();

  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
    select: {
      title: true,
      place: true,
      startDate: true,
      endDate: true,
      status: true,

      members: {
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          gearMemo: true,
          user: {
            select: {
              id: true,
              displayName: true,
              bike: true,
              gearMemo: true,
            },
          },
        },
      },

      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          kind: true,
          name: true,
          size: true,
          requesterId: true,
          carrierId: true,
          acceptedAt: true,
          packedAt: true,
        },
      },
    },
  });
  if (event === null) notFound();

  const today = todayInTokyo();
  const phase = eventPhase(event, today);
  const packProgress = progress(event.items);

  const items = event.items.map((item) => ({
    ...item,
    status: itemStatus(item),
  }));

  const members = event.members.map((member) => {
    const carried = items.filter((item) => item.carrierId === member.id);
    return {
      id: member.id,
      user: {
        id: member.user.id,
        displayName: member.user.displayName,
      },
      bike: member.user.bike,
      gearMemo: effectiveGearMemo(member, member.user),
      confirmedCount: carried.filter((item) => item.status === "confirmed")
        .length,
      askingCount: carried.filter((item) => item.status === "asking").length,
      isSelf: member.id === me.id,
    };
  });

  const openCount = items.filter((item) => item.status === "open").length;
  const unassignedCount = items.filter(
    (item) => item.status === "unassigned",
  ).length;
  const askingCount = items.filter((item) => item.status === "asking").length;

  return (
    <>
      <Header>
        <HeaderLogo />
        <div className="flex-1" />
        <PackProgress progress={packProgress} />
      </Header>
      <main className="mx-auto w-full max-w-page px-3 pt-4.5 pb-22 sm:px-6 sm:pt-7.5">
        <EventHeading
          event={event}
          isDraft={phase === "draft"}
          memberCount={members.length}
          askingCount={askingCount}
        />
        <AttentionAlert
          openCount={openCount}
          unassignedCount={unassignedCount}
          askingCount={askingCount}
        />
        <EventBoard
          eventId={eventId}
          members={members}
          items={items}
          meId={me.id}
        />
      </main>
    </>
  );
}
