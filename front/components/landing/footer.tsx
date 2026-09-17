import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">US</span>
              </div>
              <span className="font-bold text-xl">UniSchool</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Професійна онлайн школа іноземних мов з понад 10-річним досвідом
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Навчання</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#courses" className="hover:text-primary transition-colors">
                  Курси
                </Link>
              </li>
              <li>
                <Link href="#teachers" className="hover:text-primary transition-colors">
                  Викладачі
                </Link>
              </li>
              <li>
                <Link href="#trial" className="hover:text-primary transition-colors">
                  Пробний урок
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-primary transition-colors">
                  Ціни
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Про нас</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#about" className="hover:text-primary transition-colors">
                  Про школу
                </Link>
              </li>
              <li>
                <Link href="#reviews" className="hover:text-primary transition-colors">
                  Відгуки
                </Link>
              </li>
              <li>
                <Link href="#blog" className="hover:text-primary transition-colors">
                  Блог
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-primary transition-colors">
                  Контакти
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Соціальні мережі</h3>
            <div className="flex gap-4">
              <Link
                href="#"
                className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Facebook className="w-5 h-5 text-primary" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Instagram className="w-5 h-5 text-primary" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Youtube className="w-5 h-5 text-primary" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Twitter className="w-5 h-5 text-primary" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Language School. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  )
}
