import Link from "next/link"
import { Home, Package, ShoppingCart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

const Sidebar = () => {
  return (
    <div className="bg-secondary w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <nav className="space-y-2">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/inventory">
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/suppliers">
            <Users className="mr-2 h-4 w-4" />
            Suppliers
          </Link>
        </Button>
      </nav>
    </div>
  )
}

export default Sidebar

