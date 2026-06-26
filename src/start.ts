import { defaultStreamHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

export default {
  async fetch(request: Request) {
    const router = getRouter();
    return defaultStreamHandler({ request, router, responseHeaders: new Headers() });
  },
};
