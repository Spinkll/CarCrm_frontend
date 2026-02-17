// CRM data types and mock data for car service

export type UserRole = "admin" | "mechanic" | "client"

export type AppUser = {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  customerId?: string // links client users to their customer record
  mechanicName?: string // links mechanic users to service order assignments
}

export const initialUsers: AppUser[] = [
  { id: "U001", name: "Admin User", email: "admin@autocare.com", password: "admin123", role: "admin" },
  { id: "U002", name: "Mike Torres", email: "mike@autocare.com", password: "mech123", role: "mechanic", mechanicName: "Mike Torres" },
  { id: "U003", name: "Lisa Park", email: "lisa@autocare.com", password: "mech123", role: "mechanic", mechanicName: "Lisa Park" },
  { id: "U004", name: "Alex Johnson", email: "alex.johnson@email.com", password: "client123", role: "client", customerId: "C001" },
  { id: "U005", name: "Maria Garcia", email: "maria.g@email.com", password: "client123", role: "client", customerId: "C002" },
]

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
  totalSpent: number
  visitCount: number
}

export type Vehicle = {
  id: string
  customerId: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  color: string
  mileage: number
}

export type ServiceOrderStatus = "pending" | "in-progress" | "completed" | "cancelled"

export type ServiceOrder = {
  id: string
  customerId: string
  vehicleId: string
  status: ServiceOrderStatus
  description: string
  services: string[]
  totalCost: number
  createdAt: string
  completedAt: string | null
  assignedMechanic: string
}

export type Appointment = {
  id: string
  customerId: string
  vehicleId: string
  date: string
  time: string
  service: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
  notes: string
}

export const customers: Customer[] = [
  { id: "C001", name: "Alex Johnson", email: "alex.johnson@email.com", phone: "(555) 123-4567", address: "142 Oak Street, Portland, OR", createdAt: "2024-01-15", totalSpent: 4280, visitCount: 8 },
  { id: "C002", name: "Maria Garcia", email: "maria.g@email.com", phone: "(555) 234-5678", address: "89 Pine Avenue, Portland, OR", createdAt: "2024-02-20", totalSpent: 1950, visitCount: 4 },
  { id: "C003", name: "James Wilson", email: "j.wilson@email.com", phone: "(555) 345-6789", address: "201 Elm Drive, Beaverton, OR", createdAt: "2024-03-10", totalSpent: 7620, visitCount: 12 },
  { id: "C004", name: "Sarah Chen", email: "s.chen@email.com", phone: "(555) 456-7890", address: "55 Maple Lane, Lake Oswego, OR", createdAt: "2024-04-05", totalSpent: 3150, visitCount: 6 },
  { id: "C005", name: "Robert Kim", email: "r.kim@email.com", phone: "(555) 567-8901", address: "312 Cedar Court, Tigard, OR", createdAt: "2024-05-12", totalSpent: 890, visitCount: 2 },
  { id: "C006", name: "Emily Brown", email: "emily.b@email.com", phone: "(555) 678-9012", address: "77 Birch Road, Portland, OR", createdAt: "2024-06-18", totalSpent: 5430, visitCount: 10 },
  { id: "C007", name: "David Martinez", email: "d.martinez@email.com", phone: "(555) 789-0123", address: "445 Walnut Street, Gresham, OR", createdAt: "2024-07-01", totalSpent: 2670, visitCount: 5 },
  { id: "C008", name: "Lisa Thompson", email: "lisa.t@email.com", phone: "(555) 890-1234", address: "168 Spruce Way, Hillsboro, OR", createdAt: "2024-08-22", totalSpent: 1200, visitCount: 3 },
]

