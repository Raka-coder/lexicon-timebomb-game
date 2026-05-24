import { Toaster as Sonner } from "sonner";

export function CustomToaster() {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "",
        },
      }}
      style={
        {
          "--toast-width": "auto",
        } as React.CSSProperties
      }
    />
  );
}
