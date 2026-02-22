import { Profile } from "core";

export type CompressedStorageValue = {
	__jaCompressed: true;
	v: 1;
	alg: "deflate";
	data: string;
};

export function getUtf8ByteLength(value: string): number {
	return new TextEncoder().encode(value).length;
}

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
		candidate.alg === "deflate" &&
		typeof candidate.data === "string"
	);
}

export function compressJsonValue(value: unknown): Promise<CompressedStorageValue | null> {
	if (typeof CompressionStream === "undefined") {
		return Promise.resolve(null);
	}

	const json = JSON.stringify(value);
	const input = new TextEncoder().encode(json);
	const compressedStream = new Blob([input])
		.stream()
		.pipeThrough(new CompressionStream("deflate"));
	return new Response(compressedStream).arrayBuffer().then((compressedBuffer) => {
		const compressedBytes = new Uint8Array(compressedBuffer);
		return {
			__jaCompressed: true,
			v: 1,
			alg: "deflate",
			data: bytesToBase64(compressedBytes),
		};
	});
}

export function maybeDecompressProfile(value: unknown): Promise<Profile> {
	if (!isCompressedStorageValue(value)) {
		return Promise.resolve(value as Profile);
	}

	if (typeof DecompressionStream === "undefined") {
		return Promise.reject(new Error("DecompressionStream is not available in this runtime"));
	}

	const compressedBytes = base64ToBytes(value.data);
	const blobInput = new Uint8Array(compressedBytes.length);
	blobInput.set(compressedBytes);
	const decompressedStream = new Blob([blobInput.buffer])
		.stream()
		.pipeThrough(new DecompressionStream("deflate"));
	return new Response(decompressedStream).text().then((json) => JSON.parse(json) as Profile);
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${kb.toFixed(1)} KB`;
	return `${(kb / 1024).toFixed(2)} MB`;
}
