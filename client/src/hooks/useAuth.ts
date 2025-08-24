import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const logout = async () => {
    try {
      // Clear the token from localStorage
      localStorage.removeItem('authToken');
      
      // Call the server logout endpoint
      await apiRequest("POST", "/api/auth/signout");
      
      // Invalidate all queries to clear cached data
      queryClient.clear();
    } catch (error) {
      // Even if server call fails, clear local data
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refetch,
  };
}