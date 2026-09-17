import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserResponse } from "./user.type";

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Читаємо localStorage
    getUserFromStorage: (state) => {
      if (typeof window === "undefined") return;

      const saved = localStorage.getItem("edu_auth");
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved);
        state.user = parsed.user;
        state.isAuthenticated = true;
      } catch (e) {
        console.error("Invalid LS:", e);
      }
    },

    // Сетимо юзера в Redux + localStorage
    setUser: (state, action: PayloadAction<UserResponse>) => {
      const user = action.payload;

      state.user = user;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("edu_auth", JSON.stringify({ user }));
      }
    },

    // Видаляємо юзера
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("edu_auth");
      }
    },
  },
});

export const { setUser, clearUser, getUserFromStorage } = authSlice.actions;
export default authSlice.reducer;
