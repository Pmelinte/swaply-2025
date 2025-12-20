import { redirect } from "next/navigation";

export default function AddRedirectPage() {
  redirect("/items/add");
}
