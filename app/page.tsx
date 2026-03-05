"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Wrench, ShieldCheck, Clock, CheckCircle2, Star, CalendarDays, Phone, Mail, MapPin } from "lucide-react"

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"))
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans overflow-y-auto w-full">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-7 md:size-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="size-3.5 md:size-4 text-primary-foreground" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">WagGarage</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Послуги</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Переваги</a>
            <a href="#contacts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Контакти</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            {!isAuthenticated && (
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:flex text-sm">Увійти</Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button className="gap-2 rounded-full h-8 px-3 md:h-10 md:px-4 text-xs md:text-sm">
                <span className="hidden sm:inline">Особистий кабінет</span>
                <span className="sm:hidden">Кабінет</span>
                <ArrowRight className="size-4 hidden sm:block" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* HERO SECTION */}
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden bg-black flex items-center min-h-[80vh]">
          {/* ФОНОВЕ ЗОБРАЖЕННЯ */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero-bg.jpg')" }}
          >
            {/* Затемнення фону */}
            <div className="absolute inset-0 bg-black/70"></div>
          </div>

          {/* Градієнт для плавного переходу вниз */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/5 to-transparent z-0 pointer-events-none"></div>

          <div className="container relative mx-auto px-4 md:px-6 z-10 w-full mb-8 md:mb-12">
            <div className="flex flex-col items-center gap-4 md:gap-6 text-center max-w-4xl mx-auto w-full">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs md:text-sm font-medium text-white mb-2 md:mb-4 backdrop-blur-md">
                <Star className="mr-1.5 md:mr-2 size-3 md:size-4 text-primary fill-primary" /> Сучасний сервіс
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl w-full text-white drop-shadow-sm leading-tight">
                Професійне обслуговування <br className="hidden sm:block" /><span className="text-primary drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">без компромісів</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-base md:text-lg text-gray-300 lg:text-xl leading-relaxed w-full drop-shadow-sm px-2 sm:px-0 mt-2">
                Довірте своє авто професіоналам WagGarage. Швидка діагностика, оригінальні запчастини та гарантія на всі види робіт. Ваш спокій — наш пріоритет.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8 w-full sm:w-auto px-4 sm:px-0">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2 rounded-full text-sm md:text-base h-12 md:h-14 px-6 md:px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                    <CalendarDays className="size-4 md:size-5" /> Записатися онлайн
                  </Button>
                </Link>
                <Link href="#services" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full rounded-full text-sm md:text-base h-12 md:h-14 px-6 md:px-8 bg-black/30 text-white border-white/20 hover:bg-white/10 hover:text-white backdrop-blur-md transition-all">
                    Наші послуги
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="w-full py-16 md:py-24 bg-background border-y border-border/50">
          <div className="container mx-auto px-4 md:px-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
              {[
                { icon: ShieldCheck, title: "Гарантія якості", desc: "Даємо гарантію на всі виконані роботи та встановлені запчастини від 1 року." },
                { icon: Clock, title: "Виконання в строк", desc: "Цінуємо ваш час. Роботи виконуються чітко у попередньо обумовлені терміни." },
                { icon: CheckCircle2, title: "Прозорі ціни", desc: "Ви завжди знаєте за що платите. Жодного нав'язування додаткових послуг." }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50 w-full">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <feature.icon className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="w-full py-16 md:py-24 bg-secondary/10">
          <div className="container mx-auto px-4 md:px-6 w-full">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 w-full">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Популярні послуги</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Надаємо повний спектр послуг з ремонту та технічного обслуговування автомобілів.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full">
              {[
                "Комп'ютерна діагностика", "Планове ТО (масла, фільтри)",
                "Ремонт ходової частини", "Обслуговування гальмівної системи",
                "Ремонт двигунів", "Діагностика авто перед покупкою",
                "Обслуговування кондиціонерів", "Шиномонтаж та балансування"
              ].map((service, i) => (
                <Card key={i} className="group hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-card w-full">
                  <CardContent className="p-6 flex flex-col items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <Wrench className="size-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground leading-tight">{service}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-20 bg-primary/5 border-y border-border/50 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10 w-full">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto w-full">
              <div className="space-y-4 max-w-lg text-center md:text-left px-2 sm:px-0">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Готові записатися на сервіс?</h2>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Реєструйтесь в нашому CRM-кабінеті, щоб легко керувати історією авто та записуватись онлайн.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
                {!isAuthenticated ? (
                  <>
                    <Link href="/register" className="w-full sm:w-auto">
                      <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base w-full">
                        Реєстрація клієнта
                      </Button>
                    </Link>
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="rounded-full h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base bg-background w-full">
                        Увійти
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base w-full">
                      Перейти в кабінет
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="contacts" className="w-full bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 md:px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded bg-primary">
                  <Wrench className="size-3 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">WagGarage</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ваш надійний партнер у питаннях автосервісу.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Контакти</h4>
              <ul className="space-y-2 text-sm text-muted-foreground w-full">
                <li className="flex items-center gap-2 break-all"><Phone className="size-4 shrink-0" /> +380 (99) 123-45-67</li>
                <li className="flex items-center gap-2 break-all"><Mail className="size-4 shrink-0" /> info@waggarage.com</li>
                <li className="flex items-start gap-2 break-words"><MapPin className="size-4 shrink-0 mt-0.5" /> м. Запоріжжя, вул. Перемоги</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Графік роботи</h4>
              <ul className="space-y-2 text-sm text-muted-foreground w-full">
                <li className="flex justify-between w-full"><span>Пн-Пт:</span> <span>09:00 - 19:00</span></li>
                <li className="flex justify-between w-full"><span>Сб:</span> <span>10:00 - 16:00</span></li>
                <li className="flex justify-between w-full"><span>Нд:</span> <span>Вихідний</span></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Клієнтам</h4>
              <ul className="space-y-2 text-sm w-full">
                <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">Особистий кабінет</Link></li>
                <li><Link href="/register" className="text-muted-foreground hover:text-primary transition-colors">Реєстрація</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Запис на сервіс</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground flex flex-col items-center justify-center w-full">
            <p>© {new Date().getFullYear()} WagGarage CRM. Всі права захищені.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
