export type Seller = {
  id: string;
  name: string;
  bankName: string;
  accountNo: string;
  holder: string;
};

export type Product = {
  id: string;
  sellerId: string;
  name: string;
  price: number;
  active: boolean;
  sort: number;

  // optinal
  category?: string;
  genre?: string;
  couple?: string;
  page?: number;
  description?: string;
  imageUrl?: string;
  stock?: number;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  return res.json();
}

export async function getSeller(sellerSlug: string): Promise<Seller | null> {
  const sellers = await fetchJson<Seller[]>("/data/sellers.json");
  console.log("sellerSlug:", sellerSlug);
  console.log(
    "seller ids:",
    sellers.map((s) => s.id ?? s.id),
  );

  return sellers.find((seller) => seller.id === sellerSlug) || null;
}

export async function getProductsBySeller(
  sellerId: string,
): Promise<Product[]> {
  const products = await fetchJson<Product[]>("/data/products.json");
  return products
    .filter((p) => p.sellerId === sellerId && p.active)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}
