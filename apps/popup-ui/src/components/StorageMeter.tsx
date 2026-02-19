interface StorageMeterProps {
	label: string;
	value: number;
	max: number;
	subText?: string;
}

export function StorageMeter({ label, value, max, subText }: StorageMeterProps) {
	const pct = max > 0 ? Math.round((value / max) * 100) : 0;
	const optimum = 0.2 * max;
	const low = 0.5 * max;
	const high = 0.8 * max;

	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "0.25rem",
				}}
			>
				<span>{label}</span>
				<span>{pct}%</span>
			</div>
			<meter
				value={value}
				optimum={optimum}
				low={low}
				high={high}
				max={max}
				style={{ width: "100%", height: "0.5rem" }}
			/>
			<div style={{ textAlign: "right", opacity: 0.6, fontSize: "0.7rem" }}>{subText}</div>
		</div>
	);
}

export default StorageMeter;
