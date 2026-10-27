// src/App.tsx

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Header from "./components/Header";

import "./App.css";
import Simple from "./components/Simple";
import Space from "./components/Space";
import type { StarAppearance } from "./data/starAppearance";
import useModeTransition from "./hooks/useModeTransition";
import { PlanetProjectionProvider } from "./components/space/PlanetProjection";
import SpaceGuidance from "./components/space/SpaceHelp";
import { readPreferences, savePreferences } from "./utils/preferences";

function App() {
	const [initial] = useState(readPreferences);
	const { simple, changeMode, phase, overlayRef, headerOverlayRef, onSpaceReady } = useModeTransition(initial.mode);
	const [textureRevision, setTextureRevision] = useState(initial.textureRevision);
	const [starfieldRevision, setStarfieldRevision] = useState(initial.starfieldRevision);
	const [starAppearance, setStarAppearance] = useState<StarAppearance>(initial.starAppearance);
	const [motionEnabled, setMotionEnabled] = useState(initial.motionEnabled);
	const [convectionEnabled, setConvectionEnabled] = useState(initial.convectionEnabled);
	const [systemsEnabled, setSystemsEnabled] = useState(initial.systemsEnabled);
	const [introDismissed, setIntroDismissed] = useState(initial.introDismissed);
	const [helpRequest, setHelpRequest] = useState(0);
	const motionClock = useRef(0);
	useEffect(() => {
		savePreferences({ version: 1, mode: simple ? "simple" : "space", textureRevision, starfieldRevision,
			starAppearance, motionEnabled, convectionEnabled, systemsEnabled, introDismissed });
	}, [simple, textureRevision, starfieldRevision, starAppearance, motionEnabled, convectionEnabled, systemsEnabled, introDismissed]);
	const openHelp = () => { setIntroDismissed(true); setHelpRequest(request => request + 1); };
	
	return (
		<>
			<PlanetProjectionProvider enabled={!simple && motionEnabled} convectionEnabled={convectionEnabled} clock={motionClock}
				systemsEnabled={systemsEnabled} setSystemsEnabled={setSystemsEnabled}>
				<div className={simple ? "portfolio-app" : "portfolio-app portfolio-app-space"} inert={phase !== "idle"} aria-busy={phase !== "idle" || undefined}>
					<div ref={headerOverlayRef} className="mode-transition-header" data-phase={phase} aria-hidden="true" />
					<Header simple={simple} onHelp={openHelp} onModeChange={changeMode} motionEnabled={motionEnabled} onMotionChange={setMotionEnabled} resumeUrl="/Ammar-Zaghloul-Resume.pdf" email="ammar.zaghloul55@gmail.com" githubUrl="https://github.com/ammar-az" linkedinUrl="https://www.linkedin.com/in/ammar-zaghloul/" />

					{simple ? (
						<Simple onSpaceMode={() => changeMode(false)}/>
					) :  (
						<Space textureRevision={textureRevision} onReroll={() => setTextureRevision(revision => revision + 1)}
							motionEnabled={motionEnabled}
							convectionEnabled={convectionEnabled} onConvectionChange={setConvectionEnabled} onReady={onSpaceReady}
							starfieldRevision={starfieldRevision} onStarfieldReroll={() => setStarfieldRevision(revision => revision + 1)}
							starAppearance={starAppearance} onStarAppearanceChange={setStarAppearance}/>
					)}
				</div>
				{!simple && phase === "idle" && <SpaceGuidance request={helpRequest} introDismissed={introDismissed}
					onDismiss={() => setIntroDismissed(true)} />}
			</PlanetProjectionProvider>
			{createPortal(<div ref={overlayRef} className="mode-transition" data-phase={phase} aria-hidden="true" />, document.body)}
		</>
	);
}

export default App;
