import { ErrorPage } from "./ErrorPage";

export function Maintenance() {
  return (
    <ErrorPage
      code="503"
      title="Sedang Dalam Perawatan"
      message="Server sedang dalam pemeliharaan. Tunggu beberapa saat dan coba lagi nanti."
      detail="ERR_SERVICE_UNAVAILABLE: Maintenance window active"
      actionLabel="Coba Lagi"
      onAction={() => window.location.reload()}
    />
  );
}
