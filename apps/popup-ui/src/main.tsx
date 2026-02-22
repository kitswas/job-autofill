import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@knadh/oat/oat.min.css";
import "@knadh/oat/oat.min.js";

const applyTheme = (dark: boolean) => {
	document.documentElement.dataset.theme = dark ? "dark" : "light";
};

const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
applyTheme(darkMediaQuery.matches);
darkMediaQuery.addEventListener("change", (e) => applyTheme(e.matches));

const root = document.getElementById("root");

if (root) {
	createRoot(root).render(<App />);
}
