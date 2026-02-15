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
					ariaLabel: null,
					placeholder: null,
					automationId: null,
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, mockProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0]).toEqual({
			selector: '[id="f1"]',
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
					ariaLabel: null,
					placeholder: null,
					automationId: null,
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
					ariaLabel: null,
					placeholder: null,
					automationId: null,
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
					ariaLabel: null,
					placeholder: null,
					automationId: null,
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
					ariaLabel: null,
					placeholder: null,
					automationId: null,
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
					ariaLabel: null,
					placeholder: null,
					automationId: null,
					kind: "input",
				},
			],
		};

		const actions = matchFields(dom, restrictedProfile);
		expect(actions).toHaveLength(0);
	});

	describe("separate date rules", () => {
		const dateProfile: Profile = {
			version: 1,
			id: "date-profile",
			name: "Date Profile",
			enabledDomains: ["*"],
			rules: [
				{
					id: "m1",
					name: "Start Month",
					content: "08",
					keywords: ["startDate", "month"],
					type: "contains",
				},
				{
					id: "y1",
					name: "Start Year",
					content: "2022",
					keywords: ["startDate", "year"],
					type: "contains",
				},
			],
		};

		it("should match Month field with its own rule", () => {
			const dom: DomSnapshot = {
				url: "https://workday.com/apply",
				fields: [
					{
						id: "month-input",
						name: "month",
						label: "From",
						ariaLabel: "Month",
						placeholder: "MM",
						automationId: "dateSectionMonth-input",
						kind: "input",
					},
				],
			};

			const actions = matchFields(dom, dateProfile);
			expect(actions).toHaveLength(1);
			expect(actions[0].payload).toBe("08");
		});

		it("should match Year field with its own rule", () => {
			const dom: DomSnapshot = {
				url: "https://workday.com/apply",
				fields: [
					{
						id: "year-input",
						name: "year",
						label: "From",
						ariaLabel: "Year",
						placeholder: "YYYY",
						automationId: "dateSectionYear-input",
						kind: "input",
					},
				],
			};

			const actions = matchFields(dom, dateProfile);
			expect(actions).toHaveLength(1);
			expect(actions[0].payload).toBe("2022");
		});
	});
});
