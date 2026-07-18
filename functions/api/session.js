const sessionKey = "current";
const validSubjectKeys = new Set(["math", "japanese", "english", "science", "social"]);

const defaultSession = {
  hosted: false,
  selectedSubjectKey: "math",
};

let memorySession = defaultSession;

const json = (body, init = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...init.headers,
    },
  });

const getSessionStore = (env) => env.GAME_SESSION_KV ?? env.GAME_SESSION;

const normalizeSession = (session) => ({
  hosted: session?.hosted === true,
  selectedSubjectKey: validSubjectKeys.has(session?.selectedSubjectKey) ? session.selectedSubjectKey : "math",
});

const readSession = async (env) => {
  const store = getSessionStore(env);
  if (!store) {
    return memorySession;
  }

  const savedSession = await store.get(sessionKey, "json");
  return normalizeSession(savedSession);
};

export async function onRequestGet({ env }) {
  return json(await readSession(env));
}

export async function onRequestPost({ request, env }) {
  const store = getSessionStore(env);
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  }

  const expectedPassword = env.ADMIN_PASSWORD ?? "";
  if (!expectedPassword) {
    return json({ ok: false, error: "ADMIN_PASSWORD_NOT_CONFIGURED" }, { status: 500 });
  }

  if (payload?.adminPassword !== expectedPassword) {
    return json({ ok: false, error: "INVALID_PASSWORD" }, { status: 401 });
  }

  const nextSession = normalizeSession(payload);
  if (store) {
    await store.put(sessionKey, JSON.stringify(nextSession));
  } else {
    memorySession = nextSession;
  }
  return json(nextSession);
}
