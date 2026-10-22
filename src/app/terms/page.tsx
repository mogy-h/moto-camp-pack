import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約とプライバシーポリシー | MotoCamp Pack",
};

// 新規登録の画面から、新しいタブで開く。ログインしていなくても開ける（proxy.ts の isPublicPath）
export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl">利用規約とプライバシーポリシー</h1>
      <p className="mt-2 text-xs text-neutral-700">制定日: 2026年10月21日</p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg">利用規約</h2>
          <p>
            MotoCamp Pack（以下「本サービス」）は、キャンプツーリングの積載を仲間内で分担するための Web
            アプリです。個人が学習とポートフォリオのために開発・運営しています。
          </p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li>
              ほかの利用者が困る使い方や、不正なアクセス、本サービスの運営を妨げる行為はしないでください。
            </li>
            <li>
              本サービスは、予告なく内容を変えたり、止めたり、データを消したりすることがあります。
            </li>
            <li>
              本サービスを使ったことで生じた損害について、運営者は責任を負いません。積載や装備の最終的な確認は、各自で行ってください。
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg">プライバシーポリシー</h2>
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="font-semibold">集める情報</dt>
              <dd className="mt-1">
                メールアドレス、表示名、車種、積載装備のメモ、参加したイベントと持ち物の情報。
              </dd>
            </div>
            <div>
              <dt className="font-semibold">使い道と、ほかの人に見える範囲</dt>
              <dd className="mt-1">
                ログインと、イベントのメンバー同士で積載を分担する機能のためだけに使います。表示名・車種・積載装備のメモ・持ち物の情報は、同じイベントのメンバーに表示されます。メールアドレスは、ほかの利用者には表示しません。
              </dd>
            </div>
            <div>
              <dt className="font-semibold">保存先</dt>
              <dd className="mt-1">
                認証とデータベースに Supabase、公開に Vercel を使っています。
              </dd>
            </div>
            <div>
              <dt className="font-semibold">第三者への提供</dt>
              <dd className="mt-1">
                法令にもとづく場合を除き、第三者には提供しません。
              </dd>
            </div>
            <div>
              <dt className="font-semibold">削除</dt>
              <dd className="mt-1">
                アカウントとデータの削除を希望する場合は、運営者までご連絡ください。
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
