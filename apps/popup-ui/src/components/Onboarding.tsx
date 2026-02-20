interface OnboardingProps {
	onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
	// Vite serves files placed in the `public` directory at the project root.
	// we keep the logo under `public/icons/logo.svg` so it can be fetched
	// both in dev mode (`pnpm dev:popup`) and after building.
	const logoUrl = new URL("/icons/logo.svg", import.meta.url).href;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				padding: "2rem",
				textAlign: "center",
				maxWidth: "600px",
				margin: "0 auto",
			}}
		>
			<img
				src={logoUrl}
				alt="Job Autofill"
				width="128px"
				height="128px"
				style={{ marginBottom: "2rem" }}
			/>
			<h1>Welcome to Job Autofill</h1>
			<p style={{ fontSize: "1.2rem", color: "#555", marginBottom: "2rem" }}>
				Tired of filling out the same information on every form? <br />
				Job Autofill helps you save time by automatically filling forms with your data.
			</p>

			<div style={{ textAlign: "left", width: "100%", marginBottom: "2rem" }}>
				<h3>How it works:</h3>
				<ul style={{ lineHeight: "1.6" }}>
					<li>
						<strong>Create a Profile:</strong> Add your contact details, education, and
						experience.
					</li>
					<li>
						<strong>Visit a Job Site:</strong> Go to a job application form (Workday,
						Greenhouse, Lever, etc.).
					</li>
					<li>
						<strong>Right-click & Autofill:</strong> Use the context menu and choose a
						profile to fill the form instantly.
					</li>
					<li>
						<strong>Note:</strong> This works on all websites with forms, but is
						optimized for popular job platforms.
					</li>
				</ul>
			</div>

			<button
				className="btn"
				onClick={onComplete}
				style={{ padding: "0.8rem 2rem", fontSize: "1.1rem" }}
			>
				Get Started
			</button>
		</div>
	);
}
