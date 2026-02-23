"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Package, Plus, Pencil, Loader2, AlertTriangle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInventory, type InventoryItem } from "@/lib/inventory-context"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

const emptyForm = {
    name: "",
    sku: "",
    purchasePrice: "",
    retailPrice: "",
    stockQuantity: "",
    minStockLevel: "",
}

export default function InventoryPage() {
    const { user } = useAuth()
    const { inventory, isLoading, createItem, updateItem } = useInventory()

    const [modalOpen, setModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Стейт для поточного заповнення (один рядок вводу)
    const [currentItem, setCurrentItem] = useState({ ...emptyForm })
    // Стейт для масового створення
    const [newItems, setNewItems] = useState<(typeof emptyForm & { id: string })[]>([])

    // Стейт для редагування (завжди тільки один елемент)
    const [editForm, setEditForm] = useState(emptyForm)

    if (!user || user.role === "CLIENT") return null

    const openCreateModal = () => {
        setIsEditMode(false)
        setSelectedId(null)
        setCurrentItem({ ...emptyForm })
        setNewItems([])
        setModalOpen(true)
    }

    const openEditModal = (item: InventoryItem) => {
        setIsEditMode(true)
        setSelectedId(item.id)
        setEditForm({
            name: item.name,
            sku: item.sku || "",
            purchasePrice: item.purchasePrice ? item.purchasePrice.toString() : "",
            retailPrice: item.retailPrice.toString(),
            stockQuantity: item.stockQuantity.toString(),
            minStockLevel: item.minStockLevel ? item.minStockLevel.toString() : "",
        })
        setModalOpen(true)
    }

    const handleAddRow = () => {
        if (!currentItem.name || !currentItem.retailPrice || !currentItem.stockQuantity) {
            toast({ title: "Заповніть назву, ціну продажу та залишок", variant: "destructive" })
            return
        }
        setNewItems([...newItems, { ...currentItem, id: Math.random().toString() }])
        // Очищаємо форму для наступної деталі
        setCurrentItem({ ...emptyForm })
    }

    const handleRemoveRow = (id: string) => {
        setNewItems(newItems.filter(item => (item as any).id !== id))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)

        try {
            if (isEditMode && selectedId) {
                if (!editForm.name || !editForm.retailPrice || !editForm.stockQuantity) {
                    toast({ title: "Заповніть обов'язкові поля", variant: "destructive" })
                    setIsSubmitting(false)
                    return
                }

                const payload: any = {
                    name: editForm.name,
                    purchasePrice: editForm.purchasePrice ? Number(editForm.purchasePrice) : null,
                    retailPrice: Number(editForm.retailPrice),
                    stockQuantity: Number(editForm.stockQuantity),
                    minStockLevel: editForm.minStockLevel ? Number(editForm.minStockLevel) : null,
                }
                if (editForm.sku) payload.sku = editForm.sku

                const { success, error } = await updateItem(selectedId, payload)
                if (success) {
                    toast({ title: "Запчастину оновлено", variant: "success" })
                    setModalOpen(false)
                } else {
                    toast({ title: "Помилка оновлення", description: error, variant: "destructive" })
                }
            } else {
                let itemsToSubmit = [...newItems]

                // Якщо користувач заповнив форму, але не натиснув +, додамо автоматично
                const isCurrentItemValid = !!(currentItem.name && currentItem.retailPrice && currentItem.stockQuantity)
                if (isCurrentItemValid && !newItems.some(item => item.name === currentItem.name)) {
                    itemsToSubmit.push({ ...currentItem, id: Math.random().toString() })
                }

                // Відфільтровуємо порожні рядки
                const validItems = itemsToSubmit.filter(item => item.name && item.retailPrice && item.stockQuantity)

                if (validItems.length === 0) {
                    toast({ title: "Додайте хоча б одну запчастину та заповніть обов'язкові поля", variant: "destructive" })
                    setIsSubmitting(false)
                    return
                }

                // Відправляємо всі валідні рядки (чекаємо, поки всі створяться)
                const promises = validItems.map(item => {
                    const payload: any = {
                        name: item.name,
                        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
                        retailPrice: Number(item.retailPrice),
                        stockQuantity: Number(item.stockQuantity),
                        minStockLevel: item.minStockLevel ? Number(item.minStockLevel) : null,
                    }
                    if (item.sku) payload.sku = item.sku;
                    return createItem(payload);
                })

                const results = await Promise.all(promises)
                const hasErrors = results.some(res => !res.success)

                if (hasErrors) {
                    toast({ title: "Деякі позиції не вдалося зберегти", variant: "destructive" })
                } else {
                    toast({ title: `Додано ${validItems.length} позицій`, variant: "success" })
                    setModalOpen(false)
                }
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredInventory = inventory.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <PageHeader
                title="Склад запчастин"
                description="Управління налаштуваннями складу, залишками та переоцінкою"
            />

            <div className="flex-1 overflow-auto p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                        placeholder="Пошук за назвою або артикулом..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md bg-card"
                    />
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 size-4" />
                        Додати позицію
                    </Button>
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
                                        <TableHead className="pl-6 text-muted-foreground">Назва та Артикул</TableHead>
                                        <TableHead className="text-muted-foreground">Роздрібна ціна</TableHead>
                                        <TableHead className="text-muted-foreground">Закупівельна ціна</TableHead>
                                        <TableHead className="text-muted-foreground">Залишок на складі</TableHead>
                                        <TableHead className="pr-6 text-right text-muted-foreground">Дії</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInventory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Package className="mb-2 size-8 opacity-20" />
                                                    <p>Запчастини не знайдено</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInventory.map((item) => {
                                            const isLowStock = item.minStockLevel && item.stockQuantity <= item.minStockLevel
                                            return (
                                                <TableRow key={item.id} className="border-border">
                                                    <TableCell className="pl-6">
                                                        <p className="font-medium text-foreground">{item.name}</p>
                                                        {item.sku && <p className="text-xs text-muted-foreground">Арт: {item.sku}</p>}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {Number(item.retailPrice).toLocaleString()} ₴
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.purchasePrice ? `${Number(item.purchasePrice).toLocaleString()} ₴` : "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span>{item.stockQuantity} шт.</span>
                                                            {isLowStock && (
                                                                <Badge variant="destructive" className="h-5 px-1 py-0 text-[10px]">
                                                                    <AlertTriangle className="mr-1 size-3" />
                                                                    Закінчується
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-muted-foreground hover:text-primary"
                                                            onClick={() => openEditModal(item)}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className={cn(isEditMode ? "sm:max-w-md" : "sm:max-w-4xl", "max-h-[90vh] flex flex-col")}>
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Редагувати позицію" : "Оприбуткування запчастин"}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4 px-1">
                        {isEditMode ? (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Назва *</Label>
                                    <Input
                                        id="name"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="напр. Гальмівні колодки Bosch"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="sku">Артикул / Код</Label>
                                    <Input
                                        id="sku"
                                        value={editForm.sku}
                                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                                        placeholder="Необов'язково"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="purchasePrice">Ціна закупки (₴)</Label>
                                        <Input
                                            id="purchasePrice"
                                            type="number"
                                            value={editForm.purchasePrice}
                                            onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="retailPrice">Ціна продажу (₴) *</Label>
                                        <Input
                                            id="retailPrice"
                                            type="number"
                                            value={editForm.retailPrice}
                                            onChange={(e) => setEditForm({ ...editForm, retailPrice: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="stockQuantity">Залишок (шт.) *</Label>
                                        <Input
                                            id="stockQuantity"
                                            type="number"
                                            value={editForm.stockQuantity}
                                            onChange={(e) => setEditForm({ ...editForm, stockQuantity: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="minStockLevel">Мін. залишок</Label>
                                        <Input
                                            id="minStockLevel"
                                            type="number"
                                            value={editForm.minStockLevel}
                                            onChange={(e) => setEditForm({ ...editForm, minStockLevel: e.target.value })}
                                            placeholder="напр. 3"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full space-y-4">
                                {/* Форма додавання (зафіксована зверху) */}
                                <div className="border border-border p-4 rounded-xl bg-secondary/5 shrink-0 shadow-sm mt-2">
                                    <h4 className="font-semibold text-sm mb-3">Додати нову позицію до списку</h4>
                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-12 items-end">
                                        <div className="col-span-1 md:col-span-3">
                                            <Label className="text-xs mb-1.5 block text-muted-foreground">Назва *</Label>
                                            <Input
                                                value={currentItem.name}
                                                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                                                placeholder="напр. Гальмівні колодки"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <Label className="text-xs mb-1.5 block text-muted-foreground">Артикул</Label>
                                            <Input
                                                value={currentItem.sku}
                                                onChange={(e) => setCurrentItem({ ...currentItem, sku: e.target.value })}
                                                placeholder="Необов."
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <Label className="text-xs mb-1.5 block text-muted-foreground">Ціна закуп. (₴)</Label>
                                            <Input
                                                type="number"
                                                value={currentItem.purchasePrice}
                                                onChange={(e) => setCurrentItem({ ...currentItem, purchasePrice: e.target.value })}
                                                placeholder="0"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <Label className="text-xs mb-1.5 block text-muted-foreground">Роздріб (₴) *</Label>
                                            <Input
                                                type="number"
                                                value={currentItem.retailPrice}
                                                onChange={(e) => setCurrentItem({ ...currentItem, retailPrice: e.target.value })}
                                                placeholder="0"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-xs mb-1.5 block text-muted-foreground">Залишок *</Label>
                                            <Input
                                                type="number"
                                                value={currentItem.stockQuantity}
                                                onChange={(e) => setCurrentItem({ ...currentItem, stockQuantity: e.target.value })}
                                                placeholder="0"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-xs mb-1.5 block text-muted-foreground">Мін. зал</Label>
                                            <Input
                                                type="number"
                                                value={currentItem.minStockLevel}
                                                onChange={(e) => setCurrentItem({ ...currentItem, minStockLevel: e.target.value })}
                                                placeholder="0"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="col-span-1 mt-2 md:mt-0 flex justify-end md:block">
                                            <Button
                                                variant="default"
                                                size="icon"
                                                className="h-9 w-9 rounded-md bg-primary/20 hover:bg-primary/30 text-primary w-full md:w-9"
                                                onClick={handleAddRow}
                                            >
                                                <Plus className="size-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Список збереження */}
                                <div className="flex-1 overflow-y-auto min-h-[150px]">
                                    {newItems.length > 0 ? (
                                        <div className="space-y-2 pr-1">
                                            <div className="hidden md:grid gap-2 grid-cols-12 px-2 text-[10px] font-bold uppercase text-muted-foreground/70 tracking-wider mb-1">
                                                <div className="col-span-4">Назва та Артикул</div>
                                                <div className="col-span-2">Закупка</div>
                                                <div className="col-span-2">Продаж</div>
                                                <div className="col-span-2">К-сть / Мін.</div>
                                                <div className="col-span-2 text-right">Дії</div>
                                            </div>
                                            {newItems.map((item: any) => (
                                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-sm border p-2.5 rounded-lg bg-card mb-2">
                                                    <div className="col-span-1 md:col-span-4 flex flex-col">
                                                        <span className="font-semibold leading-tight">{item.name}</span>
                                                        {item.sku && <span className="text-[10px] text-muted-foreground">Арт: {item.sku}</span>}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 tabular-nums">
                                                        {item.purchasePrice ? `${item.purchasePrice} ₴` : "—"}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 font-medium tabular-nums">
                                                        {item.retailPrice} ₴
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 flex items-center gap-1.5">
                                                        <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">{item.stockQuantity} шт</Badge>
                                                        {item.minStockLevel && <span className="text-xs font-semibold text-muted-foreground tabular-nums">/ {item.minStockLevel}</span>}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 flex justify-end">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveRow(item.id)}>
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed rounded-xl opacity-60">
                                            <Package className="size-8 mb-2 opacity-50" />
                                            <p className="text-sm">Список додавання порожній</p>
                                            <p className="text-xs mt-1">Заповніть форму зверху та натисніть +, щоб додати деталі сюди</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
                            Скасувати
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!isEditMode && newItems.length === 0 && !(currentItem.name && currentItem.retailPrice && currentItem.stockQuantity))}
                        >
                            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {isEditMode ? "Зберегти" : `Зберегти (${newItems.length + (!!(currentItem.name && currentItem.retailPrice && currentItem.stockQuantity) && !newItems.some(i => i.name === currentItem.name) ? 1 : 0)})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
