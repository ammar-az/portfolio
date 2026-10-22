import { useRef } from "react";
import PortfolioLogo from "./PortfolioLogo";

type HeaderProps = {
    simple?: boolean;
    onModeChange?: (simple: boolean) => void;
    resumeUrl?: string;
    githubUrl?: string;
};

export default function Header({ simple = true, onModeChange, resumeUrl, githubUrl }: HeaderProps) {
    const aboutRef = useRef<HTMLDialogElement>(null);

    return (
        <>
            <header className="header">
                <a className="header-brand" href="/" aria-label="AmmarZ home">
                    <PortfolioLogo className="header-monogram" aria-hidden="true" />
                    <span>AmmarZ</span>
                </a>
                <nav className="header-nav" aria-label="Main navigation">
                    <button type="button" className="header-link" onClick={() => aboutRef.current?.showModal()}>About</button>
                    {resumeUrl && <a className="header-link" href={resumeUrl} target="_blank" rel="noopener noreferrer">Resume ↗</a>}
                    {githubUrl && <a className="header-link" href={githubUrl} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
                    {onModeChange ? (
                        <div className="mode-selector" role="group" aria-label="Portfolio layout">
                            <button type="button" aria-pressed={simple} onClick={() => onModeChange(true)}>Simple</button>
                            <button type="button" aria-pressed={!simple} onClick={() => onModeChange(false)}>Space</button>
                        </div>
                    ) : <span className="mode-unavailable">Space mode · Coming soon</span>}
                </nav>
            </header>
            <dialog ref={aboutRef} className="about-dialog" aria-labelledby="about-title">
                <div className="about-heading">
                    <h2 id="about-title">About AmmarZ</h2>
                    <button type="button" className="icon-button" aria-label="Close about" onClick={() => aboutRef.current?.close()}>×</button>
                </div>
                <p>I would tell you about myself but this website isn't ready yet... Explore a project to see the application, its technology stack, and how it was built.</p>
            </dialog>
        </>
    );
}
