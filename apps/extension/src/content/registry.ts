import { SiteAdapter } from "./types";
import { WorkdayAdapter } from "./adapters/workday";

const ADAPTERS: SiteAdapter[] = [WorkdayAdapter];

export function getActiveAdapter(): SiteAdapter | null {
	const url = new URL(window.location.href);
	return ADAPTERS.find((adapter) => adapter.matches(url)) || null;
}
