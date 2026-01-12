import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { OrdersSkeleton } from "@/components/skeletons/OrdersSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Download,
  Search,
  Eye,
  ArrowUpDown,
  Package,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { OrderStatus, MercadoLivreOrder } from "@/lib/mercadoLivreTypes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ITEMS_PER_PAGE = 10;

const ORDER_STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "paid", label: "Pago" },
  { value: "confirmed", label: "Confirmado" },
  { value: "payment_required", label: "Aguardando pagamento" },
  { value: "payment_in_process", label: "Pagamento em processo" },
  { value: "partially_paid", label: "Parcialmente pago" },
  { value: "cancelled", label: "Cancelado" },
  { value: "invalid", label: "Inválido" },
];

function getStatusBadge(status: string) {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    paid: { variant: "default", label: "Pago" },
    confirmed: { variant: "default", label: "Confirmado" },
    payment_required: { variant: "outline", label: "Aguardando pagamento" },
    payment_in_process: { variant: "secondary", label: "Em processamento" },
    partially_paid: { variant: "secondary", label: "Parcialmente pago" },
    cancelled: { variant: "destructive", label: "Cancelado" },
    invalid: { variant: "destructive", label: "Inválido" },
  };

  const config = statusConfig[status] || {
    variant: "outline" as const,
    label: status,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getShippingStatusBadge(status?: string) {
  if (!status) return null;

  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    pending: { variant: "outline", label: "Pendente" },
    handling: { variant: "secondary", label: "Em preparação" },
    ready_to_ship: { variant: "secondary", label: "Pronto para envio" },
    shipped: { variant: "default", label: "Enviado" },
    delivered: { variant: "default", label: "Entregue" },
    not_delivered: { variant: "destructive", label: "Não entregue" },
    cancelled: { variant: "destructive", label: "Cancelado" },
  };

  const config = statusConfig[status] || {
    variant: "outline" as const,
    label: status,
  };
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortField, setSortField] = useState<"date" | "value">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Calcula offset baseado na página atual (paginação server-side)
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // API do Mercado Livre só suporta ordenação por data
  // Quando ordenar por valor, usa ordenação por data na API e ordena client-side depois
  const apiSort =
    sortField === "date"
      ? sortDirection === "desc"
        ? "date_desc"
        : "date_asc"
      : "date_desc"; // Default para quando ordenar por valor

  const { data, isLoading, isError, error } = useOrders({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: ITEMS_PER_PAGE,
    offset: offset,
    sort: apiSort,
  });

  const totalOrders = data?.orders?.paging?.total || 0;
  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  // Filtra e ordena localmente (busca e ordenação por valor são apenas client-side)
  const filteredOrders = useMemo(() => {
    const orders = data?.orders?.results || [];
    let result = [...orders];

    // Busca local
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((order) => {
        const orderId = order.id.toString();
        const buyerName = `${order.buyer.first_name || ""} ${
          order.buyer.last_name || ""
        }`.toLowerCase();
        const buyerNickname = order.buyer.nickname?.toLowerCase() || "";
        const productTitles = order.order_items
          .map((item) => item.item.title.toLowerCase())
          .join(" ");

        return (
          orderId.includes(query) ||
          buyerName.includes(query) ||
          buyerNickname.includes(query) ||
          productTitles.includes(query)
        );
      });
    }

    // Ordenação por valor (client-side apenas, já que API só suporta por data)
    if (sortField === "value") {
      result.sort((a, b) => {
        return sortDirection === "asc"
          ? a.total_amount - b.total_amount
          : b.total_amount - a.total_amount;
      });
    }

    return result;
  }, [data?.orders?.results, searchQuery, sortField, sortDirection]);

  const handleSort = (field: "date" | "value") => {
    // Reset para primeira página ao mudar ordenação
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleExport = () => {
    // Exporta apenas os pedidos da página atual (já que busca completa requeriria múltiplas requisições)
    const csvContent = [
      ["ID", "Data", "Cliente", "Produtos", "Valor", "Status", "Envio"].join(
        ","
      ),
      ...filteredOrders.map((order) =>
        [
          order.id,
          formatDate(order.date_created),
          `"${order.buyer.first_name || ""} ${
            order.buyer.last_name || order.buyer.nickname
          }"`,
          `"${order.order_items.map((i) => i.item.title).join("; ")}"`,
          order.total_amount,
          order.status,
          order.shipping?.status || "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Pedidos</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar pedidos</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Não foi possível carregar os pedidos. Verifique se a integração com o Mercado Livre está configurada corretamente."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Pedidos</h1>
            <p className="text-sm text-muted-foreground">
              {totalOrders} pedido
              {totalOrders !== 1 ? "s" : ""} total
              {searchQuery && ` (${filteredOrders.length} nesta página)`}
            </p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, cliente ou produto..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as OrderStatus | "all");
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery || statusFilter !== "all"
              ? "Tente ajustar os filtros de busca"
              : "Os pedidos do Mercado Livre aparecerão aqui"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    Data
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Produtos</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center gap-1">
                    Valor
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Envio</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    #{order.id}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(order.date_created)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.buyer.first_name
                          ? `${order.buyer.first_name} ${
                              order.buyer.last_name || ""
                            }`
                          : order.buyer.nickname}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{order.buyer.nickname}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px]">
                    <div className="truncate text-sm">
                      {order.order_items
                        .map((item) => item.item.title)
                        .join(", ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.order_items.length} item
                      {order.order_items.length !== 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {getShippingStatusBadge(order.shipping?.status)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/pedidos/${order.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
