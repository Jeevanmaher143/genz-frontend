import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { MessagesProvider } from "./context/MessagesContext";
import { SavedProvider } from "./context/SavedContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <MessagesProvider>
              <SavedProvider>
                <App />
                <Toaster
                  position="top-center"
                  gutter={10}
                  toastOptions={{
                    duration: 2600,
                    // base card — clean dark pill with subtle border & shadow
                    style: {
                      background: "#1c1c1e",
                      color: "#f5f5f5",
                      border: "1px solid #363636",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      fontSize: "14px",
                      fontWeight: 500,
                      maxWidth: "360px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                    },
                    success: {
                      iconTheme: { primary: "#22c55e", secondary: "#1c1c1e" },
                      style: { borderColor: "rgba(34,197,94,0.4)" },
                    },
                    error: {
                      iconTheme: { primary: "#ef4444", secondary: "#1c1c1e" },
                      style: { borderColor: "rgba(239,68,68,0.4)" },
                    },
                  }}
                />
              </SavedProvider>
            </MessagesProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
