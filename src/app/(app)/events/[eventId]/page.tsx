import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMember, requireUser } from "@/lib/session";
import { Header, HeaderLogo } from "@/components/ui/header";

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
    },
  });
  if (event === null) notFound();

  return (
    <>
      <Header>
        <HeaderLogo />
      </Header>
      <main className="mx-auto w-full max-w-page px-3 pt-4.5 pb-22 sm:px-6 sm:pt-7.5">
        <h1>{event.title}</h1>
      </main>
    </>
  );
}
