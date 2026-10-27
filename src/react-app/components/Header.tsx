import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useModalDialog from "../hooks/useModalDialog";
import PortfolioLogo from "./PortfolioLogo";
import InfoIcon from "../assets/icons/info-circle.svg?react";
import GitHubIcon from "../assets/icons/github.svg?react";
import LinkedInIcon from "../assets/icons/linkedin.svg?react";
import EmailIcon from "../assets/icons/email.svg?react";
import CloseIcon from "../assets/icons/close.svg?react";
import ModeSelector from "./ModeSelector";
import SceneMotionControl from "./space/SceneMotionControl";
import OrbitSpeedControl from "./space/OrbitSpeedControl";
import HelpIcon from "../assets/icons/help.svg?react";

type HeaderProps = {
    simple?: boolean;
    onHelp?: () => void;
    onModeChange?: (simple: boolean) => void;
    motionEnabled?: boolean;
    onMotionChange?: (enabled: boolean) => void;
    resumeUrl: string;
    email?: string;
    githubUrl?: string;
    linkedinUrl?: string;
};

export default function Header({ simple = true, onHelp, onModeChange, motionEnabled = true, onMotionChange, resumeUrl, email, githubUrl, linkedinUrl }: HeaderProps) {
    const about = useModalDialog();
    const menu = useModalDialog();
    const [menuOpen, setMenuOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
        const header = headerRef.current;
        if (!header) return;
        const update = () => {
            const height = header.getBoundingClientRect().height;
            if (height > 0) document.documentElement.style.setProperty("--header-height", `${height}px`);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(header);
        return () => { observer.disconnect(); document.documentElement.style.removeProperty("--header-height"); };
    }, []);

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
            <a className="header-link" href={resumeUrl} target="_blank" rel="noopener noreferrer" aria-label="Resume (PDF, opens in a new tab)" onClick={closeMenu}>Resume <span aria-hidden="true">↗</span></a>
            {email && <a className="header-link header-social-link" href={`mailto:${email}`} aria-label="Email Ammar" title={email} onClick={closeMenu}><EmailIcon className="header-nav-icon" aria-hidden="true" /><span className="mobile-link-label">Email</span></a>}
            {githubUrl && <a className="header-link header-social-link" href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)" title="GitHub" onClick={closeMenu}><GitHubIcon className="header-nav-icon header-github-icon" aria-hidden="true" /><span className="mobile-link-label">GitHub</span></a>}
            {linkedinUrl ? <a className="header-link header-social-link" href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)" title="LinkedIn" onClick={closeMenu}><LinkedInIcon className="header-nav-icon header-linkedin-icon" aria-hidden="true" /><span className="mobile-link-label">LinkedIn</span></a> : <span className="header-link header-social-link header-link-unavailable" aria-disabled="true" aria-label="LinkedIn (link coming soon)" title="LinkedIn — link coming soon"><LinkedInIcon className="header-nav-icon header-linkedin-icon" aria-hidden="true" /><span className="mobile-link-label">LinkedIn · Coming soon</span></span>}
        </div>
        <div className="header-mode-control">
            {onModeChange ? <ModeSelector simple={simple} onChange={next => { closeMenu(); onModeChange(next); }} />
                : <span className="mode-unavailable">Immersive View · Coming soon</span>}
            {onMotionChange && <span className="header-motion" data-inactive={simple || undefined} aria-hidden={simple || undefined} inert={simple}>
                <SceneMotionControl enabled={motionEnabled} onChange={onMotionChange} />
                <OrbitSpeedControl />
            </span>}
        </div>
    </>;

    return (
        <>
            <header ref={headerRef} className="header">
                <div className="header-identity">
                    <div className="header-brand">
                        <PortfolioLogo className="header-monogram" aria-hidden="true" />
                        <span>AmmarZ</span>
                    </div>
                    {onHelp && <button type="button" className="icon-button header-help" aria-label="Space Mode help" title="Space Mode help"
                        aria-haspopup="dialog" data-inactive={simple || undefined} aria-hidden={simple || undefined} inert={simple} onClick={onHelp}>
                        <HelpIcon aria-hidden="true" focusable="false" />
                    </button>}
                </div>
                <nav className="header-nav" aria-label="Main navigation">
                    {navigation}
                </nav>
                <div className="header-mobile-actions">
                    {onMotionChange && <span className="header-mobile-motion" data-inactive={simple || undefined} aria-hidden={simple || undefined} inert={simple}>
                        <SceneMotionControl enabled={motionEnabled} onChange={onMotionChange} />
                        <OrbitSpeedControl />
                    </span>}
                    <button type="button" className="icon-button mobile-menu-toggle" aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => { menu.open(); setMenuOpen(true); }}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </header>
            <dialog ref={menu.dialogRef} id="mobile-menu" className="mobile-menu" aria-labelledby="mobile-menu-title" onCancel={event => { event.preventDefault(); closeMenu(); }} onClose={() => { if (!menu.dialogRef.current?.open) { menu.restore(); setMenuOpen(false); } }}>
                <div className="mobile-menu-heading">
                    <h2 id="mobile-menu-title">Menu</h2>
                    <button type="button" className="icon-button" aria-label="Close navigation menu" onClick={closeMenu} autoFocus><CloseIcon aria-hidden="true" focusable="false" /></button>
                </div>
                <nav aria-label="Mobile navigation">{navigation}</nav>
            </dialog>
            <dialog ref={about.dialogRef} className="about-dialog" aria-labelledby="about-title" onCancel={event => { event.preventDefault(); about.close(); }} onClose={about.restore}>
                <div className="about-heading">
                    <h2 id="about-title">About Ammar Zaghloul</h2>
                    <button type="button" className="icon-button" aria-label="Close about" onClick={about.close} autoFocus><CloseIcon aria-hidden="true" focusable="false" /></button>
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
