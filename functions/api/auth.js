const getPassword = (env) => env.APP_PASSWORD ?? env.PASSWORD ?? env.ADMIN_PASSWORD ?? "";

export async function onRequestPost({ request, env }) {
  const expectedPassword = getPassword(env);

  if (!expectedPassword) {
    return Response.json({ ok: false, error: "PASSWORD_NOT_CONFIGURED" }, { status: 500 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  }

  if (payload?.password !== expectedPassword) {
    return Response.json({ ok: false, error: "INVALID_PASSWORD" }, { status: 401 });
  }

  return Response.json({ ok: true });
}
