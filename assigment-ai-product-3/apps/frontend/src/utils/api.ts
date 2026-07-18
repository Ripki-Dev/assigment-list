import { hc } from "hono/client";
import type { AppType } from "../../../api/src/index.js";

export const client = hc<AppType>("http://localhost:8000");
