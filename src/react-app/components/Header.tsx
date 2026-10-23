import { useEffect, useRef } from "react";
import PortfolioLogo from "./PortfolioLogo";
import InfoIcon from "../assets/icons/info-circle.svg?react";
import GitHubIcon from "../assets/icons/github.svg?react";
import LinkedInIcon from "../assets/icons/linkedin.svg?react";

type HeaderProps = {
    simple?: boolean;
    onModeChange?: (simple: boolean) => void;
    resumeUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
};

export default function Header({ simple = true, onModeChange, githubUrl, linkedinUrl }: HeaderProps) {
    const aboutRef = useRef<HTMLDialogElement>(null);
    const previousOverflow = useRef<string | null>(null);

    function openAbout() {
        const dialog = aboutRef.current;
        if (!dialog || dialog.open) return;
        dialog.showModal();
        previousOverflow.current = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }

    function restoreScrolling() {
        if (previousOverflow.current !== null) {
            document.body.style.overflow = previousOverflow.current;
            previousOverflow.current = null;
        }
    }

    useEffect(() => () => {
        if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
    }, []);

    return (
        <>
            <header className="header">
                <a className="header-brand" href="/" aria-label="AmmarZ home">
                    <PortfolioLogo className="header-monogram" aria-hidden="true" />
                    <span>AmmarZ</span>
                </a>
                <nav className="header-nav" aria-label="Main navigation">
                    <div className="header-personal-links">
                        <button type="button" className="header-link" onClick={openAbout}><InfoIcon className="header-nav-icon" aria-hidden="true" />About</button>
                        {/* When the PDF is ready, destructure resumeUrl above and replace the placeholder with:
                        <a className="header-link" href={resumeUrl} target="_blank" rel="noopener noreferrer">Resume ↗</a>
                        */}
                        <span className="header-link header-link-unavailable" aria-disabled="true" title="Resume coming soon">Resume <span aria-hidden="true">↗</span></span>
                        {githubUrl && <a className="header-link header-social-link" href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)" title="GitHub"><GitHubIcon className="header-nav-icon header-github-icon" aria-hidden="true" /></a>}
                        {linkedinUrl ? <a className="header-link header-social-link" href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)" title="LinkedIn"><LinkedInIcon className="header-nav-icon header-linkedin-icon" aria-hidden="true" /></a> : <span className="header-link header-social-link header-link-unavailable" aria-disabled="true" aria-label="LinkedIn (link coming soon)" title="LinkedIn — link coming soon"><LinkedInIcon className="header-nav-icon header-linkedin-icon" aria-hidden="true" /></span>}
                    </div>
                    <div className="header-mode-control">
                    {onModeChange ? (
                        <div className="mode-selector" role="group" aria-label="Portfolio layout">
                            <button type="button" aria-pressed={simple} onClick={() => onModeChange(true)}>Simple</button>
                            <button type="button" aria-pressed={!simple} onClick={() => onModeChange(false)}>Space</button>
                        </div>
                    ) : <span className="mode-unavailable">Space mode · Coming soon</span>}
                    </div>
                </nav>
            </header>
            <dialog ref={aboutRef} className="about-dialog" aria-labelledby="about-title" onClose={restoreScrolling}>
                <div className="about-heading">
                    <h2 id="about-title">About Ammar Zaghloul</h2>
                    <button type="button" className="icon-button" aria-label="Close about" onClick={() => aboutRef.current?.close()}>×</button>
                </div>
                <p>
                    As you can probably tell from the rest of the website, my name is Ammar, and I'm a software developer. I started coding in tenth grade for an elective course, and I enjoyed it enough that I went on to earn a BSc in Computer Science at the University of Calgary.
                    Since graduating, I've been working on personal projects and picking up technologies I didn't work with during my degree. Whether I create a multiplayer game or task management application, learning new skills and improving existing ones is what keeps software development interesting to me.
                </p>
                <p>
                    My other interests include gaming, amateur astronomy, and PC hardware.
                    I'm currently looking for opportunities to start my career in software development.
                </p>
            </dialog>
        </>
    );
}
