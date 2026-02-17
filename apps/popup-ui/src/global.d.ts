export {};

declare global {
	interface Window {
		ot: {
			toast: (
				message: string,
				title?: string,
				options?: {
					variant?: "success" | "danger" | "warning";
					placement?:
						| "top-right"
						| "top-left"
						| "top-center"
						| "bottom-right"
						| "bottom-left"
						| "bottom-center";
					duration?: number;
				},
			) => void;
			toastEl: (
				el: HTMLElement | HTMLTemplateElement,
				options?: {
					placement?: string;
					duration?: number;
				},
			) => void;
		};
	}
	const ot: Window["ot"];
}
