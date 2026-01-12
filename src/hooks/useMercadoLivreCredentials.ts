import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface MercadoLivreCredentials {
  id: string;
  client_id: string;
  redirect_uri: string;
  is_active: boolean;
  oauth_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useMercadoLivreCredentials() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<MercadoLivreCredentials | null>({
    queryKey: ["mercadoLivreCredentials"],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/mercadolibre/credentials`
      );
      return response.data;
    },
  });

  const saveCredentialsMutation = useMutation({
    mutationFn: async (credentials: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    }) => {
      const response = await axios.post(
        `${API_URL}/api/mercadolibre/credentials`,
        credentials
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mercadoLivreCredentials"] });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (authorizationCode: string) => {
      const response = await axios.post(
        `${API_URL}/api/mercadolibre/test-connection`,
        { authorizationCode }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mercadoLivreCredentials"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const response = await axios.patch(
        `${API_URL}/api/mercadolibre/credentials/active`,
        { isActive }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mercadoLivreCredentials"] });
    },
  });

  return {
    credentials: data,
    isLoading,
    error,
    saveCredentials: saveCredentialsMutation.mutateAsync,
    testConnection: testConnectionMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    isSaving: saveCredentialsMutation.isPending,
    isTesting: testConnectionMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
  };
}
