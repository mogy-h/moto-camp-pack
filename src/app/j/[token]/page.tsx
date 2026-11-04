import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getMember } from "@/lib/session";
import { inviteStatus } from "@/lib/derive/inviteStatus";
import { progress } from "@/lib/derive/progress";
import {
  AccountPanel,
  InvalidInvite,
  InviteCard,
  JoinedPanel,
  JoinFrame,
  LoginChoices,
} from "@/components/join/join-parts";

export const metadata: Metadata = {
  title: "招待 | MotoCamp Pack",
};

// 招待リンク。未ログインでも開ける（proxy.ts で /j/ を公開している）
export default async function JoinPage(props: PageProps<"/j/[token]">) {
  const { token } = await props.params;
  // 未ログインなら null（requireUser だと /login へ飛ばされてしまう）
  const user = await getCurrentUser();

  // ① トークンで招待を引く。発行した人の表示名とイベントの概要も一緒に読む
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      eventId: true,
      revokedAt: true,
      expiresAt: true,
      createdBy: { select: { user: { select: { displayName: true } } } },
      event: {
        select: {
          title: true,
          place: true,
          startDate: true,
          endDate: true,
          members: {
            where: { leftAt: null },
            orderBy: { joinedAt: "asc" },
            select: { user: { select: { id: true, displayName: true } } },
          },
          items: { select: { packedAt: true } },
        },
      },
    },
  });

  // ② 使えなければ、理由を区別せずに「使えません」を出す
  if (invite === null || inviteStatus(invite, new Date()) !== "valid") {
    return (
      <JoinFrame>
        <InvalidInvite loggedIn={user !== null} />
      </JoinFrame>
    );
  }

  // ③ 下半分を状態で切り替える
  const member = user === null ? null : await getMember(invite.eventId);
  let panel: React.ReactNode;
  if (user === null) {
    panel = <LoginChoices token={token} />;
  } else if (member !== null) {
    panel = <JoinedPanel user={user} eventId={invite.eventId} />;
  } else {
    panel = <AccountPanel user={user} token={token} />;
  }

  return (
    <JoinFrame>
      <InviteCard
        hostName={invite.createdBy.user.displayName}
        event={invite.event}
        members={invite.event.members.map((m) => m.user)}
        progress={progress(invite.event.items)}
      >
        {panel}
      </InviteCard>
    </JoinFrame>
  );
}
