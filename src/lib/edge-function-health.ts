// Edge function health check utility

export interface EdgeFunctionHealth {
  name: string;
  status: "ok" | "error" | "timeout";
  responseTimeMs: number;
  env?: Record<string, boolean>;
  error?: string;
}

const EDGE_FUNCTIONS = ["send-email"] as const;

/**
 * Check health of a single edge function.
 */
export async function checkEdgeFunctionHealth(
  functionName: string
): Promise<EdgeFunctionHealth> {
  const start = performance.now();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}?health=1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({}),
      }
    );
    const data = await response.json();

    const elapsed = Math.round(performance.now() - start);

    if (!response.ok) {
      return { name: functionName, status: "error", responseTimeMs: elapsed, error: `HTTP ${response.status}` };
    }

    return {
      name: functionName,
      status: data?.status === "ok" ? "ok" : "error",
      responseTimeMs: elapsed,
      env: data?.env,
      error: data?.status !== "ok" ? "Unexpected response" : undefined,
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    return {
      name: functionName,
      status: elapsed > 9000 ? "timeout" : "error",
      responseTimeMs: elapsed,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Validate all critical edge functions are deployed and responding.
 */
export async function validateAllEdgeFunctions(): Promise<EdgeFunctionHealth[]> {
  return Promise.all(EDGE_FUNCTIONS.map(checkEdgeFunctionHealth));
}
