import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { starPalettes } from "../../data/starAppearance";
import type { StarAppearance } from "../../data/starAppearance";
import PaletteIcon from "../../assets/icons/palette.svg?react";
import RefreshIcon from "../../assets/icons/refresh.svg?react";

type StarPalettePickerProps = { value: StarAppearance; onChange: (value: StarAppearance) => void };

export default function StarPalettePicker({ value, onChange }: StarPalettePickerProps) {
    const seed = value.seed ?? 1871;
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelId = useId();

    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            buttonRef.current?.focus({ preventScroll: true });
        };
        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, [open]);

    return (
        <div className="space-palette-picker" ref={rootRef} onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}>
            <button ref={buttonRef} type="button" className="icon-button space-palette-button"
                aria-label="Star appearance" title="Star appearance" aria-expanded={open} aria-controls={panelId}
                onClick={() => setOpen(previous => !previous)}>
                <PaletteIcon aria-hidden="true" focusable="false" />
            </button>
            {open && <div id={panelId} className="space-palette-panel" role="group" aria-label="Star appearance">
                <p className="space-palette-heading">Star appearance</p>
                <div className="space-palette-colors" role="group" aria-label="Star color">
                    {starPalettes.map(palette => <button type="button" key={palette.id} className="space-color-option"
                        aria-label={palette.name} aria-pressed={value.color === palette.id}
                        style={{ "--swatch-color": palette.color } as CSSProperties}
                        onClick={() => onChange({ ...value, color: palette.id })}>
                        <span className="space-color-swatch" aria-hidden="true" />
                        <span>{palette.name}</span>
                    </button>)}
                </div>
                <button type="button" className="space-sun-reroll" onClick={() => onChange({ ...value, seed: seed + 1 })}>
                    <RefreshIcon aria-hidden="true" focusable="false" />Reroll sun
                </button>
            </div>}
            <span className="space-status" role="status">
                {seed > 1871 ? `Sun regenerated ${seed - 1871} ${seed === 1872 ? "time" : "times"}.` : ""}
            </span>
        </div>
    );
}
