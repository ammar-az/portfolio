// src/App.tsx

import { useState } from "react";
import { createPortal } from "react-dom";
import Header from "./components/Header";

import "./App.css";
import Simple from "./components/Simple";
import Space from "./components/Space";
import type { StarAppearance } from "./data/starAppearance";
import useModeTransition from "./hooks/useModeTransition";

function App() {
	const { simple, changeMode, phase, overlayRef } = useModeTransition();
	const [textureRevision, setTextureRevision] = useState(0);
	const [starfieldRevision, setStarfieldRevision] = useState(0);
	const [starAppearance, setStarAppearance] = useState<StarAppearance>({ color: "yellow", finish: "textured", seed: 1871 });
	
	return (
		<>
			<div className={simple ? "portfolio-app" : "portfolio-app portfolio-app-space"} inert={phase !== "idle"} aria-busy={phase !== "idle" || undefined}>
				<Header simple={simple} onModeChange={changeMode} resumeUrl="/Ammar-Zaghloul-Resume.pdf" email="ammar.zaghloul55@gmail.com" githubUrl="https://github.com/ammar-az" linkedinUrl="https://www.linkedin.com/in/ammar-zaghloul/" />

				{simple ? (
					<Simple onSpaceMode={() => changeMode(false)}/>
				) :  (
					<Space textureRevision={textureRevision} onReroll={() => setTextureRevision(revision => revision + 1)}
						starfieldRevision={starfieldRevision} onStarfieldReroll={() => setStarfieldRevision(revision => revision + 1)}
						starAppearance={starAppearance} onStarAppearanceChange={setStarAppearance}/>
				)}
			</div>
			{createPortal(<div ref={overlayRef} className="mode-transition" data-phase={phase} aria-hidden="true" />, document.body)}
		</>
	);
}

export default App;
