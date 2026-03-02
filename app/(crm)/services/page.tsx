"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Wrench, Plus, Pencil, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

interface ServiceItem {
    id: number
    name: string
    price: number
}

const emptyForm = {
    name: "",
    price: "",
}

export default function ServicesPage() {
    const { user } = useAuth()

    // Data states
    const [services, setServices] = useState<ServiceItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Modal & action states
    const [modalOpen, setModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form states
    const [form, setForm] = useState(emptyForm)

    // Delete states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<number | null>(null)

    const role = user?.role?.toUpperCase() || ""
    const canManageServices = role === "ADMIN" || role === "MANAGER"

    const fetchServices = async () => {
        setIsLoading(true)
        try {
            const { data } = await api.get('/services')
            setServices(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Failed to fetch services", error)
            toast({ title: "Помилка завантаження послуг", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchServices()
    }, [])

    const openCreateModal = () => {
        setIsEditMode(false)
        setSelectedId(null)
        setForm(emptyForm)
        setModalOpen(true)
    }

    const openEditModal = (item: ServiceItem) => {
        setIsEditMode(true)
        setSelectedId(item.id)
        setForm({
            name: item.name,
            price: item.price.toString(),
        })
        setModalOpen(true)
    }

    const confirmDelete = (id: number) => {
        setItemToDelete(id)
        setDeleteModalOpen(true)
    }

    const handleSubmit = async () => {
        if (!form.name || !form.price) {
            toast({ title: "Заповніть обов'язкові поля", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            const payload = {
                name: form.name,
                price: Number(form.price),
            }

            if (isEditMode && selectedId) {
                await api.patch(`/services/${selectedId}`, payload)
                toast({ title: "Послугу оновлено", variant: "success" })
            } else {
                await api.post('/services', payload)
                toast({ title: "Послугу створено", variant: "success" })
            }

            setModalOpen(false)
            fetchServices()
        } catch (error: any) {
            console.error("Failed to save service", error)
            const msg = error.response?.data?.message || "Не вдалося зберегти послугу"
            toast({ title: Array.isArray(msg) ? msg[0] : msg, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!itemToDelete) return

        setIsSubmitting(true)
        try {
            await api.delete(`/services/${itemToDelete}`)
            toast({ title: "Послугу видалено", variant: "success" })
            setDeleteModalOpen(false)
            fetchServices()
        } catch (error: any) {
            console.error("Failed to delete service", error)
            const msg = error.response?.data?.message || "Не вдалося видалити послугу"
            toast({ title: Array.isArray(msg) ? msg[0] : msg, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
            setItemToDelete(null)
        }
    }

    if (!user) return null

    const filteredServices = services.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <PageHeader
                title="Довідник послуг"
                description="Управління переліком послуг та їх вартістю"
            />

            <div className="flex-1 overflow-auto p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                        placeholder="Пошук за назвою..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md bg-card"
                    />
                    {canManageServices && (
                        <Button onClick={openCreateModal}>
                            <Plus className="mr-2 size-4" />
                            Додати послугу
                        </Button>
                    )}
                </div>

                <Card className="border-border bg-card">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="pl-6 text-muted-foreground">Назва послуги</TableHead>
                                        <TableHead className="text-muted-foreground w-48 text-right pr-6">Вартість</TableHead>
                                        {canManageServices && <TableHead className="w-24 text-right pr-6 text-muted-foreground">Дії</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Wrench className="mb-2 size-8 opacity-20" />
                                                    <p>Послуги не знайдено</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredServices.map((item) => (
                                            <TableRow key={item.id} className="border-border">
                                                <TableCell className="pl-6 font-medium text-foreground">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="font-medium text-right pr-6 tabular-nums">
                                                    {Number(item.price).toLocaleString()} ₴
                                                </TableCell>
                                                {canManageServices && (
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="text-muted-foreground hover:text-primary h-8 w-8"
                                                                onClick={() => openEditModal(item)}
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                                onClick={() => confirmDelete(item.id)}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Редагувати послугу" : "Додати нову послугу"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Назва послуги *</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="напр. Заміна мастила"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="price">Вартість (₴) *</Label>
                            <Input
                                id="price"
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
                            Скасувати
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || !form.name || !form.price}>
                            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Зберегти
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Видалення послуги</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Ви впевнені, що хочете видалити цю послугу? Цю дію неможливо скасувати.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isSubmitting}>
                            Скасувати
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Видалити
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
