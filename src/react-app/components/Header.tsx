import { useEffect, useState } from "react";
import useModalDialog from "../hooks/useModalDialog";
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

export default function Header({ simple = true, onModeChange, resumeUrl, githubUrl, linkedinUrl }: HeaderProps) {
    const about = useModalDialog();
    const menu = useModalDialog();
    const [menuOpen, setMenuOpen] = useState(false);

    function openAbout() {
        closeMenu();
        about.open();
    }

    function closeMenu() {
        menu.close();
        setMenuOpen(false);
    }

    const closeMenuDialog = menu.close;
    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 60rem)");
        const onResize = () => {
            if (desktop.matches) {
                closeMenuDialog();
                setMenuOpen(false);
            }
        };
        desktop.addEventListener("change", onResize);
        return () => desktop.removeEventListener("change", onResize);
    }, [closeMenuDialog]);

    const navigation = <>
        <div className="header-personal-links">
            <button type="button" className="header-link" onClick={openAbout}><InfoIcon className="header-nav-icon" aria-hidden="true" />About</button>
            {resumeUrl ? <a className="header-link" href={resumeUrl} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>Resume ↗</a> : <span className="header-link header-link-unavailable" aria-disabled="true" title="Resume coming soon">Resume <span aria-hidden="true">↗</span><span className="mobile-link-label">Coming soon</span></span>}
            {githubUrl && <a className="header-link header-social-link" href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)" title="GitHub" onClick={closeMenu}><GitHubIcon className="header-nav-icon header-github-icon" aria-hidden="true" /><span className="mobile-link-label">GitHub</span></a>}
            {linkedinUrl ? <a className="header-link header-social-link" href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)" title="LinkedIn" onClick={closeMenu}><LinkedInIcon className="header-nav-icon header-linkedin-icon" aria-hidden="true" /><span className="mobile-link-label">LinkedIn</span></a> : <span className="header-link header-social-link header-link-unavailable" aria-disabled="true" aria-label="LinkedIn (link coming soon)" title="LinkedIn — link coming soon"><LinkedInIcon className="header-nav-icon header-linkedin-icon" aria-hidden="true" /><span className="mobile-link-label">LinkedIn · Coming soon</span></span>}
        </div>
        <div className="header-mode-control">
            {onModeChange ? <div className="mode-selector" role="group" aria-label="Portfolio layout">
                <button type="button" aria-pressed={simple} onClick={() => { closeMenu(); onModeChange(true); }}>Simple</button>
                <button type="button" aria-pressed={!simple} onClick={() => { closeMenu(); onModeChange(false); }}>Space</button>
            </div> : <span className="mode-unavailable">Space mode · Coming soon</span>}
        </div>
    </>;

    return (
        <>
            <header className="header">
                <a className="header-brand" href="/" aria-label="AmmarZ home">
                    <PortfolioLogo className="header-monogram" aria-hidden="true" />
                    <span>AmmarZ</span>
                </a>
                <nav className="header-nav" aria-label="Main navigation">
                    {navigation}
                </nav>
                <button type="button" className="icon-button mobile-menu-toggle" aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => { menu.open(); setMenuOpen(true); }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </header>
            <dialog ref={menu.dialogRef} id="mobile-menu" className="mobile-menu" aria-labelledby="mobile-menu-title" onCancel={event => { event.preventDefault(); closeMenu(); }} onClose={() => { if (!menu.dialogRef.current?.open) { menu.restore(); setMenuOpen(false); } }}>
                <div className="mobile-menu-heading">
                    <h2 id="mobile-menu-title">Menu</h2>
                    <button type="button" className="icon-button" aria-label="Close navigation menu" onClick={closeMenu} autoFocus>×</button>
                </div>
                <nav aria-label="Mobile navigation">{navigation}</nav>
            </dialog>
            <dialog ref={about.dialogRef} className="about-dialog" aria-labelledby="about-title" onCancel={event => { event.preventDefault(); about.close(); }} onClose={about.restore}>
                <div className="about-heading">
                    <h2 id="about-title">About Ammar Zaghloul</h2>
                    <button type="button" className="icon-button" aria-label="Close about" onClick={about.close} autoFocus>×</button>
                </div>
                <div className="about-content" role="region" tabIndex={0} aria-label="About Ammar Zaghloul">
                    <p>
                        As you can probably tell from the rest of the website, my name is Ammar, and I'm a software developer. I started coding in tenth grade for an elective course, and I enjoyed it enough that I went on to earn a BSc in Computer Science at the University of Calgary.
                        Since graduating, I've been working on personal projects and picking up technologies I didn't work with during my degree. Whether I create a multiplayer game or task management application, learning new skills and improving existing ones is what keeps software development interesting to me.
                    </p>
                    <p>
                        My other interests include gaming, amateur astronomy, and PC hardware.
                        I'm currently looking for opportunities to start my career in software development.
                    </p>
                </div>
            </dialog>
        </>
    );
}
