import { test, expect } from "@playwright/test";

// Nota: estas pruebas mockean la API vía route interception,
// no necesitan levantar apps/api.

test.describe("Main dashboard flow", () => {
  test("loads wallets, selects one, shows history chart, edits tags and creates alert", async ({
    page,
  }) => {
    // Mock /wallets
    await page.route("**/wallets?includeBalance=true", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "eth-foundation",
              label: "Ethereum Foundation",
              address: "0xde0b2956...",
              chainId: "ethereum-mainnet",
              tags: ["foundation"],
            },
          ],
          count: 1,
        }),
      });
    });

    // Mock /wallets/:id/history
    await page.route("**/wallets/eth-foundation/history?limit=50", async (route) => {
      const now = Date.now();
      const data = Array.from({ length: 5 }).map((_, i) => ({
        walletId: "eth-foundation",
        chainId: "ethereum-mainnet",
        balance: (BigInt(10n ** 18n) * BigInt(10 + i)).toString(),
        timestamp: now - (5 - i) * 60_000,
      }));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data,
          count: data.length,
        }),
      });
    });

    // Mock /alerts (POST)
    await page.route("**/alerts", async (route) => {
      expect(route.request().method()).toBe("POST");
      const body = JSON.parse(route.request().postData() || "{}");
      expect(body.walletId).toBe("eth-foundation");
      expect(body.threshold).toBeGreaterThan(0);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: body,
          message: "Alert rule created successfully",
        }),
      });
    });

    await page.goto("/");

    // Sidebar should show our mocked wallet
    await expect(
      page.getByRole("button", { name: /Ethereum Foundation/i })
    ).toBeVisible();

    // Click wallet and wait for chart data
    await page
      .getByRole("button", { name: /Ethereum Foundation/i })
      .click();

    await expect(
      page.getByText(/History \(last/i)
    ).toBeVisible();

    // Tags: add one
    await page
      .getByPlaceholder("Add tag (e.g. foundation, ops)")
      .fill("ops");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(
      page.getByText(/Tag "ops" added \(MVP: solo en memoria\)/i)
    ).toBeVisible();

    // Alerts: create one
    await page
      .getByLabel("Threshold (% change)")
      .fill("10");
    await page
      .getByLabel("Window (minutes)")
      .fill("30");

    await page
      .getByRole("button", { name: /Save alert rule/i })
      .click();

    await expect(
      page.getByText(/Alert created\/updated successfully/i)
    ).toBeVisible();
  });
});