export const vehicles: Vehicle[] = [
  { id: "V001", customerId: "C001", make: "Toyota", model: "Camry", year: 2021, vin: "1HGBH41JXMN109186", licensePlate: "ABC-1234", color: "Silver", mileage: 45200 },
  { id: "V002", customerId: "C001", make: "Honda", model: "CR-V", year: 2023, vin: "2HGBH41JXMN209186", licensePlate: "DEF-5678", color: "White", mileage: 12800 },
  { id: "V003", customerId: "C002", make: "Ford", model: "F-150", year: 2020, vin: "3HGBH41JXMN309186", licensePlate: "GHI-9012", color: "Black", mileage: 67500 },
  { id: "V004", customerId: "C003", make: "BMW", model: "X5", year: 2022, vin: "4HGBH41JXMN409186", licensePlate: "JKL-3456", color: "Blue", mileage: 31000 },
  { id: "V005", customerId: "C003", make: "Mercedes", model: "C300", year: 2019, vin: "5HGBH41JXMN509186", licensePlate: "MNO-7890", color: "Gray", mileage: 82000 },
  { id: "V006", customerId: "C004", make: "Subaru", model: "Outback", year: 2022, vin: "6HGBH41JXMN609186", licensePlate: "PQR-1234", color: "Green", mileage: 28900 },
  { id: "V007", customerId: "C005", make: "Chevrolet", model: "Silverado", year: 2021, vin: "7HGBH41JXMN709186", licensePlate: "STU-5678", color: "Red", mileage: 54300 },
  { id: "V008", customerId: "C006", make: "Tesla", model: "Model 3", year: 2023, vin: "8HGBH41JXMN809186", licensePlate: "VWX-9012", color: "White", mileage: 15600 },
  { id: "V009", customerId: "C007", make: "Nissan", model: "Rogue", year: 2020, vin: "9HGBH41JXMN909186", licensePlate: "YZA-3456", color: "Silver", mileage: 71200 },
  { id: "V010", customerId: "C008", make: "Hyundai", model: "Tucson", year: 2023, vin: "0HGBH41JXMN009186", licensePlate: "BCD-7890", color: "Black", mileage: 9800 },
]

export const serviceOrders: ServiceOrder[] = [
  { id: "SO001", customerId: "C001", vehicleId: "V001", status: "completed", description: "Regular maintenance", services: ["Oil Change", "Tire Rotation", "Brake Inspection"], totalCost: 285, createdAt: "2025-12-01", completedAt: "2025-12-01", assignedMechanic: "Mike Torres" },
  { id: "SO002", customerId: "C003", vehicleId: "V004", status: "in-progress", description: "Engine diagnostic and repair", services: ["Diagnostic Scan", "Spark Plug Replacement", "Air Filter"], totalCost: 650, createdAt: "2025-12-15", completedAt: null, assignedMechanic: "Dave Henderson" },
  { id: "SO003", customerId: "C002", vehicleId: "V003", status: "pending", description: "Brake pad replacement", services: ["Front Brake Pads", "Rear Brake Pads", "Rotor Inspection"], totalCost: 420, createdAt: "2025-12-20", completedAt: null, assignedMechanic: "Mike Torres" },
  { id: "SO004", customerId: "C006", vehicleId: "V008", status: "completed", description: "Battery and electrical check", services: ["Battery Test", "Charging System Check", "Software Update"], totalCost: 180, createdAt: "2025-11-28", completedAt: "2025-11-28", assignedMechanic: "Lisa Park" },
  { id: "SO005", customerId: "C004", vehicleId: "V006", status: "in-progress", description: "Transmission service", services: ["Transmission Fluid Flush", "Filter Replacement", "Road Test"], totalCost: 520, createdAt: "2026-01-05", completedAt: null, assignedMechanic: "Dave Henderson" },
  { id: "SO006", customerId: "C007", vehicleId: "V009", status: "completed", description: "AC repair", services: ["AC Diagnostic", "Refrigerant Recharge", "Compressor Check"], totalCost: 390, createdAt: "2026-01-10", completedAt: "2026-01-12", assignedMechanic: "Mike Torres" },
  { id: "SO007", customerId: "C001", vehicleId: "V002", status: "pending", description: "Annual inspection", services: ["State Inspection", "Fluid Top-Off", "Multi-Point Inspection"], totalCost: 150, createdAt: "2026-02-01", completedAt: null, assignedMechanic: "Lisa Park" },
  { id: "SO008", customerId: "C005", vehicleId: "V007", status: "cancelled", description: "Tire replacement", services: ["4x New Tires", "Alignment", "Balancing"], totalCost: 980, createdAt: "2026-01-20", completedAt: null, assignedMechanic: "Dave Henderson" },
  { id: "SO009", customerId: "C003", vehicleId: "V005", status: "completed", description: "Suspension work", services: ["Strut Replacement", "Alignment", "Control Arm Bushings"], totalCost: 1450, createdAt: "2026-01-25", completedAt: "2026-02-02", assignedMechanic: "Mike Torres" },
  { id: "SO010", customerId: "C008", vehicleId: "V010", status: "in-progress", description: "First service", services: ["Oil Change", "Tire Rotation", "Multi-Point Inspection"], totalCost: 120, createdAt: "2026-02-10", completedAt: null, assignedMechanic: "Lisa Park" },
]

