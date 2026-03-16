"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  Wrench,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Star,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Search,
  ThumbsUp,
  Activity,
  Car,
  Disc,
  Cog,
  FileSearch,
  Wind,
  LifeBuoy,
  ArrowUp,
  MessageSquareQuote,
  ChevronDown,
  Users,
  Award,
  Timer,
  Sparkles,
  Play,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [displayValue, setDisplayValue] = useState("0")

  useEffect(() => {
    if (isInView) {
      const numericValue = parseInt(value.replace(/[^0-9]/g, ""))
      const duration = 2000
      const steps = 60
      const increment = numericValue / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= numericValue) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current).toLocaleString())
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  )
}

// Floating shapes component
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob opacity-60" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl animate-blob-delay-2 opacity-50" />
      <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-blob-delay-4 opacity-40" />
    </div>
  )
}

// Section wrapper with scroll animations
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showScrollTopButton, setShowScrollTopButton] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [activeNavItem, setActiveNavItem] = useState("")
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll()
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"))

    const handleScroll = () => {
      setShowScrollTopButton(window.scrollY > 400)

      // Update active nav based on scroll position
      const sections = ["features", "services", "how-it-works", "contacts"]
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveNavItem(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const smoothScrollTo = (targetY: number) => {
    const scrollElement = document.scrollingElement || document.documentElement
    const startY = scrollElement.scrollTop
    const diff = targetY - startY
    if (diff === 0) return

    const duration = 800
    const startTime = performance.now()

    const easeInOutQuart = (t: number) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutQuart(progress)
      scrollElement.scrollTop = startY + diff * eased

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  const scrollToTop = () => smoothScrollTo(0)

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const rect = element.getBoundingClientRect()
      const scrollElement = document.scrollingElement || document.documentElement
      smoothScrollTo(scrollElement.scrollTop + rect.top - 80)
    }
  }

  const navItems = [
    { id: "features", label: "Переваги" },
    { id: "services", label: "Послуги" },
    { id: "how-it-works", label: "Як працюємо" },
    { id: "contacts", label: "Контакти" },
  ]

  const features = [
    {
      icon: ShieldCheck,
      title: "Гарантія якості",
      desc: "Даємо гарантію на всі виконані роботи та встановлені запчастини від 1 року.",
    },
    {
      icon: Clock,
      title: "Виконання в строк",
      desc: "Цінуємо ваш час. Роботи виконуються чітко у попередньо обумовлені терміни.",
    },
    {
      icon: CheckCircle2,
      title: "Прозорі ціни",
      desc: "Ви завжди знаєте за що платите. Жодного нав'язування додаткових послуг.",
    },
  ]

  const services = [
    { title: "Комп'ютерна діагностика", icon: Activity, color: "from-blue-500/20 to-blue-600/10" },
    { title: "Планове ТО", icon: ClipboardList, color: "from-emerald-500/20 to-emerald-600/10" },
    { title: "Ремонт ходової частини", icon: Car, color: "from-amber-500/20 to-amber-600/10" },
    { title: "Гальмівна система", icon: Disc, color: "from-red-500/20 to-red-600/10" },
    { title: "Ремонт двигунів", icon: Cog, color: "from-slate-500/20 to-slate-600/10" },
    { title: "Діагностика перед покупкою", icon: FileSearch, color: "from-violet-500/20 to-violet-600/10" },
    { title: "Обслуговування кондиціонерів", icon: Wind, color: "from-cyan-500/20 to-cyan-600/10" },
    { title: "Шиномонтаж", icon: LifeBuoy, color: "from-orange-500/20 to-orange-600/10" },
  ]

  const steps = [
    {
      icon: ClipboardList,
      step: "01",
      title: "Запис онлайн",
      desc: "Залишаєте заявку або записуєтесь через кабінет.",
    },
    {
      icon: Search,
      step: "02",
      title: "Діагностика",
      desc: "Проводимо ретельну перевірку вашого автомобіля.",
    },
    {
      icon: Wrench,
      step: "03",
      title: "Ремонт",
      desc: "Професійне виконання робіт та заміна деталей.",
    },
    {
      icon: ThumbsUp,
      step: "04",
      title: "Результат",
      desc: "Отримуєте цілком справне авто з гарантією.",
    },
  ]

  const stats = [
    { icon: Car, value: "5 000", suffix: "+", label: "Авто обслужено" },
    { icon: Users, value: "3 200", suffix: "+", label: "Задоволених клієнтів" },
    { icon: Award, value: "12", suffix: "+", label: "Років досвіду" },
    { icon: Timer, value: "98", suffix: "%", label: "Вчасне виконання" },
  ]

  const testimonials = [
    {
      name: "Олександр К.",
      car: "BMW X5, 2020",
      rating: 5,
      text: "Чудовий сервіс! Зробили діагностику за годину, знайшли проблему з підвіскою, яку інші СТО не могли виявити. Рекомендую всім!",
    },
    {
      name: "Марина В.",
      car: "Toyota Camry, 2019",
      rating: 5,
      text: "Записалася онлайн, все було готово точно в строк. Дуже зручний CRM-кабінет, де видно всю історію обслуговування мого авто.",
    },
    {
      name: "Дмитро Л.",
      car: "Volkswagen Golf, 2021",
      rating: 5,
      text: "Прозорі ціни, ніхто не нав'язує непотрібні послуги. Залишив авто на планове ТО — все ідеально. Буду повертатись!",
    },
  ]

  const faqs = [
    {
      q: "Як записатися на сервіс?",
      a: "Ви можете записатися онлайн через наш CRM-кабінет, зателефонувати нам або залишити заявку на сайті. Після реєстрації вам буде доступний зручний особистий кабінет.",
    },
    {
      q: "Скільки часу займає діагностика?",
      a: "Комп'ютерна діагностика зазвичай займає від 30 хвилин до 1 години, залежно від складності. Ми завжди повідомляємо орієнтовний час при записі.",
    },
    {
      q: "Чи надаєте ви гарантію на роботи?",
      a: "Так, ми даємо гарантію від 6 місяців до 2 років на всі виконані роботи та встановлені запчастини. Термін гарантії залежить від типу послуги.",
    },
    {
      q: "Які марки автомобілів ви обслуговуєте?",
      a: "Ми обслуговуємо автомобілі всіх популярних марок: BMW, Mercedes, Audi, Volkswagen, Toyota, Honda, Hyundai, Kia та інші.",
    },
    {
      q: "Чи можна залишити авто на ніч?",
      a: "Так, у нас є охоронювана стоянка. Ви можете залишити автомобіль на ніч або на кілька днів, якщо ремонт потребує більше часу.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans w-full animate-page-fade-in">
      {/* HEADER */}
      <motion.header
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto flex h-16 md:h-18 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <Wrench className="size-4.5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">WagGarage</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleScrollTo(e, item.id)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  activeNavItem === item.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
                {activeNavItem === item.id && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" />
            {!isAuthenticated && (
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-sm font-medium">
                  Увійти
                </Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button className="gap-2 rounded-full h-10 px-5 text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95">
                <span className="hidden sm:inline">Особистий кабінет</span>
                <span className="sm:hidden">Кабінет</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-18" />

      <main className="flex-1 w-full">
        {/* HERO SECTION */}
        <section
          ref={heroRef}
          className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden bg-background"
        >
          <FloatingShapes />

          {/* Grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border/30)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/30)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

          <div className="container relative mx-auto px-4 md:px-6 z-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6 text-center max-w-4xl mx-auto w-full"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <Sparkles className="size-4 text-primary" />
                  <span>Сучасний автосервіс нового покоління</span>
                </div>
              </motion.div>

              {/* Main heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl w-full leading-[1.1]"
              >
                <span className="text-foreground">Професійне</span>
                <br />
                <span className="text-foreground">обслуговування </span>
                <span className="animate-gradient-text">без компромісів</span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed"
              >
                Довірте своє авто професіоналам WagGarage. Швидка діагностика, оригінальні запчастини
                та гарантія на всі види робіт.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto"
              >
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full gap-2.5 rounded-full text-base h-14 px-8 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95 animate-glow-pulse"
                  >
                    <CalendarDays className="size-5" />
                    Записатися онлайн
                  </Button>
                </Link>
                <a
                  href="#services"
                  onClick={(e) => handleScrollTo(e, "services")}
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full text-base h-14 px-8 bg-card/50 backdrop-blur-sm border-border hover:bg-card hover:border-primary/30 transition-all group"
                  >
                    Наші послуги
                    <ChevronRight className="size-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t border-border/50 w-full"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary border-2 border-background flex items-center justify-center text-primary-foreground text-xs font-medium"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span>3 200+ задоволених клієнтів</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="size-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <span className="text-muted-foreground">4.9 на Google</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1"
            >
              <motion.div className="w-1.5 h-2.5 rounded-full bg-primary" />
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURES SECTION */}
        <section
          id="features"
          className="w-full py-20 md:py-28 bg-muted/30 border-y border-border/50 relative overflow-hidden"
        >
          <div className="container mx-auto px-4 md:px-6 w-full relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto w-full">
              {features.map((feature, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <Card className="h-full border-border/50 bg-card/70 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group hover-lift">
                    <CardContent className="p-8 flex flex-col items-center text-center gap-5">
                      <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-500">
                        <feature.icon className="size-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section id="services" className="w-full py-20 md:py-28 bg-background relative overflow-hidden">
          <FloatingShapes />

          <div className="container mx-auto px-4 md:px-6 w-full relative z-10">
            <AnimatedSection className="flex flex-col items-center justify-center space-y-4 text-center mb-16 w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <Zap className="size-4 text-primary" />
                Повний спектр послуг
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
                Популярні послуги
              </h2>
              <p className="max-w-2xl text-muted-foreground md:text-lg">
                Надаємо повний спектр послуг з ремонту та технічного обслуговування автомобілів
                будь-якої складності.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 max-w-6xl mx-auto w-full">
              {services.map((service, i) => (
                <AnimatedSection key={i} delay={i * 0.05}>
                  <Card
                    className={`h-full border-border/50 bg-card hover:border-primary/40 transition-all duration-500 group cursor-pointer hover-lift animate-card-glow`}
                    style={{ animationDelay: `${i * 0.6}s` }}
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-4 h-full min-h-[140px]">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${service.color} group-hover:scale-110 transition-all duration-500`}
                      >
                        <service.icon className="size-6 text-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground leading-tight">{service.title}</h3>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={0.4} className="flex justify-center mt-12">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full gap-2 group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                >
                  Переглянути всі послуги
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </AnimatedSection>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="w-full py-20 md:py-28 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 md:px-6 w-full">
            <AnimatedSection className="flex flex-col items-center justify-center space-y-4 text-center mb-16 w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <Play className="size-4 text-primary" />
                Простий процес
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
                Як ми працюємо
              </h2>
              <p className="max-w-2xl text-muted-foreground md:text-lg">
                4 простих кроки від проблеми з авто до її вирішення. Швидко, зручно та прозоро.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 lg:gap-6 max-w-6xl mx-auto w-full relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent z-0" />

              {steps.map((step, i) => (
                <AnimatedSection key={i} delay={i * 0.15}>
                  <div className="flex flex-col items-center text-center space-y-5 relative z-10">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full bg-card border-4 border-background flex items-center justify-center shadow-xl group transition-transform duration-500 hover:scale-105">
                        <step.icon className="size-12 text-primary group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm ring-4 ring-background shadow-lg">
                        {step.step}
                      </div>
                    </div>
                    <div className="pt-2 px-2">
                      <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="w-full py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.background/5)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.background/5)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          <div className="container mx-auto px-4 md:px-6 w-full relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 max-w-5xl mx-auto w-full">
              {stats.map((stat, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-background/10 rounded-2xl backdrop-blur-sm">
                      <stat.icon className="size-8 text-primary-foreground" />
                    </div>
                    <div className="text-4xl md:text-5xl font-bold tracking-tight">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <span className="text-sm text-background/70 font-medium">{stat.label}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="w-full py-20 md:py-28 bg-background relative overflow-hidden">
          <FloatingShapes />

          <div className="container mx-auto px-4 md:px-6 w-full relative z-10">
            <AnimatedSection className="flex flex-col items-center justify-center space-y-4 text-center mb-16 w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <MessageSquareQuote className="size-4 text-primary" />
                Відгуки клієнтів
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
                Що кажуть наші клієнти
              </h2>
              <p className="max-w-2xl text-muted-foreground md:text-lg">
                Реальні відгуки від людей, які довірили нам свої автомобілі.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
              {testimonials.map((review, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <Card className="h-full bg-card border-border/50 hover:border-primary/30 transition-all duration-500 hover-lift">
                    <CardContent className="p-7 flex flex-col gap-5 h-full">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <MessageSquareQuote className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{review.name}</p>
                          <p className="text-sm text-muted-foreground">{review.car}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: review.rating }).map((_, j) => (
                          <Star key={j} className="size-4 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                      <p className="text-muted-foreground leading-relaxed flex-1">{review.text}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="w-full py-20 md:py-28 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 md:px-6 w-full">
            <AnimatedSection className="flex flex-col items-center justify-center space-y-4 text-center mb-16 w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <Shield className="size-4 text-primary" />
                Питання та відповіді
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
                Часті питання
              </h2>
              <p className="max-w-2xl text-muted-foreground md:text-lg">
                Відповіді на популярні запитання наших клієнтів.
              </p>
            </AnimatedSection>

            <div className="max-w-3xl mx-auto w-full space-y-3">
              {faqs.map((faq, i) => (
                <AnimatedSection key={i} delay={i * 0.05}>
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-primary/30">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                      className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
                    >
                      <span className="font-semibold text-foreground pr-4">{faq.q}</span>
                      <div
                        className={`p-2 rounded-full bg-muted transition-all duration-300 ${
                          openFaqIndex === i ? "bg-primary text-primary-foreground rotate-180" : ""
                        }`}
                      >
                        <ChevronDown className="size-4" />
                      </div>
                    </button>
                    <AnimatePresence>
                      {openFaqIndex === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <p className="px-6 pb-6 text-muted-foreground leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-24 md:py-32 bg-foreground text-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.background/5)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.background/5)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[128px] opacity-50" />

          <div className="container mx-auto px-4 md:px-6 relative z-10 w-full">
            <AnimatedSection className="flex flex-col items-center justify-center text-center gap-8 max-w-3xl mx-auto w-full">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Готові записатися на сервіс?
              </h2>
              <p className="text-lg md:text-xl text-background/70 max-w-2xl">
                Реєструйтесь в нашому CRM-кабінеті, щоб легко керувати історією авто та записуватись
                онлайн в будь-який час.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                {!isAuthenticated ? (
                  <>
                    <Link href="/register">
                      <Button
                        size="lg"
                        className="rounded-full shadow-xl gap-2 h-14 px-8 text-base bg-background text-foreground hover:bg-background/90 transition-all hover:scale-105 active:scale-95"
                      >
                        <Sparkles className="size-5" />
                        Реєстрація клієнта
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full h-14 px-8 text-base border-background/30 text-background hover:bg-background/10 transition-all"
                      >
                        Увійти
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="rounded-full shadow-xl gap-2 h-14 px-8 text-base bg-background text-foreground hover:bg-background/90 transition-all hover:scale-105 active:scale-95"
                    >
                      Перейти в кабінет
                      <ArrowRight className="size-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="contacts" className="w-full bg-card border-t border-border py-16">
        <div className="container mx-auto px-4 md:px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 w-full">
            <div className="space-y-5 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                  <Wrench className="size-4.5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">WagGarage</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ваш надійний партнер у питаннях автосервісу. Працюємо для вас з 2012 року.
              </p>
              <div className="flex gap-3">
                {["facebook", "instagram", "youtube"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social}
                  >
                    <span className="text-xs font-bold uppercase">{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <h4 className="font-semibold text-foreground">Контакти</h4>
              <ul className="space-y-3 text-sm text-muted-foreground w-full">
                <li className="flex items-center gap-3">
                  <Phone className="size-4 text-primary shrink-0" />
                  +380 (99) 123-45-67
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="size-4 text-primary shrink-0" />
                  info@waggarage.com
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                  м. Запоріжжя, вул. Перемоги, 20
                </li>
              </ul>
            </div>

            <div className="space-y-5">
              <h4 className="font-semibold text-foreground">Графік роботи</h4>
              <ul className="space-y-3 text-sm text-muted-foreground w-full">
                <li className="flex justify-between max-w-[180px]">
                  <span>Пн-Пт:</span> <span className="font-medium">09:00 - 19:00</span>
                </li>
                <li className="flex justify-between max-w-[180px]">
                  <span>Сб:</span> <span className="font-medium">10:00 - 16:00</span>
                </li>
                <li className="flex justify-between max-w-[180px]">
                  <span>Нд:</span> <span className="text-muted-foreground/60">Вихідний</span>
                </li>
              </ul>
            </div>

            <div className="space-y-5">
              <h4 className="font-semibold text-foreground">Клієнтам</h4>
              <ul className="space-y-3 text-sm w-full">
                <li>
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-primary transition-colors animated-underline"
                  >
                    Особистий кабінет
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-muted-foreground hover:text-primary transition-colors animated-underline"
                  >
                    Реєстрація
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-primary transition-colors animated-underline"
                  >
                    Запис на сервіс
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} WagGarage CRM. Всі права захищені.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Політика конфіденційності
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Умови використання
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* SCROLL TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTopButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className="rounded-full w-12 h-12 shadow-xl hover:shadow-primary/40 transition-all hover:scale-110 active:scale-95"
              aria-label="Повернутись нагору"
            >
              <ArrowUp className="size-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
