declare global {
	var chrome: {
		storage: {
			sync: {
				get: (keys: string[] | string | object, callback: (result: any) => void) => void;
				set: (items: object, callback?: () => void) => void;
			};
		};
	};
}

export { };