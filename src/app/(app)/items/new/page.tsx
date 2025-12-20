import { redirect } from "next/navigation";

export default function NewItemRedirectPage() {
  redirect("/items/add");
}
