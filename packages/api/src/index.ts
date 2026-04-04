import { app } from "@azure/functions";
import { azureHonoHandler } from "./lib/hono-azurefunc-adapter.js";
import honoApp from "./routes/index.js";

app.setup({
    enableHttpStream: true,
});

app.http("httpTrigger", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "{*proxy}",
  handler: azureHonoHandler(honoApp),
});
