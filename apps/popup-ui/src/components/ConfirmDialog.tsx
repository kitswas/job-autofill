import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
	id: string;
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	confirmVariant?: "primary" | "danger" | "secondary";
	onConfirm: () => void;
	onCancel?: () => void;
}

export function ConfirmDialog({
	id,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	confirmVariant = "danger",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		const handleClose = () => {
			const value = dialog.returnValue;
			// Reset returnValue immediately so it doesn't persist to the next open
			dialog.returnValue = "";

			if (value === "confirm") {
				onConfirm();
			} else {
				onCancel?.();
			}
		};

		dialog.addEventListener("close", handleClose);
		return () => dialog.removeEventListener("close", handleClose);
	}, [onConfirm, onCancel]);

	return (
		<dialog id={id} ref={dialogRef} closedby="any">
			<form method="dialog">
				<header>
					<h3>{title}</h3>
					{description && <p>{description}</p>}
				</header>
				<footer>
					<button value="cancel" className="outline">
						{cancelText}
					</button>
					<button value="confirm" data-variant={confirmVariant}>
						{confirmText}
					</button>
				</footer>
			</form>
		</dialog>
	);
}
