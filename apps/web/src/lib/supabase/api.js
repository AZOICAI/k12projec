import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { LOCAL_AUTH_COOKIE } from "@/lib/dev-auth";

function getLocalDevUserFromRequest(request) {
  const rawUsername = request.cookies.get(LOCAL_AUTH_COOKIE)?.value;
  if (!rawUsername) return null;

  const username = decodeURIComponent(rawUsername);
  if (!username) return null;

  return {
    id: username,
    email: `${username}@local.k12planner`,
    user_metadata: {
      full_name: username,
      username,
    },
    app_metadata: {},
  };
}

function getLocalDevStore() {
  if (!globalThis.__k12_local_dev_store__) {
    globalThis.__k12_local_dev_store__ = {};
  }
  return globalThis.__k12_local_dev_store__;
}

function cloneRows(rows) {
  return JSON.parse(JSON.stringify(rows));
}

function createLocalQuery(tableName, userId) {
  const state = getLocalDevStore();
  const userStore = state[userId] ?? (state[userId] = {});
  const rows = userStore[tableName] ?? (userStore[tableName] = []);

  const query = {
    filters: [],
    orderBy: null,
    selectColumns: "*",
    operation: "select",
    payload: null,

    then(resolve, reject) {
      return Promise.resolve(this.execute()).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve(this.execute()).catch(reject);
    },
    finally(onFinally) {
      return Promise.resolve(this.execute()).finally(onFinally);
    },

    eq(field, value) {
      this.filters.push(["eq", field, value]);
      return this;
    },
    gte(field, value) {
      this.filters.push(["gte", field, value]);
      return this;
    },
    lte(field, value) {
      this.filters.push(["lte", field, value]);
      return this;
    },
    select(columns) {
      this.selectColumns = columns;
      return this;
    },
    order(field, options = {}) {
      this.orderBy = { field, ascending: options.ascending !== false };
      return this;
    },
    insert(data) {
      this.operation = "insert";
      this.payload = data;
      return this;
    },
    update(data) {
      this.operation = "update";
      this.payload = data;
      return this;
    },
    delete() {
      this.operation = "delete";
      return this;
    },
    single() {
      return Promise.resolve(this.execute()).then((result) => {
        if (result.error) return result;

        if (Array.isArray(result.data)) {
          return { data: result.data[0] ?? null, error: result.data.length ? null : { message: "Not found" } };
        }

        return { data: result.data ?? null, error: null };
      });
    },
    execute() {
      let data = cloneRows(rows);

      if (this.operation === "insert") {
        const item = {
          ...this.payload,
          id: this.payload.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
          user_id: this.payload.user_id ?? userId,
        };
        rows.push(item);
        data = [item];
      } else if (this.operation === "update") {
        const next = rows.map((row) => {
          const matches = this.filters.every(([type, field, value]) => {
            if (type === "eq") return row[field] === value;
            if (type === "gte") return row[field] != null && row[field] >= value;
            if (type === "lte") return row[field] != null && row[field] <= value;
            return true;
          });
          return matches ? { ...row, ...this.payload } : row;
        });
        rows.splice(0, rows.length, ...next);
        data = cloneRows(rows);
      } else if (this.operation === "delete") {
        const remaining = rows.filter((row) => !this.filters.every(([type, field, value]) => {
          if (type === "eq") return row[field] === value;
          if (type === "gte") return row[field] != null && row[field] >= value;
          if (type === "lte") return row[field] != null && row[field] <= value;
          return true;
        }));
        rows.splice(0, rows.length, ...remaining);
        data = cloneRows(rows);
      }

      if (this.filters.length) {
        data = data.filter((row) => this.filters.every(([type, field, value]) => {
          if (type === "eq") return row[field] === value;
          if (type === "gte") return row[field] != null && row[field] >= value;
          if (type === "lte") return row[field] != null && row[field] <= value;
          return true;
        }));
      }

      if (this.orderBy) {
        data = [...data].sort((left, right) => {
          const leftValue = left[this.orderBy.field];
          const rightValue = right[this.orderBy.field];
          const leftNum = leftValue instanceof Date ? leftValue.getTime() : Number(new Date(leftValue));
          const rightNum = rightValue instanceof Date ? rightValue.getTime() : Number(new Date(rightValue));
          const compare = Number.isNaN(leftNum) || Number.isNaN(rightNum)
            ? String(leftValue ?? "").localeCompare(String(rightValue ?? ""))
            : leftNum - rightNum;
          return this.orderBy.ascending ? compare : -compare;
        });
      }

      if (this.operation === "select") {
        return { data, error: null };
      }

      return { data, error: null };
    },
  };

  return query;
}

function createLocalSupabaseClient(userId) {
  return {
    auth: {
      async getUser() {
        return {
          data: {
            user: {
              id: userId,
              email: `${userId}@local.k12planner`,
              user_metadata: { full_name: userId, username: userId },
              app_metadata: {},
            },
          },
          error: null,
        };
      },
    },
    from(tableName) {
      return createLocalQuery(tableName, userId);
    },
  };
}

export async function getSupabaseForApi(request) {
  const localUser = getLocalDevUserFromRequest(request);
  if (localUser) {
    return createLocalSupabaseClient(localUser.id);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // ignore
        }
      },
    },
  });
}

export async function requireUser(request) {
  const localUser = getLocalDevUserFromRequest(request);
  if (localUser) {
    return { user: localUser, supabase: createLocalSupabaseClient(localUser.id) };
  }

  const supabase = await getSupabaseForApi(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, supabase: null };
  }
  return { user, supabase };
}
