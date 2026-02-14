import { describe, it, expect } from "vitest";
import { matchFields } from "./engine";
import { Profile, DomSnapshot } from "./types";

describe("engine: matchFields", () => {
	const mockProfile: Profile = {
		id: "test-profile",
		name: "Test Profile",
		enabledDomains: ["*"],
		mappings: {
			fullName: {
				content: "John Doe",
				keywords: ["full name", "name"],
			},
			email: {
				content: "john@example.com",
				keywords: ["email", "e-mail"],
			},
		},
	};

	it("should match fields based on label", () => {
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

	it("should match fields based on placeholder", () => {
		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: null,
					name: "email_field",
					label: null,
					placeholder: "Enter your email",
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, mockProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0]).toEqual({
			selector: '[name="email_field"]',
			action: "set_value",
			payload: "john@example.com",
		});
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

	it("should match if domain ends with enabled domain", () => {
		const restrictedProfile: Profile = {
			...mockProfile,
			enabledDomains: ["myworkdayjobs.com"],
		};
		const dom: DomSnapshot = {
			url: "https://company.myworkdayjobs.com/apply",
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
		expect(actions).toHaveLength(1);
	});

	it("should not match substrings that are not whole words (potential future improvement)", () => {
		// Currently this test WILL FAIL if we want strict word matching,
		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "f1",
					name: "description",
					label: "Description",
					placeholder: null,
					kind: "input",
				},
			],
		};

		const profileWithZip: Profile = {
			...mockProfile,
			mappings: {
				zip: {
					content: "12345",
					keywords: ["zip"],
				},
			},
		};

		const actions = matchFields(dom, profileWithZip);
		const dom2: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "f1",
					name: "unzipped_file",
					label: "Unzipped",
					placeholder: null,
					kind: "input",
				},
			],
		};
		const actions2 = matchFields(dom2, profileWithZip);
		// With word boundaries, "unzipped" should NOT match "zip"
		expect(actions2).toHaveLength(0);
	});

	it("should match normalized text (snake_case, camelCase)", () => {
		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "firstName",
					name: "q1",
					label: null,
					placeholder: null,
					kind: "input",
				},
				{
					id: null,
					name: "last_name",
					label: null,
					placeholder: null,
					kind: "input",
				},
			],
		};

		const profile: Profile = {
			...mockProfile,
			mappings: {
				firstName: { content: "John", keywords: ["first name"] },
				lastName: { content: "Doe", keywords: ["last name"] },
			},
		};

		const actions = matchFields(dom, profile);
		expect(actions).toHaveLength(2);
		expect(actions.find((a) => a.selector === "#firstName")?.payload).toBe("John");
		expect(actions.find((a) => a.selector === '[name="last_name"]')?.payload).toBe("Doe");
	});
});
