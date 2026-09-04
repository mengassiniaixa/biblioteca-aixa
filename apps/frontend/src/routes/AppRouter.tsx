import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "../components/AppShell/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { BooksPage } from "./pages/BooksPage";
import { OverduePage } from "./pages/OverduePage";
import { MyLibraryPage } from "./pages/MyLibraryPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <AppShell />,
    children: [
      { path: "/books", element: <BooksPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: "/", element: <HomePage /> }],
      },
      {
        element: <ProtectedRoute roles={["LIBRARIAN", "ADMIN"]} />,
        children: [{ path: "/overdue", element: <OverduePage /> }],
      },
      {
        element: <ProtectedRoute roles={["MEMBER"]} />,
        children: [{ path: "/my-library", element: <MyLibraryPage /> }],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
