// Helper function to get marketplace name by ID
export function getMarketplaceName(marketplaces: { id: string; name: string }[] | undefined, id: string): string {
  if (!marketplaces) return 'Carregando...';
  const marketplace = marketplaces.find(m => m.id === id);
  return marketplace?.name || 'Desconhecido';
}
