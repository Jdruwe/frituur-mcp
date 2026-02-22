import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {McpAgent} from "agents/mcp";
import {z} from "zod";
import {AgentContext} from "agents";
import {env} from "cloudflare:workers";
import {launch} from "@cloudflare/playwright";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	readonly server: McpServer

	constructor(ctx: AgentContext, env: Cloudflare.Env) {
		super(ctx, env);
		this.server = new McpServer({
			name: "Frituur MCP",
			version: "1.0.0",
		});
	}

	async init() {
		this.server.registerTool("order_time_slots", {
				description: "List today's available ordering slots for the frituur",
				inputSchema: {
					time: z.iso
						.time()
						.describe("Current time in 24-hour format, e.g., HH:MM -> 14:30"),
				},
			},
			async ({time}) => {

				console.log('Starting order_time_slots:, time:', time);

				const [currentHour, currentMin] = time.split(':').map(Number);
				const cutoffMinutes = currentHour * 60 + currentMin;

				const browser = await launch(env.MYBROWSER);
				const context = await browser.newContext({
					locale: 'nl-BE',
					timezoneId: 'Europe/Brussels'
				});
				const page = await context.newPage();
				await page.goto("https://mylightspeed.app/JXELRTFW/C-ordering/menu");

				const modal = page.locator('[data-testid="open-pickup-modal"]');

				const pickModelOpen = await modal.waitFor({state: 'visible', timeout: 4000})
					.then(() => true)
					.catch(() => false);

				if (!pickModelOpen) {
					await page.locator('#pickup-time-button').click();
					await modal.waitFor({state: 'visible', timeout: 5000});
				}

				await page.locator('[data-testid="show-slots-toggle"]').click();

				const slots = await page.locator('[data-testid^="slot-option-"]').evaluateAll((elements, cutoff) =>
						elements
							.map(el => ({
								time: el.getAttribute('data-testid').replace('slot-option-', ''),
								remaining: el.querySelector('p').getAttribute('data-value')
							}))
							.filter(slot => {
								const [slotHour, slotMin] = slot.time.split(':').map(Number);
								return (slotHour * 60 + slotMin) >= cutoff;
							})
					, cutoffMinutes);

				await browser.close()

				if (slots.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: "No available order time slots for today at or after the specified time.",
							},
						],
					};
				}

				const formattedSlots = slots.map((slot) =>
					[
						`Time: ${slot.time}`,
						`Remaining: ${slot.remaining}`,
						"---",
					].join("\n"),
				);

				return {
					content: [
						{
							type: "text",
							text: `Available order time slots for today (>= ${time}):\n\n${formattedSlots.join("\n")}`,
						},
					],
				};
			});
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", {status: 404});
	},
};
