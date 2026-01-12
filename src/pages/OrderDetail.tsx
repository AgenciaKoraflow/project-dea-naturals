import { useParams, Link } from "react-router-dom";
import { useOrder } from "@/hooks/useOrders";
import { OrderDetailSkeleton } from "@/components/skeletons/OrderDetailSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChevronLeft,
  User,
  MapPin,
  Package,
  CreditCard,
  Truck,
  AlertCircle,
  Calendar,
  Hash,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    paid: { variant: "default", label: "Pago" },
    confirmed: { variant: "default", label: "Confirmado" },
    payment_required: { variant: "outline", label: "Aguardando pagamento" },
    payment_in_process: { variant: "secondary", label: "Em processamento" },
    partially_paid: { variant: "secondary", label: "Parcialmente pago" },
    cancelled: { variant: "destructive", label: "Cancelado" },
    invalid: { variant: "destructive", label: "Inválido" },
  };

  const config = statusConfig[status] || { variant: "outline" as const, label: status };
  return <Badge variant={config.variant} className="text-sm">{config.label}</Badge>;
}

function getShippingStatusBadge(status?: string) {
  if (!status) return null;
  
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending: { variant: "outline", label: "Pendente" },
    handling: { variant: "secondary", label: "Em preparação" },
    ready_to_ship: { variant: "secondary", label: "Pronto para envio" },
    shipped: { variant: "default", label: "Enviado" },
    delivered: { variant: "default", label: "Entregue" },
    not_delivered: { variant: "destructive", label: "Não entregue" },
    cancelled: { variant: "destructive", label: "Cancelado" },
  };

  const config = statusConfig[status] || { variant: "outline" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useOrder(id || "");

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !data?.orders?.results?.[0]) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="gap-2 mb-4">
          <Link to="/pedidos">
            <ChevronLeft className="h-4 w-4" />
            Voltar para Pedidos
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar pedido</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Pedido não encontrado."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const order = data.orders.results[0];
  const shipping = order.shipping;
  const receiverAddress = shipping?.receiver_address;

  const subtotal = order.order_items.reduce(
    (acc, item) => acc + item.unit_price * item.quantity,
    0
  );
  const shippingCost = order.payments?.[0]?.shipping_cost || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button variant="ghost" asChild className="gap-2 -ml-3">
        <Link to="/pedidos">
          <ChevronLeft className="h-4 w-4" />
          Voltar para Pedidos
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Pedido #{order.id}</h1>
            {getStatusBadge(order.status)}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(order.date_created)}
            </span>
            {order.pack_id && (
              <span className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Pack: {order.pack_id}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-2">{item.item.title}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        ID: {item.item.id}
                      </span>
                      {item.item.variation_attributes?.map((attr) => (
                        <Badge key={attr.id} variant="outline" className="text-xs">
                          {attr.name}: {attr.value_name}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.unit_price)} cada
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping */}
          {shipping && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5" />
                    Envio
                  </CardTitle>
                  {getShippingStatusBadge(shipping.status)}
                </div>
              </CardHeader>
              <CardContent>
                {receiverAddress ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{receiverAddress.receiver_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {receiverAddress.street_name}, {receiverAddress.street_number}
                          {receiverAddress.comment && ` - ${receiverAddress.comment}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {receiverAddress.neighborhood?.name && `${receiverAddress.neighborhood.name}, `}
                          {receiverAddress.city?.name} - {receiverAddress.state?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          CEP: {receiverAddress.zip_code}
                        </p>
                        {receiverAddress.receiver_phone && (
                          <p className="text-sm text-muted-foreground">
                            Tel: {receiverAddress.receiver_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Informações de envio não disponíveis
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Buyer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Comprador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {order.buyer.first_name
                    ? `${order.buyer.first_name} ${order.buyer.last_name || ""}`
                    : order.buyer.nickname}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{order.buyer.nickname}
                </p>
                {order.buyer.email && (
                  <p className="text-sm text-muted-foreground">
                    {order.buyer.email}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Resumo do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(order.total_amount)}</span>
              </div>
              {order.payments && order.payments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium">Método de pagamento</p>
                    {order.payments.map((payment) => (
                      <div key={payment.id} className="text-sm text-muted-foreground">
                        <p className="capitalize">
                          {payment.payment_method_id.replace(/_/g, " ")}
                        </p>
                        {payment.installments > 1 && (
                          <p>{payment.installments}x de {formatCurrency(payment.installment_amount || payment.transaction_amount / payment.installments)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
