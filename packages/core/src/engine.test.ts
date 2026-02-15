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
					type: "text",
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
					type: "text",
				},
			],
		};

		const actions = matchFields(dom, fuzzyProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0].payload).toBe("123-456-7890");
	});

	it("should prioritize exact matches over contains", () => {
		const priorityProfile: Profile = {
			...mockProfile,
			rules: [
				{
					id: "c1",
					name: "City",
					content: "Partial Match",
					keywords: ["location"],
					type: "contains",
				},
				{
					id: "e1",
					name: "Location",
					content: "Exact Match",
					keywords: ["location"],
					type: "exact",
				},
			],
		};

		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "loc",
					name: "location",
					label: "Location",
					ariaLabel: null,
					placeholder: null,
					automationId: null,
					kind: "input",
					type: "text",
				},
			],
		};

		const actions = matchFields(dom, priorityProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0].payload).toBe("Exact Match");
	});

	it("should match checkboxes and radio buttons", () => {
		const checkboxProfile: Profile = {
			...mockProfile,
			rules: [
				{
					id: "cb1",
					name: "Newsletter",
					content: "true",
					keywords: ["subscribe"],
					type: "contains",
				},
			],
		};

		const dom: DomSnapshot = {
			url: "https://example.com/apply",
			fields: [
				{
					id: "newsletter",
					name: "subscribe",
					label: "Subscribe to newsletter",
					ariaLabel: null,
					placeholder: null,
					automationId: null,
					kind: "input",
					type: "checkbox",
				},
			],
		};

		const actions = matchFields(dom, checkboxProfile);
		expect(actions).toHaveLength(1);
		expect(actions[0].payload).toBe("true");
	});

	describe("separate date rules with contains", () => {
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
					keywords: ["startDate dateSectionMonth"],
					type: "contains",
				},
				{
					id: "y1",
					name: "Start Year",
					content: "2022",
					keywords: ["startDate dateSectionYear"],
					type: "contains",
				},
			],
		};

		it("should match Month field with contains rule", () => {
			const dom: DomSnapshot = {
				url: "https://workday.com/apply",
				fields: [
					{
						id: "workExperience-1--startDate-dateSectionMonth-input",
						name: "month",
						label: "From",
						ariaLabel: "Month",
						placeholder: "MM",
						automationId: "dateSectionMonth-input",
						kind: "input",
						type: "text",
					},
				],
			};

			const actions = matchFields(dom, dateProfile);
			expect(actions).toHaveLength(1);
			expect(actions[0].payload).toBe("08");
		});

		it("should match Year field with contains rule", () => {
			const dom: DomSnapshot = {
				url: "https://workday.com/apply",
				fields: [
					{
						id: "workExperience-1--startDate-dateSectionYear-input",
						name: "year",
						label: "From",
						ariaLabel: "Year",
						placeholder: "YYYY",
						automationId: "dateSectionYear-input",
						kind: "input",
						type: "text",
					},
				],
			};

			const actions = matchFields(dom, dateProfile);
			expect(actions).toHaveLength(1);
			expect(actions[0].payload).toBe("2022");
		});
	});
});
