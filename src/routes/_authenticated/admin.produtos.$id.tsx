import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/produtos/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = useParams({ from: "/_authenticated/admin/produtos/$id" });
  return <ProductForm productId={id} />;
}
