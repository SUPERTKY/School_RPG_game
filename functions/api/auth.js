const passwordVariableByMode = {
  startup: "PASSWORD",
  admin: "ADMIN_PASSWORD",
};

const getPasswordVariableName = (mode) => passwordVariableByMode[mode] ?? null;

const json = (body, init = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...init.headers,
    },
  });

const getPasswordDiagnostic = (value) => {
  const password = typeof value === "string" ? value : "";
  return {
    configured: password.length > 0,
    length: password.length,
    startsWithWhitespace: /^\s/.test(password),
    endsWithWhitespace: /\s$/.test(password),
    containsWhitespace: /\s/.test(password),
  };
};

const getAuthDiagnostics = (env = {}) => ({
  ok: true,
  variables: Object.fromEntries(
    Object.entries(passwordVariableByMode).map(([mode, variableName]) => [
      variableName,
      {
        mode,
        ...getPasswordDiagnostic(env[variableName]),
      },
    ]),
  ),
});

export async function onRequestGet({ env }) {
  return json(getAuthDiagnostics(env));
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  }

  const passwordVariableName = getPasswordVariableName(payload?.mode);
  if (!passwordVariableName) {
    return json({ ok: false, error: "INVALID_AUTH_MODE" }, { status: 400 });
  }

  const expectedPassword = env[passwordVariableName] ?? "";
  if (!expectedPassword) {
    return json({ ok: false, error: `${passwordVariableName}_NOT_CONFIGURED` }, { status: 500 });
  }

  const passwordMatches = payload?.password === expectedPassword;
  if (payload?.debug === true) {
    return json(
      {
        ok: passwordMatches,
        mode: payload.mode,
        variableName: passwordVariableName,
        error: passwordMatches ? null : "INVALID_PASSWORD",
        input: getPasswordDiagnostic(payload?.password),
        expected: getPasswordDiagnostic(expectedPassword),
      },
      { status: passwordMatches ? 200 : 401 },
    );
  }

  if (!passwordMatches) {
    return json({ ok: false, error: "INVALID_PASSWORD" }, { status: 401 });
  }

  return json({ ok: true });
}
