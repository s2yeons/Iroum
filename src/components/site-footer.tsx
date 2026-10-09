import { CHECKED_AT } from "@/lib/welfare";
import { BrandMark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-line bg-surface/60">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-base text-muted sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-foreground">
            <BrandMark className="h-7 w-7" />
            <span className="text-[1.05rem] font-extrabold">Iroum 이로움</span>
          </div>
          <p className="mt-3 max-w-xl leading-relaxed">
            이 서비스는 신청 여부를 결정하지 않아요. 최종 결정은 주민센터에서 해요. 제도 정보는 복지로·정부 공식 자료를
            바탕으로 정리했고, {CHECKED_AT}에 확인했어요.
          </p>
          <p className="mt-2">입력하신 정보는 이 기기에만 남고 서버로 보내지 않아요.</p>
        </div>
        <a
          href="tel:129"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-extrabold text-foreground shadow-[0_0_0_1px_var(--line)] hover:bg-lime-soft"
        >
          보건복지상담센터 <span className="text-lime-deep">129</span>
        </a>
      </div>
    </footer>
  );
}
