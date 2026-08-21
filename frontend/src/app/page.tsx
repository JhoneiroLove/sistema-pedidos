import { redirect } from "next/navigation";

import { getSession } from "@/shared/lib/session";

export default async function Home() {
  redirect((await getSession()) ? "/pedidos" : "/login");
}
