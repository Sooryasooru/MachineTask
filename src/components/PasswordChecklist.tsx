"use client";

import { PASSWORD_RULES, checkPassword } from "@/lib/password";
import { CheckIcon, XIcon } from "./icons";

/**
 * Live checklist for the signup form. Uses the exact same `checkPassword`
 * implementation the API enforces.
 */
export default function PasswordChecklist({
  password,
  email,
}: {
  password: string;
  email: string;
}) {
  const { passed } = checkPassword(password, email);

  return (
    <ul className="mt-2 grid gap-1 sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = passed[rule.id];
        return (
          <li
            key={rule.id}
            className={`flex items-start gap-1.5 text-[12px] ${
              ok ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {ok ? (
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{ok ? " — met" : " — not met yet"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
