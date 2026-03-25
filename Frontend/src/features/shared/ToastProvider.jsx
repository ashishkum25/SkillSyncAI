import { Toaster } from "react-hot-toast"

/**
 * @description Renders the react-hot-toast container with a consistent dark style.
 * Place this once near the root of the app.
 */
export const ToastProvider = () => {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: "#1e2433",
                    color: "#e2e8f0",
                    border: "1px solid #2d3748",
                    borderRadius: "10px",
                    fontSize: "0.875rem",
                    fontFamily: "Inter, sans-serif",
                },
                success: {
                    iconTheme: { primary: "#48bb78", secondary: "#1e2433" },
                },
                error: {
                    iconTheme: { primary: "#fc8181", secondary: "#1e2433" },
                    duration: 5000,
                },
            }}
        />
    )
}
