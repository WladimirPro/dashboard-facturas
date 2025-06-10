"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebaseConfig"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { logoutUser } from "@/lib/authFunctions"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Bell,
  FileText,
  LogOut,
  Search,
  Radio,
  Antenna,
  Cable,
  Router,
  Smartphone,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SettingsDialog } from "@/components/settings-dialog"

interface Factura {
  id: string
  concepto: string
  fechaVencimiento: string
  fechaPago?: string
  monto: number
  estado: string
  categoria: string
  clienteNombre: string
}

interface Cliente {
  id: string
  nombre: string
  email: string
  telefono: string
  tipo: string
  facturas: Factura[]
}

const calcularEstadoDinamico = (factura: Factura): string => {
  if (factura.estado === "pagado") return "pagado"
  const hoy = new Date()
  const vencimiento = new Date(factura.fechaVencimiento)
  return hoy > vencimiento ? "vencido" : "por_vencer"
}

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [currentClient, setCurrentClient] = useState<any>(null)
  const [currentInvoice, setCurrentInvoice] = useState<any>(null)
  const [showFacturaModal, setShowFacturaModal] = useState(false)
  const [facturaClienteId, setFacturaClienteId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [guardandoFactura, setGuardandoFactura] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationChannels, setNotificationChannels] = useState({
    email: true,
    sms: false,
    whatsapp: false,
  })
  const [nuevaFactura, setNuevaFactura] = useState<Omit<Factura, "id">>({
  concepto: "",
  monto: 0,
  fechaVencimiento: "",
  estado: "por_vencer",
  categoria: "Fibra Óptica",
  clienteNombre: "", // 👈 Nuevo
  }); 
  const [facturaEditando, setFacturaEditando] = useState<Factura | null>(null)
  const [activeFilter, setActiveFilter] = useState("todos")
  const router = useRouter()

  const obtenerNombreCliente = (id: string): string => {
  const cliente = clientes.find((c) => c.id === id)
  return cliente?.nombre || ""
  } 

  useEffect(() => {
  if (facturaClienteId && !facturaEditando) {
      const nombre = obtenerNombreCliente(facturaClienteId)
      setNuevaFactura((prev) => ({
        ...prev,
        clienteNombre: nombre,
      }))
    }
  }, [facturaClienteId, facturaEditando])

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.push("/")
    } else {
      const snapshot = await getDocs(collection(db, "clientes"))
      const clientesData: Cliente[] = []

      for (const docSnap of snapshot.docs) {
        const clienteData = docSnap.data() as Omit<Cliente, "id">
        const clienteId = docSnap.id
        const facturas = clienteData.facturas ?? []

        let facturasActualizadas = false
        const nuevasFacturas = facturas.map((factura) => {
          const estadoCalculado = calcularEstadoDinamico(factura)
          if (factura.estado !== estadoCalculado) {
            facturasActualizadas = true
            return { ...factura, estado: estadoCalculado }
          }
          return factura
        })

        if (facturasActualizadas) {
          const ref = doc(db, "clientes", clienteId)
          await updateDoc(ref, { facturas: nuevasFacturas })
        }

        clientesData.push({
          id: clienteId,
          ...clienteData,
          facturas: nuevasFacturas,
        })
      }

      setClientes(clientesData)
      setCheckingAuth(false)
    }
  })

  return () => unsubscribe()
}, [router])

if (checkingAuth) {
  return <div className="p-6">Verificando autenticación...</div>
}

  const handleLogout = async () => {
  await logoutUser();
  router.push("/");
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pagado":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pagado
          </Badge>
        )
      case "por_vencer":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            Por Vencer
          </Badge>
        )
      case "vencido":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Vencido
          </Badge>
        )
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    const colors = {
      Distribuidor:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
      Operador:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
      Integrador:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
      ISP: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    }
    return <Badge className={colors[tipo as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{tipo}</Badge>
  }

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case "Fibra Óptica":
        return <Cable className="w-4 h-4" />
      case "Antenas y RF":
        return <Antenna className="w-4 h-4" />
      case "Equipos de Red":
        return <Router className="w-4 h-4" />
      case "Equipos de Transmisión":
        return <Radio className="w-4 h-4" />
      default:
        return <Smartphone className="w-4 h-4" />
    }
  }

  const enviarNotificacion = (cliente: any, factura: any) => {
    setCurrentClient(cliente)
    setCurrentInvoice(factura)
    setNotificationMessage(
      `Estimados ${cliente.nombre},\n\nLes recordamos que su factura "${factura.concepto}" por $${factura.monto.toLocaleString()} tiene vencimiento el ${factura.fechaVencimiento}.\n\nPor favor, procedan con el pago para evitar interrupciones en el suministro de insumos de telecomunicaciones.\n\nSaludos cordiales,\nEquipo de Facturación - TelecomSupply`,
    )
    setNotificationOpen(true)
  }

  const handleSendNotification = () => {
    const channels = []
    if (notificationChannels.email) channels.push("Email")
    if (notificationChannels.sms) channels.push("SMS")
    if (notificationChannels.whatsapp) channels.push("WhatsApp")

    alert(`Notificación enviada a ${currentClient.nombre} por ${channels.join(", ")}:\n\n${notificationMessage}`)
    setNotificationOpen(false)
  }

  const agregarFactura = async (clienteId: string, factura: Factura) => {
  const ref = doc(db, "clientes", clienteId)
  await updateDoc(ref, {
    facturas: arrayUnion(factura),
  })
}
const editarFactura = async (clienteId: string, facturaActualizada: Factura) => {
  const ref = doc(db, "clientes", clienteId)
  const cliente = clientes.find(c => c.id === clienteId)
  if (!cliente) return

  const nuevasFacturas = cliente.facturas.map(f =>
    f.id === facturaActualizada.id ? facturaActualizada : f
  )

  await updateDoc(ref, {
    facturas: nuevasFacturas,
  })

  setClientes(prev =>
    prev.map(c =>
      c.id === clienteId ? { ...c, facturas: nuevasFacturas } : c
    )
  )
}

