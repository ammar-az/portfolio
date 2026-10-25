// src/App.tsx

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Header from "./components/Header";

import "./App.css";
import Simple from "./components/Simple";
import Space from "./components/Space";
import type { StarAppearance } from "./data/starAppearance";
import useModeTransition from "./hooks/useModeTransition";
import { PlanetProjectionProvider } from "./components/space/PlanetProjection";

function App() {
	const { simple, changeMode, phase, overlayRef, onSpaceReady } = useModeTransition();
	const [textureRevision, setTextureRevision] = useState(0);
	const [starfieldRevision, setStarfieldRevision] = useState(0);
	const [starAppearance, setStarAppearance] = useState<StarAppearance>({ color: "yellow", seed: 1871 });
	const [motionEnabled, setMotionEnabled] = useState(true);
	const [convectionEnabled, setConvectionEnabled] = useState(() => !matchMedia("(prefers-reduced-motion: reduce)").matches);
	const motionClock = useRef(0);
	
	return (
		<>
			<PlanetProjectionProvider enabled={!simple && motionEnabled} convectionEnabled={convectionEnabled} clock={motionClock}>
				<div className={simple ? "portfolio-app" : "portfolio-app portfolio-app-space"} inert={phase !== "idle"} aria-busy={phase !== "idle" || undefined}>
					<Header simple={simple} onModeChange={changeMode} motionEnabled={motionEnabled} onMotionChange={setMotionEnabled} resumeUrl="/Ammar-Zaghloul-Resume.pdf" email="ammar.zaghloul55@gmail.com" githubUrl="https://github.com/ammar-az" linkedinUrl="https://www.linkedin.com/in/ammar-zaghloul/" />

					{simple ? (
						<Simple onSpaceMode={() => changeMode(false)}/>
					) :  (
						<Space textureRevision={textureRevision} onReroll={() => setTextureRevision(revision => revision + 1)}
							motionEnabled={motionEnabled} onMotionChange={setMotionEnabled}
							convectionEnabled={convectionEnabled} onConvectionChange={setConvectionEnabled} onReady={onSpaceReady}
							starfieldRevision={starfieldRevision} onStarfieldReroll={() => setStarfieldRevision(revision => revision + 1)}
							starAppearance={starAppearance} onStarAppearanceChange={setStarAppearance}/>
					)}
				</div>
			</PlanetProjectionProvider>
			{createPortal(<div ref={overlayRef} className="mode-transition" data-phase={phase} aria-hidden="true" />, document.body)}
		</>
	);
}

export default App;
