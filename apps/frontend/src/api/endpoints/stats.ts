import type { ApiClient } from "../client";
import type { LibraryStats } from "../types";

export const statsEndpoints = (client: ApiClient) => ({
  library: () => client.request<LibraryStats>("stats/library"),
});
