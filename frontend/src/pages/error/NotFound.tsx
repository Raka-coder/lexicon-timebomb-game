import { SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorPage } from "./ErrorPage";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      code="404"
      title="Terminal Tidak Ditemukan"
      message="Alamat yang kamu tuju tidak ada dalam jaringan. Mungkin koneksi ini sudah kedaluwarsa atau tidak pernah ada."
      detail="ERR_NOT_FOUND: Route undefined"
      actionLabel="Kembali ke Beranda"
      onAction={() => navigate("/")}
    >
      <div className="flex items-center gap-2 text-destructive/60 font-mono text-[10px] uppercase tracking-widest">
        <SearchX className="h-3 w-3" />
        Tidak ditemukan
      </div>
    </ErrorPage>
  );
}
