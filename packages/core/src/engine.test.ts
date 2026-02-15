import { describe, it, expect } from "vitest";
import { matchFields } from "./engine";
import { Profile, DomSnapshot } from "./types";

describe("engine: matchFields", () => {
	const mockProfile: Profile = {
		version: 1,
		id: "test-profile",
		name: "Test Profile",
		enabledDomains: ["*"],
		rules: [
			{
				id: "1",
				name: "fullName",
				content: "John Doe",
				keywords: ["full name", "name"],
				type: "exact",
			},
			{
				id: "2",
				name: "email",
				content: "john@example.com",
				keywords: ["email", "e-mail"],
				type: "exact",
			},
		],
	};

	it("should match fields based on label (exact)", () => {
		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "f1",
					name: "q1",
					label: "Full Name",
					placeholder: null,
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, mockProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0]).toEqual({
			selector: "#f1",
			action: "set_value",
			payload: "John Doe",
		});
	});

	it("should match using fuzzy matching", () => {
		const fuzzyProfile: Profile = {
			...mockProfile,
			version: 1,
			rules: [
				{
					id: "f1",
					name: "Phone Number",
					content: "123-456-7890",
					keywords: ["phone"],
					type: "fuzzy",
				},
			],
		};

		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "p1",
					name: "phne", // typo
					label: "Phne Number", // typo
					placeholder: null,
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, fuzzyProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0].payload).toBe("123-456-7890");
	});

	it("should match using 'contains'", () => {
		const containsProfile: Profile = {
			...mockProfile,
			version: 1,
			rules: [
				{
					id: "c1",
					name: "City",
					content: "New York",
					keywords: ["location"],
					type: "contains",
				},
			],
		};

		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "loc",
					name: "current_location_city",
					label: "Current Location",
					placeholder: null,
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, containsProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0].payload).toBe("New York");
	});

	it("should match using 'starts_with'", () => {
		const startsWithProfile: Profile = {
			...mockProfile,
			version: 1,
			rules: [
				{
					id: "s1",
					name: "Zip",
					content: "10001",
					keywords: ["postal"],
					type: "starts_with",
				},
			],
		};

		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "z1",
					name: "postal_code",
					label: "Postal",
					placeholder: null,
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, startsWithProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0].payload).toBe("10001");
	});

	it("later rules should overwrite earlier ones", () => {
		const conflictProfile: Profile = {
			...mockProfile,
			version: 1,
			rules: [
				{
					id: "1",
					name: "First Name",
					content: "John",
					keywords: ["name"],
					type: "contains",
				},
				{
					id: "2",
					name: "Full Name",
					content: "John Doe",
					keywords: ["name"],
					type: "contains",
				},
			],
		};

		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "n1",
					name: "name",
					label: "Name",
					placeholder: null,
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, conflictProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0].payload).toBe("John Doe"); // Second rule wins
	});

	it("should not match if domain is not enabled", () => {
		const restrictedProfile: Profile = {
			...mockProfile,
			enabledDomains: ["allowed.com"],
		};
		const dom: DomSnapshot = {
			url: "https://disallowed.com/apply",
			fields: [
				{
					id: "f1",
					name: "name",
					label: "Name",
					placeholder: null,
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, restrictedProfile);
		expect(actions).toHaveLength(0);
	});
});
