import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Spinner from "./components/Spinner";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Reels from "./pages/Reels";

// Redirect logged-in users away from auth pages
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

      {/* protected (with navbar layout) */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Navigate to="/explore" replace />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/reels" element={<Reels />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/post/:id" element={<PostDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
