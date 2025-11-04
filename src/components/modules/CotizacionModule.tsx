import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { Customer, InvoiceItem } from "@/types/inventory";
import { formatCurrency } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2, Search, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const CotizacionModule = () => {
  const { articles, quotes, customers, addCustomer, createQuote, convertQuoteToInvoice } = useInventory();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'customer' | 'items'>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [validDays, setValidDays] = useState(15);
  
  // Customer form
  const [customerForm, setCustomerForm] = useState({
    name: '',
    nit: '',
    address: '',
    phone: '',
    email: '',
  });

  const handleAddCustomer = () => {
    if (!customerForm.name || !customerForm.nit) {
      toast({
        title: "Error",
        description: "Nombre y NIT son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const newCustomer = addCustomer(customerForm);
    setSelectedCustomer(newCustomer);
    setCustomerForm({ name: '', nit: '', address: '', phone: '', email: '' });
    setStep('items');
    
    toast({
      title: "Cliente agregado",
      description: "Cliente registrado exitosamente",
    });
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep('items');
  };

  const handleAddItem = () => {
    const article = articles.find(a => a.id === selectedArticle);
    if (!article) {
      toast({
        title: "Error",
        description: "Seleccione un artículo",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Cantidad no válida",
        variant: "destructive",
      });
      return;
    }

    const newItem: InvoiceItem = {
      articleId: article.id,
      articleCode: article.code,
      articleName: article.name,
      quantity,
      unitPrice: article.price,
      total: article.price * quantity,
    };

    setItems([...items, newItem]);
    setSelectedArticle('');
    setQuantity(1);
    setSearchTerm('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateQuote = () => {
    if (!selectedCustomer || items.length === 0) return;

    const quote = createQuote(selectedCustomer, items, validDays);
    
    toast({
      title: "Cotización creada",
      description: `Cotización ${quote.quoteNumber} generada exitosamente`,
    });

    // Reset form
    setSelectedCustomer(null);
    setItems([]);
    setStep('customer');
    setValidDays(15);
  };

  const handleConvertToInvoice = (quoteId: string) => {
    const invoice = convertQuoteToInvoice(quoteId);
    if (invoice) {
      toast({
        title: "Cotización convertida",
        description: `Se generó la factura ${invoice.invoiceNumber}`,
      });
    }
  };

  const filteredArticles = articles.filter(a =>
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-3xl font-bold text-foreground">Cotizaciones</h2>
          <p className="text-muted-foreground">Genera cotizaciones para tus clientes</p>
        </div>
      </div>

      {/* Create Quote Form */}
      <Card>
        <CardHeader>
          <CardTitle>Nueva Cotización</CardTitle>
          <CardDescription>
            {step === 'customer' && 'Paso 1: Seleccionar o crear cliente'}
            {step === 'items' && 'Paso 2: Agregar artículos'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'customer' && (
            <>
              {/* Customer Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-3">Nuevo Cliente</h3>
                </div>
                <div>
                  <Label>Nombre / Razón Social *</Label>
                  <Input
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <Label>NIT / Cédula *</Label>
                  <Input
                    value={customerForm.nit}
                    onChange={(e) => setCustomerForm({ ...customerForm, nit: e.target.value })}
                    placeholder="123456789-0"
                  />
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    placeholder="Dirección"
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="3001234567"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleAddCustomer} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Cliente y Continuar
                  </Button>
                </div>
              </div>

              {/* Existing Customers */}
              {customers.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">O seleccionar cliente existente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {customers.map((customer) => (
                        <Card key={customer.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => handleSelectCustomer(customer)}>
                          <CardContent className="p-4">
                            <p className="font-semibold">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">NIT: {customer.nit}</p>
                            {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'items' && selectedCustomer && (
            <>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Cliente</h3>
                <p>{selectedCustomer.name} - NIT: {selectedCustomer.nit}</p>
                <Button variant="outline" size="sm" onClick={() => setStep('customer')} className="mt-2">
                  Cambiar Cliente
                </Button>
              </div>

              <div>
                <Label>Validez de la cotización (días)</Label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value) || 15)}
                />
              </div>

              <Separator />

              {/* Add Items */}
              <div className="space-y-4">
                <h3 className="font-semibold">Agregar Artículos</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <Label>Buscar Artículo</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Código o nombre..."
                        className="pl-9"
                      />
                    </div>
                    {searchTerm && (
                      <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
                        {filteredArticles.map((article) => (
                          <div
                            key={article.id}
                            className="p-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              setSelectedArticle(article.id);
                              setSearchTerm(`${article.code} - ${article.name}`);
                            }}
                          >
                            <p className="font-medium">{article.code} - {article.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(article.price)} | Stock: {article.units}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="md:col-span-3 flex items-end">
                    <Button onClick={handleAddItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <>
                  <Separator />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Artículo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.articleCode}</TableCell>
                          <TableCell>{item.articleName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IVA (19%):</span>
                        <span className="font-semibold">{formatCurrency(iva)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleCreateQuote} className="w-full" size="lg">
                    <FileText className="w-4 h-4 mr-2" />
                    Crear Cotización
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle>Cotizaciones Generadas</CardTitle>
          <CardDescription>Historial de cotizaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Válida hasta</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay cotizaciones generadas
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono font-semibold">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.customer.name}</TableCell>
                    <TableCell>{new Date(quote.createdAt).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>{new Date(quote.validUntil).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(quote.total)}</TableCell>
                    <TableCell>
                      {quote.status === 'active' && <Badge>Activa</Badge>}
                      {quote.status === 'converted' && <Badge variant="secondary">Convertida</Badge>}
                      {quote.status === 'expired' && <Badge variant="outline">Expirada</Badge>}
                    </TableCell>
                    <TableCell>
                      {quote.status === 'active' && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToInvoice(quote.id)}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Convertir a Factura
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CotizacionModule;
