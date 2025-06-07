"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useAccessibility } from "@/components/accessibility-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Settings, Sun, Moon, Eye, Palette } from "lucide-react"

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { colorBlindMode, setColorBlindMode, isLoaded } = useAccessibility()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const colorBlindOptions = [
    { value: "none", label: "Normal", description: "Colores estándar" },
    { value: "protanopia", label: "Protanopia", description: "Dificultad con rojos" },
    { value: "deuteranopia", label: "Deuteranopia", description: "Dificultad con verdes" },
    { value: "tritanopia", label: "Tritanopia", description: "Dificultad con azules" },
  ]

  const handleThemeChange = (newTheme: string) => {
    console.log("Cambiando tema a:", newTheme)
    setTheme(newTheme)
  }

  const handleColorBlindChange = (newMode: string) => {
    console.log("Cambiando modo daltonismo a:", newMode)
    setColorBlindMode(newMode as any)
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Settings className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-blue-200 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
          onClick={() => {
            console.log("Botón de configuración clickeado")
            setOpen(true)
          }}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configuración</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Configuración de Accesibilidad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tema */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <Label className="text-sm font-semibold">Tema de la aplicación</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex items-center gap-2 p-3 border rounded-lg hover:bg-blue-50 ${
                  theme === "light" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              >
                <Sun className="w-4 h-4" />
                Claro
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center gap-2 p-3 border rounded-lg hover:bg-blue-50 ${
                  theme === "dark" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              >
                <Moon className="w-4 h-4" />
                Oscuro
              </button>
            </div>
          </div>

          {/* Daltonismo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <Label className="text-sm font-semibold">Accesibilidad visual</Label>
            </div>
            <div className="space-y-2">
              {colorBlindOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleColorBlindChange(option.value)}
                  className={`w-full text-left p-3 border rounded-lg hover:bg-blue-50 ${
                    colorBlindMode === option.value ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-600">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vista previa de colores */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Vista previa de colores</Label>
            <div className="grid grid-cols-4 gap-2">
              <div className="h-8 rounded bg-emerald-500 flex items-center justify-center">
                <span className="text-xs text-white font-medium">Pagado</span>
              </div>
              <div className="h-8 rounded bg-amber-500 flex items-center justify-center">
                <span className="text-xs text-white font-medium">Por Vencer</span>
              </div>
              <div className="h-8 rounded bg-red-500 flex items-center justify-center">
                <span className="text-xs text-white font-medium">Vencido</span>
              </div>
              <div className="h-8 rounded bg-blue-500 flex items-center justify-center">
                <span className="text-xs text-white font-medium">Info</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => {
              console.log("Configuración guardada")
              setOpen(false)
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
