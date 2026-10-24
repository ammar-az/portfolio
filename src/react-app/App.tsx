// src/App.tsx

import { useState } from "react";
import Header from "./components/Header";

import "./App.css";
import Simple from "./components/Simple";
import Space from "./components/Space";

function App() {
	const [simple] = useState<boolean>(true);
	//const [motion, setMotion] = useState<boolean>(true);

	//const projects ;
	
	return (
		<>
			<Header simple={simple} resumeUrl="/Ammar-Zaghloul-Resume.pdf" email="ammar.zaghloul55@gmail.com" githubUrl="https://github.com/ammar-az" linkedinUrl="https://www.linkedin.com/in/ammar-zaghloul/" />

			{simple ? (
				<Simple/>
			) :  (
				<Space/>
			)}
		</>
	);
}

export default App;
