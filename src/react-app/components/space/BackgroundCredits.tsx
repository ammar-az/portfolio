import { useEffect, useId, useState } from "react";
import type { DeepSkyImage } from "../../data/deepSky";
import useModalDialog from "../../hooks/useModalDialog";
import CloseIcon from "../../assets/icons/close.svg?react";

function CreditsDialog({ images, onClose }: { images: DeepSkyImage[]; onClose: () => void }) {
    const { dialogRef, open, close, restore } = useModalDialog();
    const title = useId();
    useEffect(() => { open(); return close; }, [open, close]);
    return <dialog ref={dialogRef} className="space-credits-dialog" aria-labelledby={title} onClose={restore}
        onCancel={event => { event.preventDefault(); onClose(); }}>
        <header>
            <h2 id={title}>Background image credits</h2>
            <button type="button" className="icon-button" aria-label="Close image credits" onClick={onClose} autoFocus>
                <CloseIcon aria-hidden="true" focusable="false" />
            </button>
        </header>
        <p>Objects in the current scene. Photos are cropped, dimmed and blended into the starfield.</p>
        <ul>{images.map(image => <li key={image.id}>
            <img src={`/space/deep-sky/thumbs/${image.id}.webp`} alt={image.name} width={96} height={96} />
            <div><a href={image.page} target="_blank" rel="noopener noreferrer">{image.name}</a><p>{image.credit}</p></div>
        </li>)}</ul>
        <footer><a href="/space/deep-sky/index.html" target="_blank" rel="noopener noreferrer">Full image collection and sources</a>
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></footer>
    </dialog>;
}

export default function BackgroundCredits({ images }: { images: DeepSkyImage[] }) {
    const [open, setOpen] = useState(false);
    return <>
        <button type="button" className="space-image-credits" aria-haspopup="dialog" onClick={() => setOpen(true)}>
            Background images &amp; credits
        </button>
        {open && <CreditsDialog images={images} onClose={() => setOpen(false)} />}
    </>;
}
