import { createRoot } from "react-dom/client";
import "../src/styles.css";
import { Dagslistan } from "../src/components/Dagslistan";

createRoot(document.getElementById("root")!).render(<Dagslistan />);
