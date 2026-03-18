const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://mk-backend-a6c7.onrender.com/api";

export async function toggleWishlist(productId: string) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE}/users/wishlist/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to update wishlist");
  }

  return data;
}
