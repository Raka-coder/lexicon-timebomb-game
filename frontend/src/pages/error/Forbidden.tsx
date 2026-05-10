import { useNavigate } from "react-router-dom";
import { ErrorPage } from "./ErrorPage";

export function Forbidden() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      code="403"
      title="Akses Ditolak"
      message="Kamu tidak memiliki izin untuk mengakses area ini. Level aksesmu tidak mencukupi untuk masuk ke ruangan tersebut."
      detail="ERR_ACCESS_DENIED: Insufficient privileges"
      actionLabel="Kembali ke Beranda"
      onAction={() => navigate("/")}
    />
  );
}
