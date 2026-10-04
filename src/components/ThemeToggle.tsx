import { MoonIcon, SunIcon, SystemIcon } from "@/components/icons";
import { useTheme, type ThemePreference } from "@/theme/ThemeContext";

/** One-tap flip between light and dark, for a header. */
export function ThemeToggleButton() {
  const { resolved, toggle } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="iconbtn"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: SystemIcon },
];

/**
 * Three-way control for a settings screen.
 *
 * "System" is a real option, not a default to be collapsed away: it is the
 * only one that keeps following the OS after the user changes it.
 */
export function ThemeSegmented() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="segmented" role="group" aria-label="Appearance">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className={value === preference ? "segment segment-on" : "segment"}
          aria-pressed={value === preference}
          onClick={() => setPreference(value)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
