import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-text)',
              border: '1px solid var(--toast-border)',
            },
            success: {
              style: {
                background: 'var(--toast-success-bg)',
                color: 'var(--toast-success-text)',
                border: '1px solid var(--toast-success-border)',
              },
            },
            error: {
              style: {
                background: 'var(--toast-error-bg)',
                color: 'var(--toast-error-text)',
                border: '1px solid var(--toast-error-border)',
              },
            },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
