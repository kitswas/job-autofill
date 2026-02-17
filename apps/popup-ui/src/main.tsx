import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@knadh/oat/oat.min.css";
import "@knadh/oat/oat.min.js";

const root = document.getElementById("root");

if (root) {
	createRoot(root).render(<App />);
}
