// lib/auth.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: string
) {
  const supabase = createServerActionClient({ cookies });

  // 1️⃣ Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // 2️⃣ Insert / update profile safely
  if (data?.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: fullName,
          role,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      throw new Error(profileError.message);
    }
  }

  // 3️⃣ Return created user
  return data.user;
}
