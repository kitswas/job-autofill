type CompressedStorageValue = {
	__jaCompressed: true;
	v: 1;
	alg: "deflate-raw";
	data: string;
};

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		binary += String.fromCharCode(...chunk);
	}
	return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

function isCompressedStorageValue(value: unknown): value is CompressedStorageValue {
	if (!value || typeof value !== "object") return false;
	const candidate = value as Partial<CompressedStorageValue>;
	return (
		candidate.__jaCompressed === true &&
		candidate.v === 1 &&
		candidate.alg === "deflate-raw" &&
		typeof candidate.data === "string"
	);
}

export type CompressResult = {
	data: CompressedStorageValue;
	savedPercent: number;
};

export async function compress(value: unknown): Promise<CompressResult | null> {
	if (typeof CompressionStream === "undefined") {
		return Promise.resolve(null);
	}

	const json = JSON.stringify(value);
	const input = new TextEncoder().encode(json);
	const compressedStream = new Blob([input])
		.stream()
		.pipeThrough(new CompressionStream("deflate-raw"));
	const compressedBuffer = await new Response(compressedStream).arrayBuffer();
	const compressedBytes = new Uint8Array(compressedBuffer);
	const encoded = bytesToBase64(compressedBytes);
	const afterBytes = new TextEncoder().encode(encoded).length;
	// Base64 adds overhead - skip compression if it doesn't actually save space
	if (afterBytes >= input.byteLength) {
		return null;
	}
	return {
		data: { __jaCompressed: true, v: 1, alg: "deflate-raw", data: encoded },
		savedPercent: ((input.byteLength - afterBytes) / input.byteLength) * 100,
	};
}

export async function decompress<T = unknown>(value: unknown): Promise<T> {
	if (!isCompressedStorageValue(value)) {
		return Promise.resolve(value as T);
	}

	if (typeof DecompressionStream === "undefined") {
		return Promise.reject(new Error("DecompressionStream is not available in this runtime"));
	}

	const compressedBytes = base64ToBytes(value.data);
	const blobInput = new Uint8Array(compressedBytes.length);
	blobInput.set(compressedBytes);
	const decompressedStream = new Blob([blobInput.buffer])
		.stream()
		.pipeThrough(new DecompressionStream("deflate-raw"));
	return new Response(decompressedStream).text().then((json) => JSON.parse(json) as T);
}