export const appointments: Appointment[] = [
  { id: "A001", customerId: "C001", vehicleId: "V001", date: "2026-02-18", time: "09:00", service: "Oil Change", status: "confirmed", notes: "Customer prefers synthetic oil" },
  { id: "A002", customerId: "C003", vehicleId: "V004", date: "2026-02-18", time: "10:30", service: "Engine Diagnostic", status: "confirmed", notes: "Check engine light on" },
  { id: "A003", customerId: "C005", vehicleId: "V007", date: "2026-02-18", time: "14:00", service: "Tire Replacement", status: "scheduled", notes: "Wants all-terrain tires" },
  { id: "A004", customerId: "C002", vehicleId: "V003", date: "2026-02-19", time: "08:30", service: "Brake Service", status: "scheduled", notes: "Squeaking noise when braking" },
  { id: "A005", customerId: "C006", vehicleId: "V008", date: "2026-02-19", time: "11:00", service: "Software Update", status: "confirmed", notes: "Latest firmware" },
  { id: "A006", customerId: "C004", vehicleId: "V006", date: "2026-02-20", time: "09:30", service: "Transmission Check", status: "scheduled", notes: "Follow-up from previous service" },
  { id: "A007", customerId: "C007", vehicleId: "V009", date: "2026-02-20", time: "13:00", service: "AC Service", status: "scheduled", notes: "Not cooling properly" },
  { id: "A008", customerId: "C008", vehicleId: "V010", date: "2026-02-21", time: "10:00", service: "General Inspection", status: "scheduled", notes: "New customer first visit" },
]

// Monthly revenue data for charts
export const monthlyRevenue = [
  { month: "Sep", revenue: 8400 },
  { month: "Oct", revenue: 9200 },
  { month: "Nov", revenue: 7800 },
  { month: "Dec", revenue: 11500 },
  { month: "Jan", revenue: 10800 },
  { month: "Feb", revenue: 6200 },
]

export const serviceBreakdown = [
  { name: "Oil Change", count: 45, revenue: 5400 },
  { name: "Brake Service", count: 28, revenue: 11200 },
  { name: "Diagnostics", count: 35, revenue: 5250 },
  { name: "Tire Service", count: 22, revenue: 8800 },
  { name: "Transmission", count: 12, revenue: 6240 },
  { name: "Other", count: 18, revenue: 4500 },
]

// Helper functions
export function getCustomerById(id: string) {
  return customers.find(c => c.id === id)
}

export function getVehicleById(id: string) {
  return vehicles.find(v => v.id === id)
}

export function getVehiclesByCustomer(customerId: string) {
  return vehicles.filter(v => v.customerId === customerId)
}

export function getOrdersByCustomer(customerId: string) {
  return serviceOrders.filter(o => o.customerId === customerId)
}

export function getOrdersByVehicle(vehicleId: string) {
  return serviceOrders.filter(o => o.vehicleId === vehicleId)
}
