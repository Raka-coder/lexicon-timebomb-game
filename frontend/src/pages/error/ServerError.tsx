import { ErrorPage } from "./ErrorPage";

export function ServerError() {
  return (
    <ErrorPage
      code="500"
      title="Server Error"
      message="Server mengalami gangguan tak terduga. Tim teknis kami sedang menangani masalah ini."
      detail="ERR_INTERNAL_SERVER: Unexpected failure"
      actionLabel="Coba Lagi"
      onAction={() => window.location.reload()}
    />
  );
}
