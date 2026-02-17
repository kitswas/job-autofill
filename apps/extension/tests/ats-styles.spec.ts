import { test, expect } from "./fixtures";
import { testProfiles } from "./profiles";
import { Profile } from "core";

function getExpectedValue(profile: Profile, ruleName: string): string {
	const rule = profile.rules.find((r) => r.name === ruleName || r.keywords.includes(ruleName));
	return rule ? rule.content : "";
}

test.describe("ATS Styles Matrix Autofill", () => {
	test.beforeEach(async ({ browserName }) => {
		if (browserName === "webkit") {
			test.skip();
		}
	});

	for (const profile of testProfiles) {
		test.describe(`Profile: ${profile.name}`, () => {
			test("should autofill Workday style form", async ({ page }) => {
				await page.goto("http://localhost:5173/workday-style.html");

				await page.evaluate((p) => {
					window.postMessage({ type: "PLAYWRIGHT_TRIGGER_AUTOFILL", profile: p }, "*");
				}, profile);

				await page.waitForTimeout(1500);

				await expect(
					page.locator('[data-automation-id="legalNameSection_firstName"]'),
				).toHaveValue(getExpectedValue(profile, "Given Name"));
				await expect(
					page.locator('[data-automation-id="legalNameSection_lastName"]'),
				).toHaveValue(getExpectedValue(profile, "Family Name"));
				await expect(
					page.locator('[data-automation-id="contactInformationSection_email"]'),
				).toHaveValue(getExpectedValue(profile, "Email"));
				await expect(
					page.locator('[data-automation-id="contactInformationSection_phoneNumber"]'),
				).toHaveValue(getExpectedValue(profile, "Phone Number"));
				await expect(
					page.locator('[data-automation-id="addressSection_city"]'),
				).toHaveValue(getExpectedValue(profile, "City"));
				await expect(
					page.locator('[data-automation-id="addressSection_postalCode"]'),
				).toHaveValue(getExpectedValue(profile, "Postal Code"));
				await expect(
					page.locator('[data-automation-id="experienceSection_jobTitle"]'),
				).toHaveValue(getExpectedValue(profile, "Job Title"));
				await expect(
					page.locator('[data-automation-id="experienceSection_companyName"]'),
				).toHaveValue(getExpectedValue(profile, "Company"));
			});

			test("should autofill Lever style form", async ({ page }) => {
				await page.goto("http://localhost:5173/lever-style.html");

				await page.evaluate((p) => {
					window.postMessage({ type: "PLAYWRIGHT_TRIGGER_AUTOFILL", profile: p }, "*");
				}, profile);

				await page.waitForTimeout(1500);

				await expect(page.locator('[name="name"]')).toHaveValue(
					getExpectedValue(profile, "Full Name"),
				);
				await expect(page.locator('[name="email"]')).toHaveValue(
					getExpectedValue(profile, "Email"),
				);
				await expect(page.locator('[name="phone"]')).toHaveValue(
					getExpectedValue(profile, "Phone Number"),
				);
				await expect(page.locator('[name="org"]')).toHaveValue(
					getExpectedValue(profile, "Company"),
				);
				await expect(page.locator('[name="urls[LinkedIn]"]')).toHaveValue(
					getExpectedValue(profile, "LinkedIn"),
				);
				await expect(page.locator('[name="urls[Portfolio]"]')).toHaveValue(
					getExpectedValue(profile, "Website / Portfolio"),
				);
			});

			test("should autofill Greenhouse style form", async ({ page }) => {
				await page.goto("http://localhost:5173/greenhouse-style.html");

				await page.evaluate((p) => {
					window.postMessage({ type: "PLAYWRIGHT_TRIGGER_AUTOFILL", profile: p }, "*");
				}, profile);

				await page.waitForTimeout(1500);

				await expect(page.locator("#first_name")).toHaveValue(
					getExpectedValue(profile, "Given Name"),
				);
				await expect(page.locator("#last_name")).toHaveValue(
					getExpectedValue(profile, "Family Name"),
				);
				await expect(page.locator("#email")).toHaveValue(
					getExpectedValue(profile, "Email"),
				);
				await expect(page.locator("#phone")).toHaveValue(
					getExpectedValue(profile, "Phone Number"),
				);
				await expect(page.locator("#education_school_name_0")).toHaveValue(
					getExpectedValue(profile, "School or University"),
				);
			});

			test("should autofill Ashby style form", async ({ page }) => {
				await page.goto("http://localhost:5173/ashby-style.html");

				await page.evaluate((p) => {
					window.postMessage({ type: "PLAYWRIGHT_TRIGGER_AUTOFILL", profile: p }, "*");
				}, profile);

				await page.waitForTimeout(1500);

				await expect(page.locator('[name="first_name"]')).toHaveValue(
					getExpectedValue(profile, "Given Name"),
				);
				await expect(page.locator('[name="last_name"]')).toHaveValue(
					getExpectedValue(profile, "Family Name"),
				);
				await expect(page.locator('[name="email"]')).toHaveValue(
					getExpectedValue(profile, "Email"),
				);
				await expect(page.locator('[name="phone_number"]')).toHaveValue(
					getExpectedValue(profile, "Phone Number"),
				);
				await expect(page.locator('[name="linkedin_url"]')).toHaveValue(
					getExpectedValue(profile, "LinkedIn"),
				);
				await expect(page.locator('[name="github_url"]')).toHaveValue(
					getExpectedValue(profile, "GitHub"),
				);
			});
		});
	}
});
