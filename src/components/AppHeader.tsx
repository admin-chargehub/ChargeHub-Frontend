import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { BackIcon } from "@/components/icons";

interface Props {
  title?: string;
  /** Where back goes. Omit to pop one entry off history. */
  backTo?: string;
  /** Hide the back control entirely (top-level tabbed screens). */
  noBack?: boolean;
  /** Trailing slot — an action button, a status pill. */
  action?: ReactNode;
}

export default function AppHeader({ title, backTo, noBack, action }: Props) {
  const navigate = useNavigate();

  return (
    <header className="appheader">
      {!noBack && (
        <button
          type="button"
          className="iconbtn"
          aria-label="Go back"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        >
          <BackIcon />
        </button>
      )}
      {title && <h1 className="appheader-title grow">{title}</h1>}
      {!title && <span className="grow" />}
      {action}
    </header>
  );
}
