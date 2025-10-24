import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  const access = (await cookies()).get("access")?.value;
  redirect(access ? "/home" : "/login");
}
