import { useState } from "react";
import { MainScene, type ForgedIdea } from "./scenes/MainScene";
import { OpeningScene } from "./scenes/OpeningScene";

function App() {
  const [forgedIdea, setForgedIdea] = useState<ForgedIdea | null>(null);

  if (forgedIdea) {
    return <MainScene idea={forgedIdea} />;
  }

  return <OpeningScene onForge={setForgedIdea} />;
}

export default App;