const eliminarFactura = async (clienteId: string, facturaId: string) => {
  const ref = doc(db, "clientes", clienteId)
  const cliente = clientes.find((c) => c.id === clienteId)
  if (!cliente) return

  const nuevasFacturas = cliente.facturas.filter(f => f.id !== facturaId)

  await updateDoc(ref, {
    facturas: nuevasFacturas,
  })

  setClientes(prev =>
    prev.map(c =>
      c.id === clienteId ? { ...c, facturas: nuevasFacturas } : c
    )
  )
}


  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.tipo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredFacturas = (estado: string) => {
  return clientes.flatMap((cliente) =>
    cliente.facturas
      .filter((factura) => (estado === "todos" ? true : factura.estado === estado))
      .map((factura) => ({ cliente, factura }))
  )
}

const totalClientes = clientes.length
const allFacturas = clientes.flatMap((c) => c.facturas || [])

const facturasPagadas = allFacturas.filter((f) => f.estado === "pagado").length
const facturasPorVencer = allFacturas.filter((f) => f.estado === "por_vencer").length
const facturasVencidas = allFacturas.filter((f) => f.estado === "vencido").length
const montoTotal = allFacturas.reduce((sum, f) => sum + (f.monto || 0), 0)

const generarReporte = () => {
  const reporte = {
    fecha: new Date().toLocaleDateString(),
    empresa: "TelecomSupply - Insumos de Telecomunicaciones",
    totalClientes,
    facturasPagadas,
    facturasPorVencer,
    facturasVencidas,
    montoTotal,
    detalles: clientes.map((cliente) => ({
      nombre: cliente.nombre,
      tipo: cliente.tipo,
      email: cliente.email,
      facturas: cliente.facturas?.length ?? 0,
      montoTotal: (cliente.facturas ?? []).reduce((sum, f) => sum + (f.monto || 0), 0),
    })),
  }

  console.log("Reporte generado:", reporte)
  alert("Reporte de facturación generado exitosamente. Revisa la consola para ver los detalles.")
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-blue-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  TelecomSupply
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sistema de Gestión de Facturación</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SettingsDialog />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Clientes</CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allFacturas.length}</div>
              <p className="text-xs text-blue-200 mt-1">Registradas en el sistema</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Facturas Pagadas</CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{facturasPagadas}</div>
              <p className="text-xs text-emerald-200 mt-1">Al día</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Por Vencer</CardTitle>
              <Clock className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{facturasPorVencer}</div>
              <p className="text-xs text-amber-200 mt-1">Próximas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">Vencidas</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{facturasVencidas}</div>
              <p className="text-xs text-red-200 mt-1">Requieren atención</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Monto Total</CardTitle>
              <FileText className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(montoTotal || 0).toLocaleString()}</div>
              <p className="text-xs text-purple-200 mt-1">Facturación activa</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por empresa, email o tipo de cliente..."
              className="pl-10 h-12 border-blue-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={generarReporte}
            className="flex items-center gap-2 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <FileText className="w-4 h-4" />
            Generar Reporte
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="clientes" className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-blue-100 dark:border-gray-700 shadow-sm">
            <TabsTrigger value="clientes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Gestión de Clientes
            </TabsTrigger>
            <TabsTrigger value="facturas" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Estado de Facturas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clientes" className="space-y-6">
            <div className="grid gap-6">
              {filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
                  <Card
                    key={cliente.id}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-blue-100 dark:border-gray-700 shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl text-gray-800 dark:text-gray-200">{cliente.nombre}</CardTitle>
                            {getTipoBadge(cliente.tipo)}
                          </div>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            {cliente.email} • {cliente.telefono}
                          </CardDescription>
                          <Button
                            size="sm"
                            className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => {
                              setFacturaClienteId(cliente.id)
                              setShowFacturaModal(true)
                            }}
                          >
                            + Nueva Factura
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {cliente.facturas.map((factura) => (
                          <div
                            key={factura.id}
                            className="flex items-center justify-between p-4 border border-blue-100 dark:border-gray-700 rounded-xl bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/30"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getCategoriaIcon(factura.categoria)}
                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                  {factura.clienteNombre} - {factura.concepto}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Vencimiento:</span> {factura.fechaVencimiento} •{' '}
                                <span className="font-medium">${factura.monto.toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {factura.categoria}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getEstadoBadge(factura.estado)}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setFacturaClienteId(cliente.id);
                                  setFacturaEditando(factura);
                                  setNuevaFactura({
                                    concepto: factura.concepto,
                                    monto: factura.monto,
                                    fechaVencimiento: factura.fechaVencimiento,
                                    estado: factura.estado,
                                    categoria: factura.categoria,
                                    clienteNombre: factura.clienteNombre,
                                  });
                                  setShowFacturaModal(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm("¿Estás seguro de eliminar esta factura?")) {
                                    eliminarFactura(cliente.id, factura.id)
                                  }
                                }}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-blue-100 dark:border-gray-700">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      No se encontraron resultados para "{searchTerm}"
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                      Intenta con otro término de búsqueda
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="facturas" className="space-y-6">
            <div className="mb-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={activeFilter === "todos" ? "default" : "outline"}
                  size="sm"
                  className={
                    activeFilter === "todos"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "border-blue-200 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  }
                  onClick={() => setActiveFilter("todos")}
                >
                  Todas las Facturas
                </Button>
                <Button
                  variant={activeFilter === "pagado" ? "default" : "outline"}
                  size="sm"
                  className={
                    activeFilter === "pagado"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                      : "border-emerald-200 hover:bg-emerald-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  }
                  onClick={() => setActiveFilter("pagado")}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Pagadas
                </Button>
                <Button
                  variant={activeFilter === "por_vencer" ? "default" : "outline"}
                  size="sm"
                  className={
                    activeFilter === "por_vencer"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg"
                      : "border-amber-200 hover:bg-amber-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  }
                  onClick={() => setActiveFilter("por_vencer")}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Por Vencer
                </Button>
                <Button
                  variant={activeFilter === "vencido" ? "default" : "outline"}
                  size="sm"
                  className={
                    activeFilter === "vencido"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                      : "border-red-200 hover:bg-red-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  }
                  onClick={() => setActiveFilter("vencido")}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Vencidas
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredFacturas(activeFilter).length > 0 ? (
                filteredFacturas(activeFilter).map(({ cliente, factura }) => {
                  const gradientClass =
                    factura.estado === "pagado"
                      ? "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/20 dark:border-emerald-800"
                      : factura.estado === "por_vencer"
                        ? "from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 dark:border-amber-800"
                        : "from-red-50 to-red-100 border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-800"

                  const textColorClass =
                    factura.estado === "pagado"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : factura.estado === "por_vencer"
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-red-700 dark:text-red-400"

                  return (
                    <div
                      key={factura.id}
                      className={`flex justify-between items-center p-4 border-l-4 bg-gradient-to-r ${gradientClass} rounded-lg shadow-sm`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoriaIcon(factura.categoria)}
                          <div className="font-semibold text-gray-800 dark:text-gray-200">
                            {factura.clienteNombre} - {factura.concepto}
                          </div>
                          {getTipoBadge(cliente.tipo)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {factura.estado === "pagado"
                            ? `Pagado el ${factura.fechaPago}`
                            : factura.estado === "por_vencer"
                              ? `Vence el ${factura.fechaVencimiento}`
                              : `Venció el ${factura.fechaVencimiento}`}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{factura.categoria}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`font-bold text-lg ${textColorClass}`}>${factura.monto.toLocaleString()}</div>
                        {(factura.estado === "por_vencer" || factura.estado === "vencido") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-200 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            onClick={() => enviarNotificacion(cliente, factura)}
                          >
                            <Bell className="w-3 h-3 mr-1" />
                            Notificar
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-blue-100 dark:border-gray-700">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No hay facturas en esta categoría</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                      Selecciona otra categoría para ver más resultados
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de Notificaciones */}
        <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
          <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                Enviar Notificación de Facturación
              </DialogTitle>
            </DialogHeader>
            {currentClient && currentInvoice && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Información del Cliente</p>
                  </div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {currentClient.nombre} ({currentClient.tipo})
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{currentClient.email}</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Detalles de la Factura</p>
                  </div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{currentInvoice.concepto}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monto: <span className="font-semibold">${currentInvoice.monto.toLocaleString()}</span>
                  </p>
                   <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vencimiento: <span className="font-semibold">{currentInvoice.fechaVencimiento}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Canales de Notificación:
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationChannels.email}
                          onChange={(e) =>
                            setNotificationChannels({ ...notificationChannels, email: e.target.checked })
                          }
                        />
                        Email
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationChannels.sms}
                          onChange={(e) =>
                            setNotificationChannels({ ...notificationChannels, sms: e.target.checked })
                          }
                        />
                        SMS
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationChannels.whatsapp}
                          onChange={(e) =>
                            setNotificationChannels({ ...notificationChannels, whatsapp: e.target.checked })
                          }
                        />
                        WhatsApp
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mensaje:
                    </label>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={5}
                      className="w-full p-2 rounded-md border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSendNotification} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Enviar Notificación
                    </Button>
                  </div>
                </div>
              )}
          </DialogContent>
      </Dialog>
      <Dialog open={showFacturaModal} onOpenChange={setShowFacturaModal}>
  <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-blue-200 dark:border-gray-700">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold text-blue-600 dark:text-blue-400">
        {facturaEditando ? "Editar Factura" : "Nueva Factura"}
      </DialogTitle>
    </DialogHeader>
    {facturaClienteId && (() => {
      const cliente = clientes.find((c) => c.id === facturaClienteId)
      if (!cliente) return null

      return (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Factura para:</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">{cliente.nombre}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{cliente.email} • {cliente.telefono}</div>
        </div>
      )
    })()}

    <div className="space-y-4">
      <div>
        <label className="text-sm">Concepto</label>
        <Input
          value={nuevaFactura.concepto}
          onChange={(e) =>
            setNuevaFactura({ ...nuevaFactura, concepto: e.target.value })
          }
        />
      </div>
      <div>
        <label className="text-sm">Nombre del Cliente</label>
        <Input
          value={nuevaFactura.clienteNombre}
          disabled
          className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="text-sm">Monto</label>
        <Input
          type="number"
          value={nuevaFactura.monto}
          onChange={(e) =>
            setNuevaFactura({ ...nuevaFactura, monto: parseFloat(e.target.value) })
          }
        />
      </div>
      <div>
        <label className="text-sm">Fecha de Vencimiento</label>
        <Input
          type="date"
          value={nuevaFactura.fechaVencimiento}
          onChange={(e) =>
            setNuevaFactura({ ...nuevaFactura, fechaVencimiento: e.target.value })
          }
        />
      </div>
      <div>
        <label className="text-sm">Categoría</label>
        <select
          value={nuevaFactura.categoria}
          onChange={(e) =>
            setNuevaFactura({ ...nuevaFactura, categoria: e.target.value })
          }
          className="w-full border border-blue-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800"
        >
          <option value="Fibra Óptica">Fibra Óptica</option>
          <option value="Antenas y RF">Antenas y RF</option>
          <option value="Equipos de Red">Equipos de Red</option>
          <option value="Equipos de Transmisión">Equipos de Transmisión</option>
        </select>
      </div>
      <div className="flex justify-end">
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          disabled={guardandoFactura}
          onClick={async () => {
            if (!facturaClienteId) return;

            if (
              !nuevaFactura.concepto ||
              nuevaFactura.monto <= 0 ||
              !nuevaFactura.fechaVencimiento ||
              !nuevaFactura.clienteNombre
            ) {
              alert("Por favor, completa todos los campos correctamente.");
              return;
            }

            setGuardandoFactura(true);

            if (facturaEditando) {
              const facturaActualizada = { ...facturaEditando, ...nuevaFactura };
              await editarFactura(facturaClienteId, facturaActualizada);
              setClientes((prev) =>
                prev.map((c) =>
                  c.id === facturaClienteId
                    ? {
                        ...c,
                        facturas: c.facturas.map((f) =>
                          f.id === facturaActualizada.id ? facturaActualizada : f
                        ),
                      }
                    : c
                )
              );
              setFacturaEditando(null);
            } else {
              const nueva = { ...nuevaFactura, id: crypto.randomUUID() };
              await agregarFactura(facturaClienteId, nueva);
              setClientes((prev) =>
                prev.map((c) =>
                  c.id === facturaClienteId
                    ? { ...c, facturas: [...c.facturas, nueva] }
                    : c
                )
              );
            }

            setNuevaFactura({
              concepto: "",
              monto: 0,
              fechaVencimiento: "",
              estado: "por_vencer",
              categoria: "Fibra Óptica",
              clienteNombre: obtenerNombreCliente(facturaClienteId),
            })

            setShowFacturaModal(false);
            setGuardandoFactura(false);
          }}
        >
          Guardar Factura
        </Button>
      </div>
      </div>
  </DialogContent>
</Dialog>

    </div>
  </div>
  )
}