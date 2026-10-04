import { WalletIcon } from "@/components/icons";

/**
 * Placeholder on purpose.
 *
 * The tab is in the design but no wallet screens are, and a real wallet means
 * a balance ledger, top-ups and reconciliation — a product and compliance
 * decision nobody has made. An honest empty state beats a fake balance.
 */
export default function WalletPage() {
  return (
    <div className="screen screen-tabbed">
      <h1>Wallet</h1>

      <div className="card empty">
        <div className="empty-art" aria-hidden="true">
          <WalletIcon />
        </div>
        <h2>Coming soon</h2>
        <p className="muted">
          Pay per session for now. Wallet top-ups are not available yet.
        </p>
      </div>
    </div>
  );
}
