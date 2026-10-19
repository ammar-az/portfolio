// src/App.tsx

import { useState } from "react";
import Header from "./components/Header";

import "./App.css";
import Simple from "./components/Simple";
import Space from "./components/Space";

function App() {
	const [simple, _] = useState<boolean>(true);
	//const [motion, setMotion] = useState<boolean>(true);

	//const projects ;
	
	return (
		<>
			<Header/>

			{simple ? (
				<Simple/>
			) :  (
				<Space/>
			)}
		</>
	);
}

export default App;
