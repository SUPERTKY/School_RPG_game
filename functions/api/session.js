const sessionKey = "current";
const validSubjectKeys = new Set(["math", "japanese", "english", "science", "social"]);

const defaultSession = {
  hosted: false,
  selectedSubjectKey: "math",
};

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
    throw new Error("GAME_SESSION_KV_NOT_CONFIGURED");
  }

  const savedSession = await store.get(sessionKey, "json");
  return normalizeSession(savedSession);
};

export async function onRequestGet({ env }) {
  try {
    return json(await readSession(env));
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const store = getSessionStore(env);
  if (!store) {
    return json({ ok: false, error: "GAME_SESSION_KV_NOT_CONFIGURED" }, { status: 500 });
  }

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
  await store.put(sessionKey, JSON.stringify(nextSession));
  return json(nextSession);
}
