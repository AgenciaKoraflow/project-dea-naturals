import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  RefreshCw,
  Download,
  Copy,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  useMercadoLivreSites,
  useMercadoLivreSite,
  useMercadoLivreSearch,
  useMercadoLivreCategories,
} from "@/hooks/useMercadoLivre";
import { useToast } from "@/hooks/use-toast";

type ViewType = "sites" | "site" | "search" | "categories";

export default function MercadoLivre() {
  const [viewType, setViewType] = useState<ViewType>("sites");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("MLB");
  const [searchQuery, setSearchQuery] = useState<string>("notebook");
  const [searchLimit, setSearchLimit] = useState<number>(10);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Queries
  const {
    data: sites,
    isLoading: sitesLoading,
    error: sitesError,
    refetch: refetchSites,
  } = useMercadoLivreSites();
  const {
    data: siteData,
    isLoading: siteLoading,
    error: siteError,
    refetch: refetchSite,
  } = useMercadoLivreSite(selectedSiteId);
  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
    refetch: refetchSearch,
  } = useMercadoLivreSearch(
    searchQuery,
    selectedSiteId,
    searchLimit,
    viewType === "search"
  );
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useMercadoLivreCategories(selectedSiteId);

  // Determinar qual dado exibir
  const getJsonData = () => {
    switch (viewType) {
      case "sites":
        return sites;
      case "site":
        return siteData;
      case "search":
        return searchData;
      case "categories":
        return categories;
      default:
        return null;
    }
  };

  const getLoadingState = () => {
    switch (viewType) {
      case "sites":
        return sitesLoading;
      case "site":
        return siteLoading;
      case "search":
        return searchLoading;
      case "categories":
        return categoriesLoading;
      default:
        return false;
    }
  };

  const getErrorState = () => {
    switch (viewType) {
      case "sites":
        return sitesError;
      case "site":
        return siteError;
      case "search":
        return searchError;
      case "categories":
        return categoriesError;
      default:
        return null;
    }
  };

  const handleRefetch = () => {
    switch (viewType) {
      case "sites":
        refetchSites();
        break;
      case "site":
        refetchSite();
        break;
      case "search":
        refetchSearch();
        break;
      case "categories":
        refetchCategories();
        break;
    }
  };

  const copyToClipboard = () => {
    const jsonData = getJsonData();
    if (jsonData) {
      navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "JSON copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadJson = () => {
    const jsonData = getJsonData();
    if (jsonData) {
      const dataStr = JSON.stringify(jsonData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `mercado-livre-${viewType}-${Date.now()}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Download iniciado!",
        description: `Arquivo ${exportFileDefaultName} será baixado`,
      });
    }
  };

  const jsonData = getJsonData();
  const isLoading = getLoadingState();
  const error = getErrorState();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mercado Livre API
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize os dados da API do Mercado Livre em formato JSON
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefetch}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
          {jsonData && (
            <>
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={copied}
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copiar JSON
              </Button>
              <Button variant="outline" onClick={downloadJson}>
                <Download className="h-4 w-4 mr-2" />
                Baixar JSON
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs
        value={viewType}
        onValueChange={(value) => setViewType(value as ViewType)}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="site">Site Específico</TabsTrigger>
          <TabsTrigger value="search">Buscar Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sites Disponíveis</CardTitle>
              <CardDescription>
                Lista de todos os sites disponíveis no Mercado Livre
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {error instanceof Error
                      ? error.message
                      : "Erro ao carregar dados"}
                  </AlertDescription>
                </Alert>
              )}
              {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {jsonData && (
                <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(jsonData, null, 2)}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Site</CardTitle>
              <CardDescription>
                Visualize informações detalhadas de um site específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-select">Selecione o Site</Label>
                <Select
                  value={selectedSiteId}
                  onValueChange={setSelectedSiteId}
                >
                  <SelectTrigger id="site-select">
                    <SelectValue placeholder="Selecione um site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.slice(0, 10).map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} ({site.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Códigos comuns: MLB (Brasil), MLA (Argentina), MLM (México),
                  MCO (Colômbia)
                </p>
              </div>
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {error instanceof Error
                      ? error.message
                      : "Erro ao carregar dados"}
                  </AlertDescription>
                </Alert>
              )}
              {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {jsonData && (
                <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(jsonData, null, 2)}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Produtos</CardTitle>
              <CardDescription>
                Busque produtos no Mercado Livre e visualize os resultados em
                JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-query">Termo de Busca</Label>
                  <Input
                    id="search-query"
                    placeholder="Ex: notebook, celular..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-site">Site</Label>
                  <Select
                    value={selectedSiteId}
                    onValueChange={setSelectedSiteId}
                  >
                    <SelectTrigger id="search-site">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sites?.slice(0, 10).map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name} ({site.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-limit">Limite de Resultados</Label>
                  <Input
                    id="search-limit"
                    type="number"
                    min="1"
                    max="50"
                    value={searchLimit}
                    onChange={(e) => setSearchLimit(Number(e.target.value))}
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {error instanceof Error
                      ? error.message
                      : "Erro ao carregar dados"}
                  </AlertDescription>
                </Alert>
              )}
              {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {jsonData && (
                <>
                  {viewType === "search" && searchData && (
                    <Alert>
                      <AlertTitle>Resultados encontrados</AlertTitle>
                      <AlertDescription>
                        Total de resultados: {searchData.paging?.total || 0} |
                        Exibindo: {searchData.results?.length || 0}
                      </AlertDescription>
                    </Alert>
                  )}
                  <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify(jsonData, null, 2)}
                    </pre>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorias do Site</CardTitle>
              <CardDescription>
                Visualize todas as categorias disponíveis em um site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categories-site">Selecione o Site</Label>
                <Select
                  value={selectedSiteId}
                  onValueChange={setSelectedSiteId}
                >
                  <SelectTrigger id="categories-site">
                    <SelectValue placeholder="Selecione um site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.slice(0, 10).map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} ({site.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {error instanceof Error
                      ? error.message
                      : "Erro ao carregar dados"}
                  </AlertDescription>
                </Alert>
              )}
              {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {jsonData && (
                <>
                  {Array.isArray(jsonData) && (
                    <Alert>
                      <AlertTitle>Categorias encontradas</AlertTitle>
                      <AlertDescription>
                        Total de categorias: {jsonData.length}
                      </AlertDescription>
                    </Alert>
                  )}
                  <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify(jsonData, null, 2)}
                    </pre>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
