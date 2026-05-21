"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { deleteJournalEntry } from "@/app/[locale]/(app)/journal/actions";

export function DeleteEntryButton({ id }: { id: string }) {
  const t = useTranslations("journal");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(t("confirmDelete"))) return;
        startTransition(async () => {
          await deleteJournalEntry(id);
          router.refresh();
        });
      }}
      className="text-xs text-muted underline-offset-4 hover:text-clay hover:underline disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
